import subprocess
import ipaddress
import os
import json
import re
from typing import Dict, Any, List, Optional
from redteam_agent.utils.safety import SafetyGuard, AuditLogger


ALLOWLIST_CIDR = os.getenv("ALLOWLIST_CIDR", "172.18.0.0/16")


def check_allowlist(ip: str) -> bool:
    network = ipaddress.ip_network(ALLOWLIST_CIDR)
    return ipaddress.ip_address(ip) in network


def parse_nmap_output(output: str) -> Dict[str, Any]:
    """Parse nmap output into structured data."""
    lines = output.split('\n')
    open_ports = []
    services = {}
    
    for line in lines:
        # Parse port lines like "80/tcp   open  http    nginx 1.22.0"
        port_match = re.search(r'(\d+)/(tcp|udp)\s+open\s+(\w+)(?:\s+(.+))?', line)
        if port_match:
            port = int(port_match.group(1))
            protocol = port_match.group(2)
            service = port_match.group(3)
            version = port_match.group(4) if port_match.group(4) else ""
            
            open_ports.append(port)
            services[port] = {
                "protocol": protocol,
                "service": service,
                "version": version.strip()
            }
    
    return {
        "open_ports": open_ports,
        "services": services
    }


def safe_nmap_scan(target_ip: str, ports: str = "1-1024", dry_run: bool = True, 
                  audit_logger: Optional[AuditLogger] = None) -> Dict[str, Any]:
    """Safe nmap scan with comprehensive safety controls."""
    
    # TODO: Add more sophisticated rate limiting
    # FIXME: This basic check might not catch all edge cases
    
    # Safety validation
    if not check_allowlist(target_ip):
        if audit_logger:
            audit_logger.log_event(
                "SCAN_BLOCKED", "safe_nmap", "scan",
                target_ip, "blocked", {"reason": "outside_allowlist"}
            )
        return {"status": "error", "reason": "target not in allowlist"}
    
    if dry_run:
        if audit_logger:
            audit_logger.log_event(
                "SCAN_DRY_RUN", "safe_nmap", "scan",
                target_ip, "dry_run", {"ports": ports}
            )
        return {"status": "dry-run", "target": target_ip, "ports": ports}
    
    # Rate limiting
    if audit_logger:
        audit_logger.log_event(
            "SCAN_ATTEMPT", "safe_nmap", "scan",
            target_ip, "attempted", {"ports": ports, "dry_run": False}
        )
    
    # For real scanning, use safe flags
    # TODO: Make these flags configurable
    # FIXME: Some flags might be too aggressive for certain networks
    cmd = [
        "nmap", 
        "-sS",  # SYN scan
        "-p", ports,
        "--max-retries", "1",
        "--host-timeout", "30s",
        "--max-scan-delay", "1s",
        "--script-timeout", "10s",
        target_ip
    ]
    
    try:
        # TODO: Add progress reporting for long scans
        output = subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=60)
        raw_output = output.decode("utf-8")
        parsed = parse_nmap_output(raw_output)
        
        if audit_logger:
            audit_logger.log_event(
                "SCAN_SUCCESS", "safe_nmap", "scan",
                target_ip, "success", {
                    "ports_scanned": ports,
                    "open_ports": parsed["open_ports"],
                    "services_found": len(parsed["services"])
                }
            )
        
        return {
            "status": "ok", 
            "target": target_ip,
            "ports": ports,
            "raw": raw_output,
            "parsed": parsed
        }
        
    except subprocess.TimeoutExpired:
        if audit_logger:
            audit_logger.log_event(
                "SCAN_TIMEOUT", "safe_nmap", "scan",
                target_ip, "timeout", {"ports": ports}
            )
        return {"status": "error", "reason": "scan timeout"}
        
    except subprocess.CalledProcessError as e:
        error_msg = f"nmap failed: {e.stderr.decode() if e.stderr else str(e)}"
        if audit_logger:
            audit_logger.log_event(
                "SCAN_ERROR", "safe_nmap", "scan",
                target_ip, "error", {"error": error_msg}
            )
        return {"status": "error", "reason": error_msg}
        
    except Exception as exc:
        if audit_logger:
            audit_logger.log_event(
                "SCAN_EXCEPTION", "safe_nmap", "scan",
                target_ip, "exception", {"exception": str(exc)}
            )
        return {"status": "error", "reason": str(exc)}

