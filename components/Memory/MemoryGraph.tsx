
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphNode, GraphLink } from '../../types';

interface MemoryGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
}

const MemoryGraph: React.FC<MemoryGraphProps> = ({ nodes, links }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Deep copy to prevent d3 from mutating props directly causing React issues
    const simulationNodes = JSON.parse(JSON.stringify(nodes));
    const simulationLinks = JSON.parse(JSON.stringify(links));

    const simulation = d3.forceSimulation(simulationNodes)
      .force("link", d3.forceLink(simulationLinks).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force("collide", d3.forceCollide().radius(30));

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    const g = svg.append("g");

    // Links
    const link = g.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(simulationLinks)
      .join("line")
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) * 2);

    // Nodes
    const node = g.append("g")
      .selectAll(".node")
      .data(simulationNodes)
      .join("g")
      .attr("class", "node")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Node shape (Circle)
    node.append("circle")
      .attr("r", (d: any) => d.val * 1.5 + 5)
      .attr("fill", (d: any) => d.color)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    // Label
    node.append("text")
      .text((d: any) => d.label)
      .attr("x", 12)
      .attr("y", 4)
      .attr("font-size", "10px")
      .attr("fill", "#cbd5e1")
      .attr("pointer-events", "none")
      .style("text-shadow", "1px 1px 2px #000");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        <p>Insufficient memory nodes to generate graph.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-950 rounded-xl border border-nexus-800 relative overflow-hidden" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full cursor-move" />
      <div className="absolute bottom-4 right-4 bg-nexus-900/80 p-2 rounded text-xs text-slate-400 backdrop-blur pointer-events-none">
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Semantic</div>
        <div className="flex items-center gap-2 mb-1"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Episodic</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Procedural</div>
      </div>
    </div>
  );
};

export default MemoryGraph;
