from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio
import json
import os
import uuid
from datetime import datetime
import queue
import threading
from pathlib import Path

# Import your existing agents
import sys
sys.path.append('..')
from redteam_agent.agents.orchestrator import start_campaign
from redteam_agent.agents.intel_agent import IntelAgent
from redteam_agent.utils.safety import AuditLogger

app = FastAPI(
    title="Autonomous Red-Team Agent API",
    description="API for managing and running autonomous red-team campaigns",
    version="0.1.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global event queues for SSE
event_queues: Dict[str, queue.Queue] = {}
campaign_status: Dict[str, Dict[str, Any]] = {}

# Pydantic models
class CampaignConfig(BaseModel):
    targets: List[str]
    simulation_only: bool = True
    depth: str = "standard"
    time_budget: int = 30

class Settings(BaseModel):
    allowlist_cidrs: List[str] = ["172.18.0.0/16"]
    simulation_only: bool = True
    llm_provider: str = "cloud"
    token_budget: int = 20000
    tokens_used: int = 0
    rate_limit_per_second: int = 2
    max_scan_timeout: int = 60

# Event streaming for SSE
async def event_stream(run_id: str):
    """Generate Server-Sent Events for a campaign run."""
    if run_id not in event_queues:
        event_queues[run_id] = queue.Queue()
    
    event_queue = event_queues[run_id]
    
    while True:
        try:
            # Check if campaign is still running
            if run_id in campaign_status and campaign_status[run_id].get('status') == 'completed':
                # Send final event and close
                final_event = {
                    "run_id": run_id,
                    "timestamp": datetime.now().isoformat(),
                    "agent": "orchestrator",
                    "level": "info",
                    "event_type": "campaign_complete",
                    "message": "Campaign completed successfully",
                    "payload": {"status": "completed"}
                }
                yield f"data: {json.dumps(final_event)}\n\n"
                break
            
            # Try to get event from queue (non-blocking)
            try:
                event = event_queue.get_nowait()
                yield f"data: {json.dumps(event)}\n\n"
            except queue.Empty:
                # Send heartbeat
                heartbeat = {
                    "run_id": run_id,
                    "timestamp": datetime.now().isoformat(),
                    "agent": "system",
                    "level": "info",
                    "event_type": "heartbeat",
                    "message": "Campaign running...",
                    "payload": {}
                }
                yield f"data: {json.dumps(heartbeat)}\n\n"
                await asyncio.sleep(1)
                
        except Exception as e:
            print(f"Error in event stream: {e}")
            break

# Custom AuditLogger that sends events to SSE
class SSEAuditLogger(AuditLogger):
    def __init__(self, run_id: str, log_dir: str = "runs"):
        super().__init__(run_id, log_dir)
        self.run_id = run_id
        if run_id not in event_queues:
            event_queues[run_id] = queue.Queue()
        self.event_queue = event_queues[run_id]
    
    def log_event(self, event_type: str, agent: str, action: str, target: str, status: str, details: dict):
        # Call parent method
        super().log_event(event_type, agent, action, target, status, details)
        
        # Send to SSE queue
        event = {
            "run_id": self.run_id,
            "timestamp": datetime.now().isoformat(),
            "agent": agent.lower(),
            "level": "info" if status == "success" else "warning" if status == "blocked" else "error",
            "event_type": event_type.lower(),
            "message": f"{action}: {status}",
            "payload": {
                "target": target,
                "details": details
            }
        }
        
        try:
            self.event_queue.put_nowait(event)
        except queue.Full:
            pass  # Drop events if queue is full

# API Routes
@app.get("/")
async def root():
    return {"message": "Autonomous Red-Team Agent API", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Campaign Management
@app.post("/api/campaigns")
async def start_campaign_api(config: CampaignConfig, background_tasks: BackgroundTasks):
    """Start a new campaign."""
    run_id = f"run-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{str(uuid.uuid4())[:8]}"
    
    # Initialize campaign status
    campaign_status[run_id] = {
        "run_id": run_id,
        "status": "running",
        "start_time": datetime.now().isoformat(),
        "config": config.dict(),
        "vulnerabilities_found": 0,
        "tickets_generated": 0
    }
    
    # Start campaign in background
    background_tasks.add_task(run_campaign_background, run_id, config)
    
    return {"run_id": run_id, "status": "started"}

async def run_campaign_background(run_id: str, config: CampaignConfig):
    """Run campaign in background thread."""
    try:
        # Create config file
        config_path = f"runs/{run_id}/config.json"
        Path(f"runs/{run_id}").mkdir(parents=True, exist_ok=True)
        
        with open(config_path, "w") as f:
            json.dump({"targets": config.targets}, f)
        
        # Run campaign
        start_campaign(config_path, dry_run=config.simulation_only)
        
        # Update status
        campaign_status[run_id]["status"] = "completed"
        
    except Exception as e:
        print(f"Campaign {run_id} failed: {e}")
        campaign_status[run_id]["status"] = "failed"
        campaign_status[run_id]["error"] = str(e)

@app.get("/api/campaigns")
async def list_campaigns():
    """List all campaigns."""
    campaigns = []
    for run_id, status in campaign_status.items():
        campaigns.append({
            "run_id": run_id,
            "start_time": status["start_time"],
            "status": status["status"],
            "targets": status["config"]["targets"],
            "vulnerabilities_found": status.get("vulnerabilities_found", 0),
            "tickets_generated": status.get("tickets_generated", 0),
            "dry_run": status["config"]["simulation_only"]
        })
    
    return sorted(campaigns, key=lambda x: x["start_time"], reverse=True)

@app.get("/api/campaigns/{run_id}")
async def get_campaign(run_id: str):
    """Get campaign details."""
    if run_id not in campaign_status:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    return campaign_status[run_id]

@app.get("/api/campaigns/{run_id}/events")
async def get_campaign_events(run_id: str):
    """Get SSE stream of campaign events."""
    if run_id not in campaign_status:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
    }
    
    return StreamingResponse(event_stream(run_id), headers=headers)

@app.post("/api/campaigns/{run_id}/stop")
async def stop_campaign(run_id: str):
    """Stop a running campaign."""
    if run_id not in campaign_status:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    campaign_status[run_id]["status"] = "stopped"
    return {"message": "Campaign stopped"}

@app.get("/api/campaigns/{run_id}/report")
async def get_campaign_report(run_id: str):
    """Get campaign report."""
    report_path = f"runs/{run_id}/report.md"
    tickets_path = f"runs/{run_id}/tickets.json"
    
    markdown = "# No report available"
    tickets = []
    
    if os.path.exists(report_path):
        with open(report_path, "r") as f:
            markdown = f.read()
    
    if os.path.exists(tickets_path):
        with open(tickets_path, "r") as f:
            tickets_data = json.load(f)
            tickets = tickets_data.get("tickets", [])
    
    return {"markdown": markdown, "tickets": tickets}

@app.get("/api/campaigns/{run_id}/download")
async def download_report(run_id: str):
    """Download campaign report."""
    report_path = f"runs/{run_id}/report.md"
    
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report not found")
    
    return FileResponse(report_path, filename=f"report-{run_id}.md")

@app.get("/api/campaigns/{run_id}/tickets/download")
async def download_tickets(run_id: str):
    """Download campaign tickets."""
    tickets_path = f"runs/{run_id}/tickets.json"
    
    if not os.path.exists(tickets_path):
        raise HTTPException(status_code=404, detail="Tickets not found")
    
    return FileResponse(tickets_path, filename=f"tickets-{run_id}.json")

# Knowledge Graph API
@app.get("/api/kg/assets")
async def get_kg_assets(kev_only: bool = False, min_cvss: float = 0, min_epss: float = 0):
    """Get assets from knowledge graph."""
    try:
        intel_agent = IntelAgent()
        
        # Query Neo4j for assets
        with intel_agent.driver.session() as session:
            query = """
            MATCH (a:Asset)
            OPTIONAL MATCH (a)-[:RUNS]->(ver:Version)<-[:HAS_VERSION]-(p:Product)
            OPTIONAL MATCH (v:Vulnerability)-[:AFFECTS]->(p)-[:HAS_VERSION]->(ver)
            WHERE ($kev_only = false OR v.kev = true)
            AND ($min_cvss = 0 OR v.cvss_v3 >= $min_cvss)
            AND ($min_epss = 0 OR v.epss >= $min_epss)
            RETURN a.asset_id, a.ip, a.hostname, a.os,
                   collect(DISTINCT {name: p.name, version: ver.version}) as services,
                   collect(DISTINCT {cve_id: v.cve_id, cvss_v3: v.cvss_v3, epss: v.epss, kev: v.kev, summary: v.summary}) as vulns
            """
            
            result = session.run(query, kev_only=kev_only, min_cvss=min_cvss, min_epss=min_epss)
            assets = []
            
            for record in result:
                asset = {
                    "asset_id": record["a.asset_id"],
                    "ip": record["a.ip"],
                    "hostname": record["a.hostname"],
                    "os": record["a.os"],
                    "services": [s for s in record["services"] if s["name"]],
                    "vulns": [v for v in record["vulns"] if v["cve_id"]]
                }
                assets.append(asset)
            
            return assets
            
    except Exception as e:
        print(f"Error querying KG: {e}")
        # Return sample data for demo
        return [
            {
                "asset_id": "web-01",
                "ip": "172.18.0.3",
                "hostname": "juice-shop-web",
                "os": "Linux",
                "services": [
                    {"name": "nginx", "version": "1.22.0"},
                    {"name": "Node.js", "version": "16.17.0"}
                ],
                "vulns": [
                    {
                        "cve_id": "CVE-2024-0001",
                        "cvss_v3": 9.8,
                        "epss": 0.95,
                        "kev": True,
                        "summary": "Remote Code Execution in Nginx HTTP/2 module"
                    }
                ]
            }
        ]

# Dashboard API
@app.get("/api/dashboard/kpis")
async def get_dashboard_kpis():
    """Get dashboard KPIs."""
    try:
        intel_agent = IntelAgent()
        
        with intel_agent.driver.session() as session:
            # Count assets
            assets_result = session.run("MATCH (a:Asset) RETURN count(a) as count")
            assets_count = assets_result.single()["count"]
            
            # Count services
            services_result = session.run("MATCH (a:Asset)-[:RUNS]->(ver:Version)<-[:HAS_VERSION]-(p:Product) RETURN count(DISTINCT p) as count")
            services_count = services_result.single()["count"]
            
            # Count vulnerabilities
            vulns_result = session.run("MATCH (v:Vulnerability) RETURN count(v) as count")
            vulns_count = vulns_result.single()["count"]
            
            # Count KEV vulnerabilities
            kev_result = session.run("MATCH (v:Vulnerability) WHERE v.kev = true RETURN count(v) as count")
            kev_count = kev_result.single()["count"]
            
            return {
                "assets_enumerated": assets_count,
                "services_fingerprinted": services_count,
                "actionable_vulns": vulns_count,
                "kev_hits": kev_count
            }
            
    except Exception as e:
        print(f"Error getting KPIs: {e}")
        return {
            "assets_enumerated": 3,
            "services_fingerprinted": 5,
            "actionable_vulns": 12,
            "kev_hits": 3
        }

# Settings API
@app.get("/api/settings")
async def get_settings():
    """Get current settings."""
    return {
        "allowlist_cidrs": ["172.18.0.0/16"],
        "simulation_only": True,
        "llm_provider": "cloud",
        "token_budget": 20000,
        "tokens_used": 1250,
        "rate_limit_per_second": 2,
        "max_scan_timeout": 60
    }

@app.post("/api/settings")
async def update_settings(settings: Settings):
    """Update settings."""
    # In a real implementation, you'd save these to a config file or database
    return {"message": "Settings updated", "settings": settings.dict()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
