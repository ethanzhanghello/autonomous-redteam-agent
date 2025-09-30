import { useState, useEffect } from "react";

interface Settings {
  allowlist_cidrs: string[];
  simulation_only: boolean;
  llm_provider: 'cloud' | 'local';
  token_budget: number;
  tokens_used: number;
  rate_limit_per_second: number;
  max_scan_timeout: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    allowlist_cidrs: ['172.18.0.0/16'],
    simulation_only: true,
    llm_provider: 'cloud',
    token_budget: 20000,
    tokens_used: 0,
    rate_limit_per_second: 2,
    max_scan_timeout: 60
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save settings: ${response.statusText}`);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const addAllowlistCidr = () => {
    setSettings({
      ...settings,
      allowlist_cidrs: [...settings.allowlist_cidrs, '']
    });
  };

  const updateAllowlistCidr = (index: number, value: string) => {
    const newCidrs = [...settings.allowlist_cidrs];
    newCidrs[index] = value;
    setSettings({ ...settings, allowlist_cidrs: newCidrs });
  };

  const removeAllowlistCidr = (index: number) => {
    const newCidrs = settings.allowlist_cidrs.filter((_, i) => i !== index);
    setSettings({ ...settings, allowlist_cidrs: newCidrs });
  };

  const tokenUsagePercentage = settings.token_budget > 0 
    ? (settings.tokens_used / settings.token_budget) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <button
          onClick={saveSettings}
          disabled={loading}
          className={`px-6 py-2 rounded-lg font-medium ${
            loading
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : saved
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
          </div>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Safety Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.simulation_only}
                  onChange={(e) => setSettings({...settings, simulation_only: e.target.checked})}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Simulation-only mode</div>
                  <div className="text-xs text-gray-500">Prevents destructive actions and real exploits</div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowlist CIDRs
              </label>
              <div className="space-y-2">
                {settings.allowlist_cidrs.map((cidr, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={cidr}
                      onChange={(e) => updateAllowlistCidr(index, e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="172.18.0.0/16"
                    />
                    <button
                      onClick={() => removeAllowlistCidr(index)}
                      className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addAllowlistCidr}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add CIDR
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rate Limit (requests/second)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.rate_limit_per_second}
                onChange={(e) => setSettings({...settings, rate_limit_per_second: Number(e.target.value)})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Scan Timeout (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={settings.max_scan_timeout}
                onChange={(e) => setSettings({...settings, max_scan_timeout: Number(e.target.value)})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LLM Provider
              </label>
              <select
                value={settings.llm_provider}
                onChange={(e) => setSettings({...settings, llm_provider: e.target.value as 'cloud' | 'local'})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cloud">Cloud (OpenAI)</option>
                <option value="local">Local (Ollama)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Budget
              </label>
              <input
                type="number"
                min="1000"
                max="100000"
                value={settings.token_budget}
                onChange={(e) => setSettings({...settings, token_budget: Number(e.target.value)})}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Usage
              </label>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{settings.tokens_used.toLocaleString()} tokens used</span>
                  <span>{settings.token_budget.toLocaleString()} budget</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      tokenUsagePercentage > 90 ? 'bg-red-500' :
                      tokenUsagePercentage > 75 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(tokenUsagePercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  {tokenUsagePercentage.toFixed(1)}% of budget used
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">System Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">Lab-Only</div>
            <div className="text-sm text-gray-600">Safe Environment</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">Neo4j</div>
            <div className="text-sm text-gray-600">Knowledge Graph</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">AI Agents</div>
            <div className="text-sm text-gray-600">LangChain</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">Safe Scanning</div>
            <div className="text-sm text-gray-600">Nmap Wrapper</div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Important Safety Notice</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>This tool is designed exclusively for lab environments. Always ensure:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Simulation-only mode is enabled for testing</li>
                <li>Targets are within the allowlist CIDRs</li>
                <li>You have proper authorization for any scanning activities</li>
                <li>No production systems are targeted</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
