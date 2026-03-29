'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface NetworkNode {
  id: string;
  name: string;
  githubLogin: string;
  image?: string;
  level: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
  type: 'collaboration' | 'following' | 'organization';
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    totalCollaborators: number;
    totalOrganizations: number;
    networkDensity: number;
    averageConnections: number;
    strongestConnection: NetworkEdge;
  };
}

export default function CollaborationNetwork() {
  const { data: session } = useSession();
  const [networkData, setNetworkData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (session?.user?.githubLogin) {
      fetchNetworkData();
    }
  }, [session]);

  useEffect(() => {
    if (networkData && canvasRef.current) {
      initializeNetwork();
      animate();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [networkData]);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/network/collaboration');
      const data = await response.json();
      setNetworkData(data);
    } catch (error) {
      console.error('Failed to fetch network data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeNetwork = () => {
    if (!canvasRef.current || !networkData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Initialize node positions randomly
    networkData.nodes.forEach((node, index) => {
      node.x = Math.random() * canvas.width;
      node.y = Math.random() * canvas.height;
      node.vx = 0;
      node.vy = 0;
    });
  };

  const animate = () => {
    if (!canvasRef.current || !networkData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply force-directed layout
    applyForces(canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    networkData.edges.forEach(edge => {
      const sourceNode = networkData.nodes.find(n => n.id === edge.source);
      const targetNode = networkData.nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode && sourceNode.x && sourceNode.y && targetNode.x && targetNode.y) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.globalAlpha = Math.min(edge.weight / 10, 1);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    networkData.nodes.forEach(node => {
      if (!node.x || !node.y) return;

      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const isCentralUser = node.githubLogin === session?.user?.githubLogin;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered || isSelected ? 12 : 8, 0, 2 * Math.PI);
      
      if (isCentralUser) {
        ctx.fillStyle = '#f59e0b'; // Gold for central user
      } else if (isSelected) {
        ctx.fillStyle = '#3b82f6'; // Blue for selected
      } else if (isHovered) {
        ctx.fillStyle = '#6366f1'; // Light blue for hovered
      } else {
        ctx.fillStyle = '#6b7280'; // Gray for normal
      }
      
      ctx.fill();
      
      if (isCentralUser || isSelected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw avatar or initials
      if (node.image) {
        // Draw avatar image (would need to load image first)
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.githubLogin.substring(0, 2).toUpperCase(), node.x, node.y);
      } else {
        ctx.fillStyle = '#fff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.githubLogin.substring(0, 2).toUpperCase(), node.x, node.y);
      }

      // Draw name for hovered/selected nodes
      if (isHovered || isSelected) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(node.x + 15, node.y - 10, 100, 20);
        ctx.fillStyle = '#000';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(node.name || node.githubLogin, node.x + 20, node.y + 2);
      }
    });

    animationRef.current = requestAnimationFrame(animate);
  };

  const applyForces = (width: number, height: number) => {
    if (!networkData) return;

    const centerX = width / 2;
    const centerY = height / 2;
    const k = 0.1; // Spring constant
    const damping = 0.9; // Damping factor

    // Apply forces to nodes
    networkData.nodes.forEach((node, i) => {
      let fx = 0;
      let fy = 0;

      // Repulsion between all nodes
      networkData.nodes.forEach((otherNode, j) => {
        if (i !== j && node.x && node.y && otherNode.x && otherNode.y) {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < 200) {
            const force = 1000 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        }
      });

      // Attraction along edges
      networkData.edges.forEach(edge => {
        if (edge.source === node.id || edge.target === node.id) {
          const otherNodeId = edge.source === node.id ? edge.target : edge.source;
          const otherNode = networkData.nodes.find(n => n.id === otherNodeId);
          
          if (otherNode && node.x && node.y && otherNode.x && otherNode.y) {
            const dx = otherNode.x - node.x;
            const dy = otherNode.y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const force = distance * k * edge.weight / 10;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          }
        }
      });

      // Attraction to center
      if (node.x && node.y) {
        fx += (centerX - node.x) * k * 0.01;
        fy += (centerY - node.y) * k * 0.01;
      }

      // Update velocity and position
      if (node.vx !== undefined && node.vy !== undefined && node.x !== undefined && node.y !== undefined) {
        node.vx = (node.vx + fx) * damping;
        node.vy = (node.vy + fy) * damping;

        node.x += node.vx;
        node.y += node.vy;

        // Keep nodes within bounds
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !networkData) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked node
    const clickedNode = networkData.nodes.find(node => {
      if (!node.x || !node.y) return false;
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= 12;
    });

    setSelectedNode(clickedNode || null);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !networkData) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find hovered node
    const hoveredNodeFound = networkData.nodes.find(node => {
      if (!node.x || !node.y) return false;
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= 12;
    });

    setHoveredNode(hoveredNodeFound || null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--n-accent)]"></div>
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className="text-center py-12 text-[var(--n-muted)]">
        Failed to load collaboration network.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-[family-name:var(--font-cinzel)] text-3xl text-gold-gradient md:text-4xl mb-8">
        Collaboration Network
      </h1>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Collaborators</h3>
          <p className="text-3xl font-bold text-[var(--n-accent)]">{networkData.stats.totalCollaborators}</p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Organizations</h3>
          <p className="text-3xl font-bold text-blue-500">{networkData.stats.totalOrganizations}</p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Network Density</h3>
          <p className="text-3xl font-bold text-green-500">
            {(networkData.stats.networkDensity * 100).toFixed(1)}%
          </p>
        </div>
        <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
          <h3 className="text-sm font-medium text-[var(--n-muted)] mb-2">Avg Connections</h3>
          <p className="text-3xl font-bold text-purple-500">
            {networkData.stats.averageConnections.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Network Visualization */}
      <div className="bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[var(--n-text)]">Network Graph</h2>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-[var(--n-muted)]">You</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
              <span className="text-[var(--n-muted)]">Collaborator</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-[var(--n-muted)]">Organization</span>
            </div>
          </div>
        </div>

        <div className="relative bg-[var(--n-void)] rounded-lg" style={{ height: '600px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
          />
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 w-64 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-[var(--n-text)]">
                {selectedNode.name || selectedNode.githubLogin}
              </h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[var(--n-muted)] hover:text-[var(--n-text)]"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--n-muted)]">Level:</span>
                <span className="text-[var(--n-text)]">{selectedNode.level}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-[var(--n-muted)]">Connections:</span>
                <span className="text-[var(--n-text)]">
                  {networkData.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length}
                </span>
              </div>
              
              {selectedNode.image && (
                <div className="mt-3">
                  <img
                    src={selectedNode.image}
                    alt={selectedNode.name}
                    className="w-16 h-16 rounded-full mx-auto"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Network Insights */}
      <div className="mt-8 p-6 bg-[var(--n-surface)] border border-[var(--n-border)] rounded-lg">
        <h2 className="text-lg font-semibold text-[var(--n-text)] mb-4">Network Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[var(--n-muted)]">
          <div>
            <p><strong>Strongest Connection:</strong> {networkData.stats.strongestConnection.source} ↔ {networkData.stats.strongestConnection.target}</p>
            <p><strong>Network Health:</strong> {networkData.stats.networkDensity > 0.5 ? 'Well Connected' : 'Sparsely Connected'}</p>
            <p><strong>Collaboration Style:</strong> {networkData.stats.totalCollaborators > 20 ? 'Highly Collaborative' : 'Focused'}</p>
          </div>
          <div>
            <p><strong>Growth Opportunity:</strong> {networkData.stats.networkDensity < 0.3 ? 'Expand Network' : 'Deepen Connections'}</p>
            <p><strong>Network Type:</strong> {networkData.stats.totalOrganizations > 5 ? 'Organization Heavy' : 'Individual Focus'}</p>
            <p><strong>Recommendation:</strong> Join more open source projects to increase collaboration opportunities</p>
          </div>
        </div>
      </div>
    </div>
  );
}
