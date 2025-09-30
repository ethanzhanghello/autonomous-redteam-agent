# Autonomous Red-Team Agent

A lab-only autonomous red-team simulation tool with a modern web interface for evaluating security defenses. This project demonstrates automated vulnerability assessment using AI agents, knowledge graphs, and real-time monitoring.

## ⚠️ Lab-Only Usage

**This tool is designed exclusively for lab environments.** It includes comprehensive safety controls to prevent scanning outside designated networks.

## ✨ Features

- **🤖 AI-Powered Agents**: Multi-agent system with LangChain integration
- **🔍 Safe Network Scanning**: Nmap-based reconnaissance with allowlist protection
- **📊 Knowledge Graph**: Neo4j database for vulnerability and asset intelligence
- **🎯 Prioritized Remediation**: Automated ticket generation with CVSS/EPSS scoring
- **📱 Modern Web Interface**: React-based dashboard with real-time event streaming
- **🛡️ Safety Controls**: Rate limiting, allowlist validation, and audit logging
- **🐳 Containerized**: Docker-based lab environment with OWASP Juice Shop

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker & Docker Compose
- OpenAI API key

### Setup
1. **Clone and Install Backend**:
   ```bash
   git clone <repository>
   cd autonomous-redteam-agent
   pip install -r requirements.txt
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

3. **Start Lab Infrastructure**:
   ```bash
   make up          # Start Neo4j and OWASP Juice Shop
   make seed_kg     # Load vulnerability data
   ```

4. **Start Full-Stack Application**:
   ```bash
   # Terminal 1: Start API server
   make api
   
   # Terminal 2: Start frontend
   make frontend
   ```

5. **Access the Application**:
   - **Frontend UI**: http://localhost:5173
   - **API Documentation**: http://localhost:8000/docs
   - **Neo4j Browser**: http://localhost:7474

## 🏗️ Architecture

The system uses a sophisticated multi-agent architecture with a modern web interface:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │───▶│   FastAPI       │───▶│   AI Agents     │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • REST API      │    │ • Recon Agent   │
│ • Campaigns     │    │ • SSE Events    │    │ • Intel Agent   │
│ • Knowledge Graph│    │ • WebSocket     │    │ • Defender Agent│
│ • Reports       │    │ • File Downloads│    │ • Orchestrator  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Neo4j KG      │
                    │                 │
                    │ • Vulnerabilities│
                    │ • Assets        │
                    │ • Relationships │
                    └─────────────────┘
```

### Components

- **React Frontend**: Modern web interface with real-time updates
- **FastAPI Backend**: RESTful API with Server-Sent Events
- **AI Agents**: Multi-agent system for vulnerability analysis
- **Knowledge Graph**: Neo4j database for threat intelligence
- **Safety System**: Comprehensive controls for lab-only operation

## 🖥️ Web Interface Features

### Dashboard
- **KPIs**: Assets enumerated, services fingerprinted, vulnerabilities found
- **Campaign Status**: Last run details and quick start button
- **Real-time Updates**: Live campaign progress and results

### Campaigns
- **Campaign Management**: Start/stop campaigns with configuration
- **Live Event Stream**: Real-time agent activity with filtering
- **Safety Controls**: Simulation-only mode and allowlist validation

### Knowledge Graph
- **Interactive Visualization**: Force-directed graph of assets and vulnerabilities
- **Advanced Filtering**: KEV, CVSS, EPSS thresholds
- **Node Details**: Click assets to see linked vulnerabilities

### Reports
- **Report Preview**: Markdown rendering with syntax highlighting
- **Ticket Management**: Prioritized remediation recommendations
- **Download Options**: Export reports and tickets as files

### Settings
- **Safety Configuration**: Allowlist CIDRs and simulation mode
- **AI Settings**: LLM provider and token budget management
- **System Information**: Lab environment status

## 🛡️ Safety Controls

- **IP Allowlist**: Restricts scanning to designated networks (default: 172.18.0.0/16)
- **Rate Limiting**: Prevents aggressive scanning patterns
- **Dry-Run Mode**: Safe testing without actual network impact
- **Audit Logging**: Comprehensive activity tracking
- **Error Handling**: Graceful failure modes

## 🔧 Development

### Backend Development
```bash
# Start API server
make api

# Run tests
make test

# Code formatting
make format

# Linting
make lint
```

### Frontend Development
```bash
# Start development server
make frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

### Full-Stack Development
```bash
# Start both backend and frontend
make dev
```

## 📊 API Endpoints

### Campaign Management
- `POST /api/campaigns` - Start new campaign
- `GET /api/campaigns` - List all campaigns
- `GET /api/campaigns/{id}/events` - SSE event stream
- `POST /api/campaigns/{id}/stop` - Stop campaign

### Knowledge Graph
- `GET /api/kg/assets` - Get assets with vulnerabilities
- `GET /api/dashboard/kpis` - Get dashboard metrics

### Reports
- `GET /api/campaigns/{id}/report` - Get campaign report
- `GET /api/campaigns/{id}/download` - Download report

### Settings
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Update settings

## 🐳 Docker Deployment

```bash
make up             # Start all services
docker-compose up -d # Start in background
```

## 📈 Performance Considerations

- **SSE Streaming**: Real-time event updates without polling
- **Graph Optimization**: Efficient Neo4j queries with pagination
- **Frontend Caching**: Zustand state management for performance
- **Rate Limiting**: Prevents overwhelming target systems

## 🔒 Security Features

- **Input Validation**: Comprehensive validation of all inputs
- **CORS Protection**: Configured for development and production
- **Audit Trails**: Complete activity logging
- **Secret Management**: Environment-based configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is for educational purposes only. Use responsibly and only in lab environments.

## 🆘 Troubleshooting

### Common Issues

1. **Neo4j Connection Failed**: Ensure Docker is running and ports are available
2. **OpenAI API Errors**: Check API key and rate limits
3. **Frontend Not Loading**: Check if API server is running on port 8000
4. **SSE Events Not Streaming**: Verify campaign is running and events are being generated

### Debug Mode

Enable debug logging by setting `DEBUG=true` in your environment.

## 🔮 Future Enhancements

- [ ] Additional vulnerability feeds (CVE, KEV, EPSS)
- [ ] More sophisticated AI models
- [ ] Advanced reporting features
- [ ] Integration with SIEM systems
- [ ] Multi-tenant support
- [ ] Mobile-responsive design improvements