import pytest
from redteam_agent.tools.safe_nmap import check_allowlist, parse_nmap_output, safe_nmap_scan
from redteam_agent.utils.safety import AuditLogger
import os
from unittest.mock import MagicMock

class TestSafeNmap:
    def test_check_allowlist_valid_ip(self, test_env_vars):
        assert check_allowlist("172.18.0.10") is True

    def test_check_allowlist_invalid_ip(self, test_env_vars):
        assert check_allowlist("192.168.1.1") is False

    def test_parse_nmap_output_valid(self):
        nmap_output = """
        Nmap scan report for 172.18.0.3
        Host is up (0.00020s latency).
        PORT   STATE SERVICE VERSION
        80/tcp open  http    nginx 1.22.0
        443/tcp open https   nginx
        """
        expected = {
            "open_ports": [80, 443],
            "services": {
                80: {"protocol": "tcp", "service": "http", "version": "nginx 1.22.0"},
                443: {"protocol": "tcp", "service": "https", "version": "nginx"},
            },
        }
        assert parse_nmap_output(nmap_output) == expected

    def test_safe_nmap_scan_dry_run(self, test_env_vars):
        result = safe_nmap_scan("172.18.0.10", "80", dry_run=True)
        assert result["status"] == "dry-run"
        assert result["target"] == "172.18.0.10"

    def test_safe_nmap_scan_outside_allowlist(self, test_env_vars):
        result = safe_nmap_scan("192.168.1.1", "80", dry_run=False)
        assert result["status"] == "error"
        assert "not in allowlist" in result["reason"]