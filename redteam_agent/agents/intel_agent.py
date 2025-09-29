from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.tools import tool
import os
import json
from neo4j import GraphDatabase


class IntelAgent:
    def __init__(self):
        # TODO: Add connection pooling for better performance
        # FIXME: Hardcoded credentials - should use proper secret management
        self.llm = ChatOpenAI(
            model="gpt-4o-mini", 
            temperature=0.1,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.neo4j_user = os.getenv("NEO4J_USER", "neo4j")
        self.neo4j_pass = os.getenv("NEO4J_PASS", "test12345")
        
        # TODO: Add retry logic and connection error handling
        # FIXME: This will fail if Neo4j is down - need graceful degradation
        self.driver = GraphDatabase.driver(self.neo4j_uri, auth=(self.neo4j_user, self.neo4j_pass))

    @tool
    def query_vulnerabilities(self, product_name: str, version: str) -> str:
        """Query Neo4j for vulnerabilities affecting a specific product/version."""
        query = """
        MATCH (v:Vulnerability)-[:AFFECTS]->(p:Product)-[:HAS_VERSION]->(ver:Version)
        WHERE p.name CONTAINS $product_name AND ver.version = $version
        RETURN v.cve_id, v.summary, v.cvss_v3, v.epss, v.kev, v.published_date
        ORDER BY v.cvss_v3 DESC
        LIMIT 10
        """
        
        with self.driver.session() as session:
            result = session.run(query, product_name=product_name, version=version)
            vulns = [dict(record) for record in result]
            return json.dumps(vulns)

    @tool
    def query_assets_by_ip(self, target_ip: str) -> str:
        """Query Neo4j for assets and their software at a specific IP."""
        query = """
        MATCH (a:Asset {ip: $ip})
        OPTIONAL MATCH (a)-[:RUNS]->(ver:Version)<-[:HAS_VERSION]-(p:Product)
        RETURN a.asset_id, a.hostname, a.os, 
               collect({product: p.name, version: ver.version}) as software
        """
        
        with self.driver.session() as session:
            result = session.run(query, ip=target_ip)
            assets = [dict(record) for record in result]
            return json.dumps(assets)

    def analyze_fingerprints(self, fingerprints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze service fingerprints and match to vulnerabilities."""
        results = []
        
        # TODO: Add caching for repeated queries
        # FIXME: This is inefficient for large fingerprint sets
        
        for fp in fingerprints:
            target = fp.get("target")
            parsed_data = fp.get("parsed", {})
            open_ports = parsed_data.get("open_ports", [])
            services = parsed_data.get("services", {})
            
            print(f"Analyzing fingerprints for {target}: ports={open_ports}, services={services}")
            
            # Query assets at this IP (direct call, not through LangChain tool)
            with self.driver.session() as session:
                query = """
                MATCH (a:Asset {ip: $ip})
                OPTIONAL MATCH (a)-[:RUNS]->(ver:Version)<-[:HAS_VERSION]-(p:Product)
                RETURN a.asset_id, a.hostname, a.os, 
                       collect({product: p.name, version: ver.version}) as software
                """
                result = session.run(query, ip=target)
                assets = [dict(record) for record in result]
            
            for asset in assets:
                software_list = asset.get("software", [])
                for software in software_list:
                    if software.get("product") and software.get("version"):
                        product_name = software["product"]
                        version = software["version"]
                        
                        # Query vulnerabilities for this product/version (direct call)
                        with self.driver.session() as session:
                            vuln_query = """
                            MATCH (v:Vulnerability)-[:AFFECTS]->(p:Product)-[:HAS_VERSION]->(ver:Version)
                            WHERE p.name CONTAINS $product_name AND ver.version = $version
                            RETURN v.cve_id, v.summary, v.cvss_v3, v.epss, v.kev, v.published_date
                            ORDER BY v.cvss_v3 DESC
                            LIMIT 10
                            """
                            vuln_result = session.run(vuln_query, product_name=product_name, version=version)
                            vulns = []
                            for record in vuln_result:
                                vuln_dict = {
                                    "cve_id": record["v.cve_id"],
                                    "summary": record["v.summary"],
                                    "cvss_v3": record["v.cvss_v3"],
                                    "epss": record["v.epss"],
                                    "kev": record["v.kev"],
                                    "published_date": record["v.published_date"]
                                }
                                vulns.append(vuln_dict)
                        
                        for vuln in vulns:
                            results.append({
                                "target": target,
                                "asset_id": asset.get("asset_id"),
                                "cve_id": vuln["cve_id"],
                                "summary": vuln["summary"],
                                "cvss_v3": vuln["cvss_v3"],
                                "epss": vuln["epss"],
                                "kev": vuln["kev"],
                                "confidence": 0.9,  # High confidence for KG matches
                                "evidence": f"Asset {asset.get('asset_id')} runs {product_name} {version}",
                                "product": product_name,
                                "version": version
                            })
            
            # Fallback: analyze based on port fingerprints
            if not results and open_ports:
                for port, service_info in services.items():
                    service_name = service_info.get("service", "").lower()
                    version = service_info.get("version", "")
                    
                    if service_name in ["http", "https", "nginx", "apache"]:
                        # Try common web server vulnerabilities (direct call)
                        with self.driver.session() as session:
                            vuln_query = """
                            MATCH (v:Vulnerability)-[:AFFECTS]->(p:Product)-[:HAS_VERSION]->(ver:Version)
                            WHERE p.name CONTAINS $product_name AND ver.version = $version
                            RETURN v.cve_id, v.summary, v.cvss_v3, v.epss, v.kev, v.published_date
                            ORDER BY v.cvss_v3 DESC
                            LIMIT 10
                            """
                            vuln_result = session.run(vuln_query, product_name="nginx", version="1.22.0")
                            vulns = []
                            for record in vuln_result:
                                vuln_dict = {
                                    "cve_id": record["v.cve_id"],
                                    "summary": record["v.summary"],
                                    "cvss_v3": record["v.cvss_v3"],
                                    "epss": record["v.epss"],
                                    "kev": record["v.kev"],
                                    "published_date": record["v.published_date"]
                                }
                                vulns.append(vuln_dict)
                        
                        for vuln in vulns:
                            results.append({
                                "target": target,
                                "cve_id": vuln["cve_id"],
                                "summary": vuln["summary"],
                                "cvss_v3": vuln["cvss_v3"],
                                "epss": vuln["epss"],
                                "kev": vuln["kev"],
                                "confidence": 0.6,  # Lower confidence for inferred matches
                                "evidence": f"Port {port} service fingerprint: {service_name} {version}",
                                "product": service_name,
                                "version": version
                            })
        
        return results

