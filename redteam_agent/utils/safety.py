import logging
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional
from pathlib import Path


class AuditLogger:
    """Structured audit logging for security events."""
    
    def __init__(self, run_id: str, log_dir: str = "runs"):
        self.run_id = run_id
        self.log_dir = Path(log_dir) / run_id
        self.log_dir.mkdir(parents=True, exist_ok=True)
        
        # Setup structured logging
        self.logger = logging.getLogger(f"audit_{run_id}")
        self.logger.setLevel(logging.INFO)
        
        # File handler for audit log
        audit_file = self.log_dir / "audit.jsonl"
        handler = logging.FileHandler(audit_file)
        handler.setLevel(logging.INFO)
        
        # JSON formatter
        formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        
        # Prevent duplicate logs
        self.logger.propagate = False

    def log_event(self, event_type: str, agent: str, action: str, 
                  target: Optional[str] = None, status: str = "success", 
                  details: Optional[Dict[str, Any]] = None) -> None:
        """Log a structured audit event."""
        event = {
            "timestamp": datetime.now().isoformat(),
            "run_id": self.run_id,
            "event_type": event_type,
            "agent": agent,
            "action": action,
            "target": target,
            "status": status,
            "details": details or {}
        }
        
        self.logger.info(json.dumps(event))
        
        # Also log to console for visibility
        print(f"[AUDIT] {event_type} | {agent} | {action} | {target} | {status}")


class RateLimiter:
    """Rate limiting for safe scanning operations."""
    
    def __init__(self, max_requests_per_second: float = 2.0):
        self.max_rps = max_requests_per_second
        self.last_request_time = 0.0
        self.request_count = 0
        self.window_start = datetime.now().timestamp()

    def can_proceed(self) -> bool:
        """Check if request can proceed based on rate limit."""
        now = datetime.now().timestamp()
        
        # Reset window every second
        if now - self.window_start >= 1.0:
            self.request_count = 0
            self.window_start = now
        
        if self.request_count < self.max_rps:
            self.request_count += 1
            return True
        
        return False

    def wait_if_needed(self) -> None:
        """Wait if rate limit exceeded."""
        import time
        while not self.can_proceed():
            time.sleep(0.1)


class SafetyGuard:
    """Safety controls and guardrails."""
    
    def __init__(self, audit_logger: AuditLogger):
        self.audit_logger = audit_logger
        self.rate_limiter = RateLimiter()
        self.blocked_targets = set()
        
    def validate_target(self, target_ip: str) -> bool:
        """Validate target is in allowlist and not blocked."""
        import ipaddress
        
        allowlist_cidr = os.getenv("ALLOWLIST_CIDR", "172.18.0.0/16")
        network = ipaddress.ip_network(allowlist_cidr)
        
        try:
            target_addr = ipaddress.ip_address(target_ip)
            if target_addr not in network:
                self.audit_logger.log_event(
                    "BLOCKED_TARGET", "SafetyGuard", "validate_target",
                    target_ip, "blocked", {"reason": "outside_allowlist"}
                )
                return False
                
            if target_ip in self.blocked_targets:
                self.audit_logger.log_event(
                    "BLOCKED_TARGET", "SafetyGuard", "validate_target", 
                    target_ip, "blocked", {"reason": "previously_blocked"}
                )
                return False
                
            return True
            
        except ValueError:
            self.audit_logger.log_event(
                "INVALID_TARGET", "SafetyGuard", "validate_target",
                target_ip, "error", {"reason": "invalid_ip_format"}
            )
            return False
    
    def enforce_rate_limit(self) -> None:
        """Enforce rate limiting."""
        self.rate_limiter.wait_if_needed()
        
    def block_target(self, target_ip: str, reason: str) -> None:
        """Block a target from further scanning."""
        self.blocked_targets.add(target_ip)
        self.audit_logger.log_event(
            "TARGET_BLOCKED", "SafetyGuard", "block_target",
            target_ip, "blocked", {"reason": reason}
        )
    
    def log_scan_attempt(self, target_ip: str, tool: str, dry_run: bool) -> None:
        """Log a scan attempt."""
        self.audit_logger.log_event(
            "SCAN_ATTEMPT", "SafetyGuard", "log_scan_attempt",
            target_ip, "attempted", {
                "tool": tool,
                "dry_run": dry_run,
                "rate_limited": not self.rate_limiter.can_proceed()
            }
        )
