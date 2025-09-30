.PHONY: up seed_kg ingest demo test lint format clean api frontend dev

# Infrastructure
up:
	docker-compose -f redteam_agent/docker/docker-compose.yml up -d

seed_kg:
	python3 -m redteam_agent.etl.ingest --file redteam_agent/data/feeds/comprehensive_vulns.json

ingest:
	python3 -m redteam_agent.etl.ingest --file redteam_agent/data/feeds/comprehensive_vulns.json

demo:
	python3 -m redteam_agent.agents.orchestrator --config redteam_agent/demo/demo_config.json --dry-run

# Testing (simplified)
test:
	python3 -m pytest tests/ -v

# Code Quality (basic)
lint:
	flake8 redteam_agent/ tests/

format:
	black redteam_agent/ tests/

# API Server
api:
	python3 api/main.py

# Frontend Development
frontend:
	npm run dev

# Full-stack development
dev:
	@echo "Starting full-stack development..."
	@echo "Backend API: http://localhost:8000"
	@echo "Frontend UI: http://localhost:5173"
	@echo "Run 'make api' in one terminal and 'make frontend' in another"

# Cleanup
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name ".pytest_cache" -exec rm -rf {} +