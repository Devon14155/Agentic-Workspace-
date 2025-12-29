import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Handle, Position, Node, Edge } from '@xyflow/react';
import { WorkflowNodeData } from '../../types';

interface WorkflowVisualizerProps {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
}

const CustomNode = ({ data }: { data: WorkflowNodeData }) => {
  const statusColors = {
    pending: 'border-slate-600 bg-slate-800',
    active: 'border-nexus-accent bg-nexus-900 shadow-[0_0_15px_rgba(99,102,241,0.3)]',
    completed: 'border-nexus-success bg-nexus-900/50',
    failed: 'border-nexus-danger bg-nexus-900/50',
  };

  return (
    <div className={`px-4 py-3 rounded-lg border-2 min-w-[150px] transition-all duration-500 ${statusColors[data.status]}`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <div className="text-xs text-slate-400 font-mono mb-1 uppercase tracking-wider">{data.agent || 'System'}</div>
      <div className="text-sm font-semibold text-slate-100">{data.label}</div>
      <div className="mt-2 flex justify-between items-center">
        <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
          data.status === 'active' ? 'bg-nexus-accent/20 text-nexus-accent' : 
          data.status === 'completed' ? 'bg-nexus-success/20 text-nexus-success' : 'bg-slate-700 text-slate-400'
        }`}>
          {data.status}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
  );
};

const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({ nodes, edges }) => {
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  return (
    <div className="h-full w-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-slate-950"
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="bg-nexus-800 border-nexus-700 fill-slate-300" />
      </ReactFlow>
      
      <div className="absolute top-4 right-4 bg-nexus-900/90 backdrop-blur p-4 rounded-lg border border-nexus-700 max-w-xs pointer-events-none">
        <h3 className="text-slate-100 font-bold text-sm mb-1">Execution Graph</h3>
        <p className="text-slate-400 text-xs">Real-time visualization of the Orchestrator's task decomposition and delegation strategy.</p>
      </div>
    </div>
  );
};

export default WorkflowVisualizer;
