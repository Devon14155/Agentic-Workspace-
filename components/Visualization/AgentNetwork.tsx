
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useStore } from '../../store/useStore';

const AgentNetwork: React.FC = () => {
  const { agents } = useStore();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    }
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !agents.length) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = dimensions.width;
    const height = dimensions.height;

    const nodes = agents.map(a => ({ ...a, x: width / 2, y: height / 2 }));
    const links = agents.filter(a => a.id !== 'coordinator').map(a => ({ source: 'coordinator', target: a.id }));

    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(60));

    const link = svg.append("g").attr("stroke", "#334155").attr("stroke-opacity", 0.6).selectAll("line").data(links).join("line").attr("stroke-width", 2);

    const nodeGroup = svg.append("g").selectAll("g").data(nodes).join("g").call(d3.drag<any, any>().on("start", dragstarted).on("drag", dragged).on("end", dragended));

    nodeGroup.append("circle").attr("r", 45).attr("fill", (d: any) => d.color).attr("opacity", 0.1).attr("class", "pulse-circle");
    nodeGroup.append("circle").attr("r", 30).attr("fill", "#1e293b").attr("stroke", (d: any) => d.color).attr("stroke-width", 2);
    nodeGroup.append("image").attr("xlink:href", (d: any) => d.avatar).attr("x", -20).attr("y", -20).attr("width", 40).attr("height", 40).attr("clip-path", "circle(20px at 20px 20px)");
    
    nodeGroup.append("text").text((d: any) => d.name).attr("x", 0).attr("y", 50).attr("text-anchor", "middle").attr("fill", "#e2e8f0").attr("font-size", "12px").attr("font-family", "monospace");
    nodeGroup.append("text").text((d: any) => d.role).attr("x", 0).attr("y", 65).attr("text-anchor", "middle").attr("fill", "#94a3b8").attr("font-size", "10px");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeGroup.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(event: any, d: any) { d.fx = event.x; d.fy = event.y; }
    function dragended(event: any, d: any) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

    return () => { simulation.stop(); };
  }, [agents, dimensions]);

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full overflow-visible" />
      <div className="absolute top-4 left-4 bg-nexus-900/80 backdrop-blur border border-nexus-700 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Agent Swarm Status</h3>
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="flex items-center justify-between text-xs w-48">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: agent.color }}></div>
                <span className="text-slate-400">{agent.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full bg-opacity-20 ${agent.status === 'executing' ? 'text-green-400 bg-green-500' : 'text-slate-500 bg-slate-700'}`}>
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgentNetwork;
