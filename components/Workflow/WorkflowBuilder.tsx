import React, { useMemo } from 'react';
import WorkflowVisualizer from './WorkflowVisualizer';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { INITIAL_AGENTS } from '../../constants';
import { useStore } from '../../store/useStore';
import { PlanStep } from '../../types';

const WorkflowBuilder: React.FC = () => {
  const { executionPlan: plan } = useStore();

  const { nodes, edges } = useMemo(() => {
    if (plan.length === 0) return { nodes: [], edges: [] };

    const levels: Record<string, number> = {};
    const processStep = (stepId: string, currentLevel: number) => {
      levels[stepId] = Math.max(levels[stepId] || 0, currentLevel);
      const dependents = plan.filter(p => p.dependencies.includes(stepId));
      dependents.forEach(dep => processStep(dep.id, currentLevel + 1));
    };

    plan.filter(p => p.dependencies.length === 0).forEach(p => processStep(p.id, 0));

    const LEVEL_HEIGHT = 150;
    const NODE_WIDTH = 250;
    const NODE_SPACING = 50;
    
    const nodesByLevel: Record<number, PlanStep[]> = {};
    Object.entries(levels).forEach(([id, level]) => {
      if (!nodesByLevel[level]) nodesByLevel[level] = [];
      const step = plan.find(p => p.id === id);
      if (step) nodesByLevel[level].push(step);
    });

    const flowNodes: Node[] = [];
    Object.entries(nodesByLevel).forEach(([lvlStr, steps]) => {
      const level = parseInt(lvlStr);
      const totalWidth = steps.length * NODE_WIDTH + (steps.length - 1) * NODE_SPACING;
      const startX = -totalWidth / 2;

      steps.forEach((step, index) => {
        const agentName = INITIAL_AGENTS.find(a => a.id === step.agentId)?.name || step.agentId;
        flowNodes.push({
          id: step.id,
          type: 'custom',
          position: { x: startX + index * (NODE_WIDTH + NODE_SPACING), y: level * LEVEL_HEIGHT + 50 },
          data: { label: step.description, status: step.status, agent: agentName, description: step.description }
        });
      });
    });

    const flowEdges: Edge[] = [];
    plan.forEach(step => {
      step.dependencies.forEach(depId => {
        flowEdges.push({
          id: `${depId}-${step.id}`,
          source: depId,
          target: step.id,
          type: 'smoothstep',
          animated: step.status === 'active' || (step.status === 'pending' && plan.find(p=>p.id===depId)?.status === 'completed'),
          style: { stroke: step.status === 'completed' ? '#10b981' : '#64748b' },
          markerEnd: { type: MarkerType.ArrowClosed, color: step.status === 'completed' ? '#10b981' : '#64748b' },
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [plan]);

  if (plan.length === 0) {
    return (
      <div className="h-full bg-slate-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
         <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        <div className="z-10 bg-nexus-900/50 border border-nexus-800 p-8 rounded-2xl max-w-md backdrop-blur">
          <div className="w-16 h-16 bg-nexus-800 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">No Active Workflow</h2>
          <p className="text-slate-400 text-sm">Start a chat with the Orchestrator to initiate a task. It will automatically decompose your request into a visual workflow graph here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-950 relative">
      <div className="absolute top-4 left-4 z-10 bg-nexus-900/90 border border-nexus-700 p-3 rounded-lg backdrop-blur">
         <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-nexus-accent animate-pulse"></div>Active Pipeline</h3>
         <p className="text-xs text-slate-400 mt-1">Real-time execution graph</p>
      </div>
      <WorkflowVisualizer nodes={nodes} edges={edges} />
    </div>
  );
};

export default WorkflowBuilder;