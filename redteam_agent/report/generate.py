from pathlib import Path
from typing import Dict, Any
import json


def write_report(run_dir: str, intel: Dict[str, Any]) -> None:
    out_dir = Path(run_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    tickets = intel.get("tickets", [])
    tickets_path = out_dir / "tickets.json"
    report_path = out_dir / "report.md"

    json.dump({"tickets": tickets}, open(tickets_path, "w"), indent=2)

    lines = [
        "# Report\n\n",
        "## Prioritized Vulnerabilities\n\n",
    ]
    for t in tickets:
        lines.append(f"- {t['id']} priority={t['priority']:.2f}\n")

    open(report_path, "w").write("".join(lines))

