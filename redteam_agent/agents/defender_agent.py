from typing import List, Dict, Any


def prioritize_and_ticket(vulns: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Prioritize vulnerabilities and create remediation tickets.
    
    TODO: This scoring algorithm is too simple - need to consider:
    - Asset criticality
    - Exploit availability
    - Patch availability
    - Business impact
    
    FIXME: Hardcoded scoring weights - should be configurable
    """
    def score(v: Dict[str, Any]) -> float:
        # Simple scoring: KEV gets highest priority, then CVSS, then EPSS
        # TODO: Add more sophisticated scoring logic
        kev_bonus = 100.0 if v.get("kev") else 0.0
        cvss_score = float(v.get("cvss_v3", 0))
        epss_score = 10.0 * float(v.get("epss", 0))  # Scale EPSS to 0-10 range
        
        return kev_bonus + cvss_score + epss_score

    # Sort by priority score (highest first)
    sorted_vulns = sorted(vulns, key=score, reverse=True)

    tickets = []
    for vuln in sorted_vulns:
        # TODO: Generate more detailed remediation steps based on CVE
        # FIXME: This is too generic - need vendor-specific guidance
        ticket = {
            "id": vuln["cve_id"],
            "priority": score(vuln),
            "title": f"Remediate {vuln['cve_id']}",
            "evidence": vuln.get("citations", []),  # TODO: Add evidence collection
            "remediation": "Update to the latest vendor-supported version; apply security patches."
        }
        tickets.append(ticket)

    return {"tickets": tickets}