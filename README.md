# Autonomous Red-Team Agent

A lab-only autonomous red-team simulation tool for evaluating security defenses. This project demonstrates automated vulnerability assessment using AI agents and knowledge graphs.

## ⚠️ Lab-Only Usage

**This tool is designed exclusively for lab environments.** It includes safety controls to prevent scanning outside designated networks.

## Features

- **Safe Network Scanning**: Nmap-based reconnaissance with allowlist protection
- **AI-Powered Analysis**: LangChain agents for intelligent vulnerability matching
- **Knowledge Graph**: Neo4j database for vulnerability and asset data
- **Prioritized Remediation**: Automated ticket generation with CVSS/EPSS scoring
- **Audit Logging**: Comprehensive activity tracking for compliance

## Quick Start

1. **Setup Environment**:
   ```bash
   # Install dependencies
   pip install -r requirements.txt
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

2. **Start Lab Infrastructure**:
   ```bash
   make up          # Start Neo4j and OWASP Juice Shop
   make seed_kg     # Load vulnerability data
   ```

3. **Run Demo Campaign**:
   ```bash
   make demo        # Run dry-run campaign
   ```

## Architecture

The system uses a multi-agent approach:

- **Recon Agent**: Performs safe network scanning
- **Intel Agent**: Matches findings against vulnerability database  
- **Defender Agent**: Prioritizes vulnerabilities and generates tickets
- **Orchestrator**: Coordinates the campaign workflow

## Safety Controls

- IP allowlist validation (default: 172.18.0.0/16)
- Rate limiting on scan operations
- Dry-run mode for testing
- Comprehensive audit logging

## Development

```bash
# Run tests
make test

# Code formatting
make format

# Linting
make lint
```

## Known Issues

- Neo4j connection handling needs improvement
- Rate limiting could be more sophisticated
- Test coverage needs expansion
- Performance optimization needed for large datasets

## Contributing

This is a learning project. Feel free to submit issues or improvements!