import pytest
import os
from unittest.mock import Mock, patch, MagicMock
from typing import Dict, Any, List
import json


@pytest.fixture
def sample_vulnerability():
    """Sample vulnerability data for testing."""
    return {
        "cve_id": "CVE-2023-12345",
        "summary": "Test vulnerability",
        "cvss_v3": 7.5,
        "epss": 0.45,
        "kev": True,
        "published_date": "2023-01-01"
    }


@pytest.fixture
def sample_asset():
    """Sample asset data for testing."""
    return {
        "asset_id": "test-asset-01",
        "ip": "172.18.0.100",
        "hostname": "test-host",
        "os": "linux",
        "software": [
            {"product": "nginx", "version": "1.22.0"},
            {"product": "nodejs", "version": "18.16.0"}
        ]
    }


@pytest.fixture
def sample_fingerprint():
    """Sample fingerprint data for testing."""
    return {
        "target": "172.18.0.100",
        "parsed": {
            "open_ports": [80, 443],
            "services": {
                80: {"service": "http", "version": "nginx 1.22.0"},
                443: {"service": "https", "version": "nginx 1.22.0"}
            }
        }
    }


@pytest.fixture
def mock_neo4j_driver():
    """Mock Neo4j driver for testing."""
    mock_driver = Mock()
    mock_session = Mock()
    mock_driver.session.return_value.__enter__.return_value = mock_session
    mock_driver.session.return_value.__exit__.return_value = None
    return mock_driver, mock_session


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing."""
    with patch('redteam_agent.agents.intel_agent.ChatOpenAI') as mock:
        mock_instance = Mock()
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def test_env_vars():
    """Set test environment variables."""
    test_vars = {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASS": "test12345",
        "OPENAI_API_KEY": "sk-test-key",
        "ALLOWLIST_CIDR": "172.18.0.0/16"
    }
    
    with patch.dict(os.environ, test_vars):
        yield test_vars


@pytest.fixture
def sample_campaign_config():
    """Sample campaign configuration."""
    return {
        "targets": ["172.18.0.100", "172.18.0.101"],
        "scan_options": {
            "ports": "1-1024",
            "timeout": 30
        },
        "dry_run": True
    }
