import { useState, useEffect } from "react";
import { useRunStore } from "../store/runStore";

interface KPIs {
  assets_enumerated: number;
  services_fingerprinted: number;
  actionable_vulns: number;
  kev_hits: number;
}

export default function Dashboard() {
  const { startRun, isRunning } = useRunStore();
  const [kpis, setKpis] = useState<KPIs>({
    assets_enumerated: 0,
    services_fingerprinted: 0,
    actionable_vulns: 0,
    kev_hits: 0
  });
  const [lastRun, setLastRun] = useState<any>(null);

  useEffect(() => {
    // Load KPIs and last run data
    const loadDashboardData = async () => {
      try {
        const [kpisRes, runsRes] = await Promise.all([
          fetch("/api/dashboard/kpis").then(r => r.json()),
          fetch("/api/campaigns").then(r => r.json())
        ]);
        
        setKpis(kpisRes);
        if (runsRes.length > 0) {
          setLastRun(runsRes[0]);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      }
    };

    loadDashboardData();
  }, []);

  const handleQuickStart = async () => {
    try {
      await startRun({
        targets: ["172.18.0.0/16"],
        simulation_only: true
      });
    } catch (error) {
      console.error("Failed to start campaign:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={handleQuickStart}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isRunning ? "Campaign Running..." : "Run New Campaign"}
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Assets Enumerated</div>
          <div className="text-2xl font-bold text-gray-900">{kpis.assets_enumerated}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Services Fingerprinted</div>
          <div className="text-2xl font-bold text-gray-900">{kpis.services_fingerprinted}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">Actionable Vulnerabilities</div>
          <div className="text-2xl font-bold text-red-600">{kpis.actionable_vulns}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-600">KEV Hits</div>
          <div className="text-2xl font-bold text-red-700">{kpis.kev_hits}</div>
        </div>
      </div>

      {/* Last Run Status */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Last Run Status</h2>
        {lastRun ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Run ID:</span>
              <span className="font-mono text-sm">{lastRun.run_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                lastRun.status === 'completed' ? 'bg-green-100 text-green-800' :
                lastRun.status === 'running' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {lastRun.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Started:</span>
              <span className="text-sm">{new Date(lastRun.start_time).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Vulnerabilities Found:</span>
              <span className="text-sm font-medium">{lastRun.vulnerabilities_found || 0}</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No runs yet. Start your first campaign to see activity.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/campaigns'}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium">Start Campaign</div>
            <div className="text-sm text-gray-600">Configure and run a new campaign</div>
          </button>
          <button
            onClick={() => window.location.href = '/kg'}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium">View Knowledge Graph</div>
            <div className="text-sm text-gray-600">Explore assets and vulnerabilities</div>
          </button>
          <button
            onClick={() => window.location.href = '/reports'}
            className="p-4 border rounded-lg hover:bg-gray-50 text-left"
          >
            <div className="font-medium">View Reports</div>
            <div className="text-sm text-gray-600">Review past campaign results</div>
          </button>
        </div>
      </div>
    </div>
  );
}
