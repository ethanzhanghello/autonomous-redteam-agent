import { useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

interface Asset {
  asset_id: string;
  ip: string;
  hostname?: string;
  os?: string;
  services?: Array<{
    name: string;
    version?: string;
    port?: number;
  }>;
  vulns?: Array<{
    cve_id: string;
    cvss_v3?: number;
    epss?: number;
    kev?: boolean;
    summary?: string;
  }>;
}

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'asset' | 'service' | 'vulnerability' | 'product';
    group?: number;
    cvss?: number;
    kev?: boolean;
  }>;
  links: Array<{
    source: string;
    target: string;
    type?: string;
  }>;
}

export default function KG() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    kev_only: false,
    min_cvss: 0,
    min_epss: 0
  });
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    loadGraphData();
  }, [filters]);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/kg/assets?kev_only=${filters.kev_only}&min_cvss=${filters.min_cvss}&min_epss=${filters.min_epss}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }
      
      const assets: Asset[] = await response.json();
      
      // Transform data for force graph
      const nodes: GraphData['nodes'] = [];
      const links: GraphData['links'] = [];
      const nodeMap = new Map<string, any>();

      assets.forEach(asset => {
        // Add asset node
        const assetNode = {
          id: asset.asset_id,
          label: `${asset.hostname || asset.ip}`,
          type: 'asset' as const,
          group: 1,
          ...asset
        };
        nodes.push(assetNode);
        nodeMap.set(asset.asset_id, assetNode);

        // Add service nodes and links
        asset.services?.forEach(service => {
          const serviceId = `${asset.asset_id}:${service.name}`;
          const serviceNode = {
            id: serviceId,
            label: `${service.name}${service.version ? ` v${service.version}` : ''}`,
            type: 'service' as const,
            group: 2,
            port: service.port
          };
          nodes.push(serviceNode);
          nodeMap.set(serviceId, serviceNode);
          
          links.push({
            source: asset.asset_id,
            target: serviceId,
            type: 'runs'
          });
        });

        // Add vulnerability nodes and links
        asset.vulns?.forEach(vuln => {
          const vulnNode = {
            id: vuln.cve_id,
            label: vuln.cve_id,
            type: 'vulnerability' as const,
            group: 3,
            cvss: vuln.cvss_v3,
            kev: vuln.kev,
            summary: vuln.summary
          };
          nodes.push(vulnNode);
          nodeMap.set(vuln.cve_id, vulnNode);
          
          links.push({
            source: asset.asset_id,
            target: vuln.cve_id,
            type: 'affected_by'
          });
        });
      });

      setGraphData({ nodes, links });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load knowledge graph data');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (node: any) => {
    switch (node.type) {
      case 'asset': return '#10b981'; // green
      case 'service': return '#0ea5e9'; // blue
      case 'vulnerability': 
        if (node.kev) return '#dc2626'; // red for KEV
        if (node.cvss && node.cvss >= 7) return '#ea580c'; // orange for high CVSS
        return '#f59e0b'; // yellow for medium/low
      default: return '#6b7280'; // gray
    }
  };

  const getNodeSize = (node: any) => {
    switch (node.type) {
      case 'asset': return 8;
      case 'service': return 6;
      case 'vulnerability': return node.kev ? 10 : 7;
      default: return 5;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading knowledge graph...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-medium text-red-800">Error Loading Knowledge Graph</h3>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={loadGraphData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Knowledge Graph</h1>
        <button
          onClick={loadGraphData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.kev_only}
              onChange={(e) => setFilters({...filters, kev_only: e.target.checked})}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">KEV Only</span>
          </label>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Min CVSS:</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={filters.min_cvss}
              onChange={(e) => setFilters({...filters, min_cvss: Number(e.target.value)})}
              className="w-20"
            />
            <span className="text-sm text-gray-600">{filters.min_cvss}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Min EPSS:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={filters.min_epss}
              onChange={(e) => setFilters({...filters, min_epss: Number(e.target.value)})}
              className="w-20"
            />
            <span className="text-sm text-gray-600">{filters.min_epss}</span>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Asset-Vulnerability Network</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Assets ({graphData.nodes.filter(n => n.type === 'asset').length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Services ({graphData.nodes.filter(n => n.type === 'service').length})</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Vulnerabilities ({graphData.nodes.filter(n => n.type === 'vulnerability').length})</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-96">
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node: any) => `${node.label} (${node.type})`}
            nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
              const size = getNodeSize(node);
              const color = getNodeColor(node);
              
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
              
              // Add border for KEV vulnerabilities
              if (node.type === 'vulnerability' && node.kev) {
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }}
            linkColor={() => '#d1d5db'}
            linkWidth={1}
            onNodeClick={(node: any) => setSelectedNode(node)}
            cooldownTicks={100}
            onEngineStop={() => console.log('Graph rendered')}
          />
        </div>
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Node Details</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-sm">{selectedNode.type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Label:</span>
              <span className="ml-2">{selectedNode.label}</span>
            </div>
            {selectedNode.type === 'asset' && (
              <>
                <div>
                  <span className="font-medium text-gray-700">IP:</span>
                  <span className="ml-2 font-mono">{selectedNode.ip}</span>
                </div>
                {selectedNode.hostname && (
                  <div>
                    <span className="font-medium text-gray-700">Hostname:</span>
                    <span className="ml-2">{selectedNode.hostname}</span>
                  </div>
                )}
                {selectedNode.os && (
                  <div>
                    <span className="font-medium text-gray-700">OS:</span>
                    <span className="ml-2">{selectedNode.os}</span>
                  </div>
                )}
              </>
            )}
            {selectedNode.type === 'vulnerability' && (
              <>
                {selectedNode.cvss && (
                  <div>
                    <span className="font-medium text-gray-700">CVSS:</span>
                    <span className="ml-2">{selectedNode.cvss}</span>
                  </div>
                )}
                {selectedNode.kev && (
                  <div>
                    <span className="font-medium text-gray-700">KEV:</span>
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Yes</span>
                  </div>
                )}
                {selectedNode.summary && (
                  <div>
                    <span className="font-medium text-gray-700">Summary:</span>
                    <p className="ml-2 text-sm text-gray-600">{selectedNode.summary}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {graphData.nodes.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Run a campaign to populate the knowledge graph with assets and vulnerabilities.</p>
        </div>
      )}
    </div>
  );
}
