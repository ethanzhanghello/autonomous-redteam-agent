# Autonomous Red-Team Agent (Lab-Only)

A comprehensive autonomous red-team simulation system that performs safe reconnaissance, vulnerability analysis, and generates prioritized remediation recommendations using AI agents and a Neo4j knowledge graph.

## Features

- **AI-Powered Agents**: LangChain-based Recon, Intel, and Defender agents with OpenAI integration
- **Real Vulnerability Matching**: Neo4j knowledge graph with 15+ realistic CVEs and product relationships
- **Safe Scanning**: Rate-limited, allowlist-enforced nmap scanning with comprehensive safety controls
- **Structured Audit Logging**: Complete audit trail with JSON logging for compliance
- **Prioritized Remediation**: CVSS + EPSS + KEV scoring for actionable security tickets
- **Lab-Only Safety**: All operations restricted to Docker lab networks (172.18.0.0/16)

## Quickstart

1) **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2) **Start lab services:**
   ```bash
   make up
   ```

3) **Apply schema and seed comprehensive data:**
   ```bash
   make schema && make seed_all
   ```

4) **Run autonomous campaign (dry-run):**
   ```bash
   make demo
   ```

5) **Run real scanning (requires nmap):**
   ```bash
   python3 -m redteam_agent.agents.orchestrator --config redteam_agent/demo/demo_config.json
   ```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Recon Agent   │───▶│   Intel Agent   │───▶│ Defender Agent  │
│  (LangChain +   │    │ (Neo4j Queries) │    │ (Prioritization)│
│   Safe nmap)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Safety Guards  │    │  Neo4j Knowledge │    │  Report Gen      │
│ (Rate limiting, │    │      Graph       │    │ (Tickets + MD)   │
│  Allowlist)     │    │  (15+ CVEs)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Outputs

- **Campaign Reports**: `runs/{run_id}/report.md`
- **Remediation Tickets**: `runs/{run_id}/tickets.json`
- **Audit Logs**: `runs/{run_id}/audit.jsonl`
- **Metadata**: `runs/{run_id}/metadata.json`

## Safety & Ethics

- **Lab-Only**: All scanning restricted to Docker networks (172.18.0.0/16)
- **Rate Limited**: 2 requests/second maximum scanning rate
- **Audit Logged**: Every action logged with timestamps and details
- **Dry-Run Default**: Safe simulation mode by default
- **Allowlist Enforced**: Targets outside allowlist immediately blocked

## Data Sources

- **Comprehensive CVE Dataset**: 15 realistic vulnerabilities with CVSS, EPSS, KEV flags
- **Product Relationships**: nginx, Apache, OpenSSH, WordPress, Redis, Jenkins, Docker, Elasticsearch, MongoDB, GitLab, Node.js, Django, PHP, Kubernetes
- **Sample Assets**: Pre-configured lab assets with known software versions

## Commands

```bash
# Infrastructure
make up              # Start Neo4j + Juice Shop
make schema          # Apply Neo4j constraints/indexes
make seed_all        # Ingest vulnerabilities + sample assets

# Campaigns  
make demo            # Dry-run autonomous campaign
python3 -m redteam_agent.agents.orchestrator --config redteam_agent/demo/demo_config.json --dry-run

# Data Management
python3 -m redteam_agent.etl.ingest --file redteam_agent/data/feeds/comprehensive_vulns.json
python3 -m redteam_agent.etl.ingest --seed-assets
```

## Example Output

**Vulnerability Found:**
- CVE-2023-12345: Remote code execution in nginx 1.22.0 (CVSS: 9.8, EPSS: 0.89, KEV: true)
- Priority Score: 118.7 (KEV + CVSS + EPSS weighted)

**Remediation Ticket:**
```json
{
  "id": "CVE-2023-12345",
  "priority": 118.7,
  "title": "Remediate CVE-2023-12345", 
  "evidence": ["Asset web-01 runs nginx 1.22.0"],
  "remediation": "Update to the latest vendor-supported version; apply security patches."
}
```

## Environment Variables

```bash
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASS=test12345
ALLOWLIST_CIDR=172.18.0.0/16
OPENAI_API_KEY=sk-...
SIMULATION_ONLY=true
MAX_CONCURRENCY=4
```

## Contributing

This is a lab-only security research tool. All scanning is restricted to controlled environments. Never use against systems you don't own.

## License

MIT License - See LICENSE file for details.

