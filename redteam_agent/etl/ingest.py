import json
import os
from pathlib import Path
from typing import Dict, Any, List

from neo4j import GraphDatabase


NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASS = os.getenv("NEO4J_PASS", "test12345")


def upsert_vulnerability(tx, vuln: Dict[str, Any]) -> None:
    """Upsert vulnerability with full product/version relationships."""
    cypher = """
    MERGE (v:Vulnerability {cve_id: $cve_id})
    SET v.summary = $summary,
        v.cvss_v3 = $cvss_v3,
        v.epss = $epss,
        v.kev = $kev,
        v.published_date = date($published_date)
    """
    tx.run(
        cypher,
        cve_id=vuln["cve_id"],
        summary=vuln.get("summary"),
        cvss_v3=vuln.get("cvss_v3"),
        epss=vuln.get("epss"),
        kev=vuln.get("kev", False),
        published_date=vuln.get("published_date", "1970-01-01"),
    )
    
    # Handle products and versions
    products = vuln.get("products", [])
    for product_data in products:
        # Create Product node
        product_cypher = """
        MERGE (p:Product {name: $name, vendor: $vendor})
        SET p.cpe = $cpe
        """
        tx.run(
            product_cypher,
            name=product_data["name"],
            vendor=product_data["vendor"],
            cpe=product_data["cpe"]
        )
        
        # Create Version nodes and relationships
        versions = product_data.get("versions", [])
        for version in versions:
            version_cypher = """
            MERGE (ver:Version {version: $version})
            SET ver.semver_normalized = $version
            """
            tx.run(version_cypher, version=version)
            
            # Create relationships
            rel_cypher = """
            MATCH (p:Product {name: $name, vendor: $vendor})
            MATCH (ver:Version {version: $version})
            MERGE (p)-[:HAS_VERSION]->(ver)
            """
            tx.run(rel_cypher, name=product_data["name"], vendor=product_data["vendor"], version=version)
            
            # Link vulnerability to product
            vuln_rel_cypher = """
            MATCH (v:Vulnerability {cve_id: $cve_id})
            MATCH (p:Product {name: $name, vendor: $vendor})
            MERGE (v)-[:AFFECTS]->(p)
            """
            tx.run(vuln_rel_cypher, cve_id=vuln["cve_id"], name=product_data["name"], vendor=product_data["vendor"])


def ingest_file(path: str) -> None:
    """Ingest comprehensive vulnerability data."""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    with driver.session() as session:
        data = json.load(open(path))
        vulnerabilities = data.get("vulnerabilities", [])
        
        print(f"Ingesting {len(vulnerabilities)} vulnerabilities...")
        
        for vuln in vulnerabilities:
            try:
                session.execute_write(upsert_vulnerability, vuln)
                print(f"✓ Ingested {vuln['cve_id']}")
            except Exception as e:
                print(f"✗ Failed to ingest {vuln['cve_id']}: {e}")
        
        print(f"Completed ingestion of {len(vulnerabilities)} vulnerabilities")


def create_sample_assets(tx) -> None:
    """Create sample assets for testing."""
    assets = [
        {"asset_id": "web-01", "ip": "172.18.0.3", "hostname": "juice-shop", "os": "linux", "services": ["nginx:1.22.0", "nodejs:18.16.0"]},
        {"asset_id": "db-01", "ip": "172.18.0.4", "hostname": "database", "os": "linux", "services": ["mongodb:6.0.6", "redis:7.0.12"]},
        {"asset_id": "app-01", "ip": "172.18.0.5", "hostname": "application", "os": "linux", "services": ["apache:2.4.57", "php:8.1.25"]},
    ]
    
    for asset in assets:
        asset_cypher = """
        MERGE (a:Asset {asset_id: $asset_id})
        SET a.ip = $ip, a.hostname = $hostname, a.os = $os
        """
        tx.run(asset_cypher, **asset)
        
        # Link assets to services
        for service in asset["services"]:
            service_name, version = service.split(":")
            service_cypher = """
            MATCH (a:Asset {asset_id: $asset_id})
            MATCH (p:Product {name: $service_name})
            MATCH (ver:Version {version: $version})
            MERGE (a)-[:RUNS]->(ver)
            MERGE (a)-[:HAS_SOFTWARE]->(p)
            """
            tx.run(service_cypher, asset_id=asset["asset_id"], service_name=service_name, version=version)


def seed_sample_data() -> None:
    """Seed sample assets and link them to vulnerabilities."""
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))
    with driver.session() as session:
        session.execute_write(create_sample_assets)
        print("✓ Created sample assets")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--file", default="redteam_agent/data/feeds/comprehensive_vulns.json")
    parser.add_argument("--seed-assets", action="store_true", help="Create sample assets")
    args = parser.parse_args()
    
    if args.seed_assets:
        seed_sample_data()
    else:
        ingest_file(args.file)