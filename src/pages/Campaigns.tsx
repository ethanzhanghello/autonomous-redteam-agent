import { useState, useEffect } from "react";
import { useRunStore, EventMsg } from "../store/runStore";

export default function Campaigns() {
  const { startRun, currentRunId, events, isRunning, stopRun } = useRunStore();
  const [targets, setTargets] = useState("172.18.0.0/16");
  const [simulationOnly, setSimulationOnly] = useState(true);
  const [depth, setDepth] = useState("standard");
  const [timeBudget, setTimeBudget] = useState(30);
  const [filterAgent, setFilterAgent] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = events.filter(event => {
    if (filterAgent !== "all" && event.agent !== filterAgent) return false;
    if (filterLevel !== "all" && event.level !== filterLevel) return false;
    if (searchTerm && !event.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleStartCampaign = async () => {
    try {
      await startRun({
        targets: targets.split(",").map(t => t.trim()),
        simulation_only: simulationOnly,
        depth,
        time_budget: timeBudget
      });
    } catch (error) {
      console.error("Failed to start campaign:", error);
      alert("Failed to start campaign. Check console for details.");
    }
  };

  const handleStopCampaign = () => {
    stopRun();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Campaigns</h1>
        {isRunning && (
          <button
            onClick={handleStopCampaign}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Stop Campaign
          </button>
        )}
      </div>

      {/* Campaign Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">New Campaign</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Targets (CIDR/IPs)
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={targets}
              onChange={(e) => setTargets(e.target.value)}
              placeholder="172.18.0.0/16"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Depth
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
            >
              <option value="quick">Quick</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Budget (minutes)
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={timeBudget}
              onChange={(e) => setTimeBudget(Number(e.target.value))}
              min="1"
              max="120"
            />
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={simulationOnly}
                onChange={(e) => setSimulationOnly(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Simulation-only</span>
            </label>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleStartCampaign}
            disabled={isRunning}
            className={`px-6 py-2 rounded-lg font-medium ${
              isRunning
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isRunning ? "Campaign Running..." : "Start Campaign"}
          </button>
        </div>
      </div>

      {/* Live Event Stream */}
      {currentRunId && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Run: <span className="font-mono font-medium">{currentRunId}</span>
                </span>
                <div className={`w-2 h-2 rounded-full ${
                  isRunning ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
              
              {/* Event Filters */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search events..."
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                >
                  <option value="all">All Agents</option>
                  <option value="recon">Recon</option>
                  <option value="intel">Intel</option>
                  <option value="defender">Defender</option>
                  <option value="orchestrator">Orchestrator</option>
                </select>
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-auto">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {events.length === 0 ? "Waiting for events..." : "No events match current filters"}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredEvents.map((event, index) => (
                  <div key={index} className="p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                            event.agent === 'recon' ? 'bg-blue-100 text-blue-800' :
                            event.agent === 'intel' ? 'bg-purple-100 text-purple-800' :
                            event.agent === 'defender' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.agent}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            event.level === 'error' ? 'bg-red-100 text-red-800' :
                            event.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.level}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-800">
                            {event.event_type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-800">{event.message}</div>
                        {event.payload && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              View Payload
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <div className="ml-4 flex space-x-1">
                        {event.payload?.target_ip && (
                          <button
                            onClick={() => copyToClipboard(event.payload.target_ip)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Copy IP
                          </button>
                        )}
                        {event.payload?.cve_id && (
                          <button
                            onClick={() => copyToClipboard(event.payload.cve_id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Copy CVE
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentRunId && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Campaign</h3>
          <p className="text-gray-600 mb-4">Start a campaign to see real-time agent activity and vulnerability analysis.</p>
          <button
            onClick={handleStartCampaign}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Your First Campaign
          </button>
        </div>
      )}
    </div>
  );
}
