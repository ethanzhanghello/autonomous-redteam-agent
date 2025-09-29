import argparse
import json
from pathlib import Path
import os
from datetime import datetime
import uuid

from redteam_agent.tools.safe_nmap import safe_nmap_scan
from redteam_agent.agents.recon_agent import ReconAgent
from redteam_agent.agents.intel_agent import IntelAgent
from redteam_agent.agents.defender_agent import prioritize_and_ticket
from redteam_agent.report.generate import write_report
from redteam_agent.utils.safety import AuditLogger, SafetyGuard


def start_campaign(config_path: str, dry_run: bool = True) -> None:
    print("Starting campaign with config:", config_path, "dry_run=", dry_run)
    
    # TODO: Add configuration validation
    # FIXME: This should handle malformed config files gracefully
    
    # Create run ID and directory
    run_id = f"run-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"
    run_dir = f"runs/{run_id}"
    Path(run_dir).mkdir(parents=True, exist_ok=True)
    
    # Initialize audit logging and safety controls
    audit_logger = AuditLogger(run_id, "runs")
    safety_guard = SafetyGuard(audit_logger)
    
    # Load config
    cfg_path = Path(config_path)
    cfg = json.load(open(cfg_path))
    targets = cfg.get("targets", [])
    
    print(f"Run ID: {run_id}")
    print(f"Targets: {targets}")
    
    # TODO: Add target validation
    # FIXME: Should validate IP format and allowlist compliance
    
    # Log campaign start
    audit_logger.log_event(
        "CAMPAIGN_START", "Orchestrator", "start_campaign",
        None, "started", {
            "run_id": run_id,
            "targets": targets,
            "dry_run": dry_run
        }
    )
    
    # Initialize agents
    # TODO: Add agent initialization error handling
    recon_agent = ReconAgent()
    intel_agent = IntelAgent()
    
    # Phase 1: Reconnaissance
    fingerprints = []
    for target in targets:
        print(f"\n=== Recon scanning target: {target} ===")
        
        # Safety validation
        if not safety_guard.validate_target(target):
            print(f"Target {target} blocked by safety controls")
            continue
            
        safety_guard.enforce_rate_limit()
        
        if dry_run:
            result = safe_nmap_scan(target_ip=target, dry_run=True, audit_logger=audit_logger)
            print("Dry-run scan result:", result)
            fingerprints.append({
                "target": target, 
                "ports": [80, 443],
                "parsed": {"open_ports": [80, 443], "services": {80: {"service": "http", "version": "nginx 1.22.0"}}}
            })
        else:
            result = recon_agent.scan_target(target)
            print("Recon result:", result)
            if result["status"] == "success":
                # Extract parsed data from recon result
                parsed_data = result.get("parsed", {"open_ports": [], "services": {}})
                fingerprints.append({
                    "target": target,
                    "parsed": parsed_data
                })
    
    # Phase 2: Intelligence Analysis
    print(f"\n=== Intelligence analysis ===")
    audit_logger.log_event(
        "INTEL_ANALYSIS", "Orchestrator", "analyze_fingerprints",
        None, "started", {"fingerprints_count": len(fingerprints)}
    )
    
    # TODO: Add error handling for Neo4j connection failures
    # FIXME: This will crash if Neo4j is down
    vuln_matches = intel_agent.analyze_fingerprints(fingerprints)
    print(f"Found {len(vuln_matches)} vulnerability matches")
    
    audit_logger.log_event(
        "INTEL_ANALYSIS", "Orchestrator", "analyze_fingerprints",
        None, "completed", {"vulnerabilities_found": len(vuln_matches)}
    )
    
    # Phase 3: Defense Recommendations
    print(f"\n=== Defense recommendations ===")
    audit_logger.log_event(
        "DEFENSE_ANALYSIS", "Orchestrator", "prioritize_vulnerabilities",
        None, "started", {"vulnerabilities": len(vuln_matches)}
    )
    
    intel = prioritize_and_ticket(vuln_matches)
    print(f"Generated {len(intel.get('tickets', []))} remediation tickets")
    
    audit_logger.log_event(
        "DEFENSE_ANALYSIS", "Orchestrator", "prioritize_vulnerabilities",
        None, "completed", {"tickets_generated": len(intel.get('tickets', []))}
    )
    
    # Phase 4: Report Generation
    print(f"\n=== Report generation ===")
    write_report(run_dir=run_dir, intel=intel)
    print(f"Report written to {run_dir}")
    
    # Save campaign metadata
    metadata = {
        "run_id": run_id,
        "start_time": datetime.now().isoformat(),
        "targets": targets,
        "dry_run": dry_run,
        "fingerprints": fingerprints,
        "vulnerabilities": vuln_matches,
        "tickets": intel.get("tickets", [])
    }
    
    with open(f"{run_dir}/metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    
    audit_logger.log_event(
        "CAMPAIGN_COMPLETE", "Orchestrator", "start_campaign",
        None, "completed", {
            "run_id": run_id,
            "vulnerabilities_found": len(vuln_matches),
            "tickets_generated": len(intel.get('tickets', []))
        }
    )
    
    print(f"\nCampaign completed. Run ID: {run_id}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="redteam_agent/demo/demo_config.json")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    start_campaign(args.config, dry_run=args.dry_run)

