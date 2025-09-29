from typing import List, Dict, Any, Optional
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.tools import tool
import os
import json
from redteam_agent.tools.safe_nmap import safe_nmap_scan
from redteam_agent.tools.http_probe import http_probe


class ReconAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.1,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        self.tools = [self.safe_nmap_tool, self.http_probe_tool]
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are Recon Agent for a lab-only red team simulation. 
            You must never suggest or take any action outside the provided ALLOWLIST. 
            Use only provided tool functions. For any decision, prefer a conservative scan depth. 
            Always validate tool output schema before continuing."""),
            ("user", "{input}"),
            ("assistant", "{agent_scratchpad}"),
        ])
        self.agent = create_openai_tools_agent(self.llm, self.tools, self.prompt)
        self.agent_executor = AgentExecutor(agent=self.agent, tools=self.tools, verbose=True)

    @tool
    def safe_nmap_tool(self, target_ip: str, ports: str = "1-1024") -> str:
        """Scan target IP with safe nmap flags. Returns JSON with scan results."""
        result = safe_nmap_scan(target_ip, ports, dry_run=False)
        return json.dumps(result)

    @tool  
    def http_probe_tool(self, target_ip: str, port: int = 80, path: str = "/") -> str:
        """Probe HTTP service on target. Returns JSON with response details."""
        result = http_probe(target_ip, port, path, dry_run=False)
        return json.dumps(result)

    def scan_target(self, target_ip: str) -> Dict[str, Any]:
        """Perform reconnaissance on a target IP."""
        try:
            response = self.agent_executor.invoke({
                "input": f"Scan target {target_ip} for open ports and services. Use safe scanning techniques."
            })
            return {
                "status": "success",
                "target": target_ip,
                "results": response["output"],
                "agent_scratchpad": response.get("intermediate_steps", [])
            }
        except Exception as e:
            return {
                "status": "error", 
                "target": target_ip,
                "error": str(e)
            }
