import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

interface Campaign {
  run_id: string;
  start_time: string;
  status: string;
  targets: string[];
  vulnerabilities_found: number;
  tickets_generated: number;
  dry_run: boolean;
}

interface Report {
  markdown: string;
  tickets: Array<{
    id: string;
    priority: number;
    title: string;
    evidence: string[];
    remediation: string;
  }>;
}

export default function Reports() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns");
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    }
  };

  const loadReport = async (runId: string) => {
    if (!runId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/campaigns/${runId}/report`);
      
      if (!response.ok) {
        throw new Error(`Failed to load report: ${response.statusText}`);
      }
      
      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = (runId: string) => {
    const link = document.createElement('a');
    link.href = `/api/campaigns/${runId}/download`;
    link.download = `report-${runId}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTickets = (runId: string) => {
    const link = document.createElement('a');
    link.href = `/api/campaigns/${runId}/tickets/download`;
    link.download = `tickets-${runId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <button
          onClick={loadCampaigns}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Past Campaigns</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>No campaigns found. Run a campaign to generate reports.</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.run_id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${
                    selectedRunId === campaign.run_id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedRunId(campaign.run_id);
                    loadReport(campaign.run_id);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-medium">{campaign.run_id}</span>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Started: {formatDate(campaign.start_time)}</div>
                    <div>Targets: {campaign.targets.join(', ')}</div>
                    <div className="flex items-center space-x-4">
                      <span>Vulns: {campaign.vulnerabilities_found}</span>
                      <span>Tickets: {campaign.tickets_generated}</span>
                      {campaign.dry_run && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                          Dry Run
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Viewer */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Report Preview</h2>
              {selectedRunId && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadReport(selectedRunId)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Download MD
                  </button>
                  <button
                    onClick={() => downloadTickets(selectedRunId)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Download JSON
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4">
            {!selectedRunId ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>Select a campaign to view its report</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading report...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-medium text-red-800">Error Loading Report</h3>
                </div>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            ) : report ? (
              <div className="space-y-6">
                {/* Markdown Report */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Campaign Report</h3>
                  <div className="prose max-w-none border rounded-lg p-4 bg-gray-50 max-h-96 overflow-auto">
                    <ReactMarkdown>{report.markdown}</ReactMarkdown>
                  </div>
                </div>

                {/* Tickets Summary */}
                {report.tickets && report.tickets.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      Remediation Tickets ({report.tickets.length})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-auto">
                      {report.tickets
                        .sort((a, b) => b.priority - a.priority)
                        .slice(0, 10)
                        .map((ticket, index) => (
                          <div key={ticket.id} className="border rounded-lg p-3 bg-white">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{ticket.title}</span>
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                                Priority: {ticket.priority.toFixed(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{ticket.remediation}</p>
                            {ticket.evidence && ticket.evidence.length > 0 && (
                              <div className="text-xs text-gray-500">
                                Evidence: {ticket.evidence.join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                    {report.tickets.length > 10 && (
                      <p className="text-sm text-gray-500 mt-2">
                        Showing top 10 tickets. Download JSON for complete list.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No report available for this campaign</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
