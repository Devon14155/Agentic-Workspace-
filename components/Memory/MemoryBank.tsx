
import React, { useState, useEffect } from 'react';
import { MemoryItem, MemoryTier, Skill } from '../../types';
import { SKILL_LIBRARY } from '../../constants';
import { memoryService } from '../../services/memoryService';
import MemoryGraph from './MemoryGraph';
import { Brain, Clock, Share2, Layers, Search, Code, Cpu, Network } from 'lucide-react';

const MemoryBank: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MemoryTier | 'Skills' | 'Graph' | 'Working'>('Working');
  const [searchTerm, setSearchTerm] = useState('');
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [workingMemory, setWorkingMemory] = useState(memoryService.workingMemory.getSnapshot());

  // Refresh data interval
  useEffect(() => {
    const fetchData = () => {
      setMemories(memoryService.getAll());
      setWorkingMemory(memoryService.workingMemory.getSnapshot());
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredMemories = memories.filter(m => 
    m.tier === activeTab && m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const graphData = memoryService.getGraphData();

  const getIcon = (tier: string) => {
    switch(tier) {
      case 'Working': return <Cpu className="w-4 h-4" />;
      case 'Graph': return <Network className="w-4 h-4" />;
      case MemoryTier.SHORT_TERM: return <Clock className="w-4 h-4" />;
      case MemoryTier.EPISODIC: return <Layers className="w-4 h-4" />;
      case MemoryTier.SEMANTIC: return <Brain className="w-4 h-4" />;
      case MemoryTier.PROCEDURAL: return <Code className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const renderWorkingMemory = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Scratchpad Section */}
        <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
             <div className="p-2 bg-indigo-500/10 rounded-lg mr-3"><Cpu className="w-5 h-5 text-indigo-500" /></div>
             <div>
               <h3 className="text-slate-200 font-semibold">Active Scratchpad</h3>
               <p className="text-slate-500 text-xs">Variables currently in focus by agents</p>
             </div>
          </div>
          <div className="space-y-2 font-mono text-sm">
             {Object.keys(workingMemory.scratchpad).length === 0 ? (
               <div className="text-slate-600 italic p-2">Empty state.</div>
             ) : (
               Object.entries(workingMemory.scratchpad).map(([key, val]) => (
                 <div key={key} className="flex justify-between border-b border-nexus-800/50 pb-2">
                   <span className="text-nexus-accent">{key}</span>
                   <span className="text-slate-300 truncate max-w-[200px]">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                 </div>
               ))
             )}
          </div>
        </div>

        {/* Hypotheses Section */}
        <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-6">
          <div className="flex items-center mb-4">
             <div className="p-2 bg-amber-500/10 rounded-lg mr-3"><Brain className="w-5 h-5 text-amber-500" /></div>
             <div>
               <h3 className="text-slate-200 font-semibold">Cognitive Hypotheses</h3>
               <p className="text-slate-500 text-xs">Probabilistic reasoning chains</p>
             </div>
          </div>
          <div className="space-y-3">
             {workingMemory.hypotheses.length === 0 ? (
                <div className="text-slate-600 italic">No active hypotheses generation.</div>
             ) : (
               workingMemory.hypotheses.map(h => (
                 <div key={h.id} className="p-3 bg-nexus-950/50 rounded border border-nexus-800">
                    <p className="text-slate-300 text-sm mb-2">{h.content}</p>
                    <div className="flex items-center">
                       <div className="flex-1 h-1.5 bg-nexus-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${h.confidence * 100}%` }}></div>
                       </div>
                       <span className="ml-2 text-xs text-amber-500 font-mono">{(h.confidence * 100).toFixed(0)}%</span>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>

      {/* Thought Stream */}
      <div className="bg-nexus-900/50 border border-nexus-800 rounded-xl p-6 flex flex-col">
         <div className="flex items-center mb-4">
             <div className="p-2 bg-emerald-500/10 rounded-lg mr-3"><Share2 className="w-5 h-5 text-emerald-500" /></div>
             <div>
               <h3 className="text-slate-200 font-semibold">Stream of Consciousness</h3>
               <p className="text-slate-500 text-xs">Real-time thought process logs</p>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
             {workingMemory.recentThoughts.length === 0 ? (
                <div className="text-slate-600 italic">Silence.</div>
             ) : (
               [...workingMemory.recentThoughts].reverse().map((t, i) => (
                  <div key={i} className="flex gap-3">
                     <span className="text-slate-600 text-xs font-mono pt-1">T-{i}</span>
                     <p className="text-slate-300 text-sm">{t}</p>
                  </div>
               ))
             )}
          </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Neural Memory Bank</h2>
          <p className="text-slate-400 text-sm mt-1">Cognitive architecture and persistence layer</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-500 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search knowledge..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-nexus-900 border border-nexus-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:border-nexus-accent w-64"
          />
        </div>
      </div>

      <div className="flex space-x-2 border-b border-nexus-800 mb-6 overflow-x-auto">
        {['Working', 'Graph', ...Object.values(MemoryTier), 'Skills'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'border-nexus-accent text-nexus-accent bg-nexus-900/50' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-nexus-900/30'
            }`}
          >
            <span className="mr-2">{getIcon(tab)}</span>
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'Working' ? renderWorkingMemory() :
         activeTab === 'Graph' ? (
           <div className="h-full rounded-xl overflow-hidden border border-nexus-800 bg-slate-950">
             <MemoryGraph nodes={graphData.nodes} links={graphData.links} />
           </div>
         ) :
         activeTab === 'Skills' ? (
           <div className="h-full overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
             {SKILL_LIBRARY.map(skill => (
               <div key={skill.id} className="bg-nexus-900/50 border border-nexus-700 rounded-xl p-5 hover:border-nexus-accent/50 transition-colors group h-max">
                 <div className="flex justify-between items-start mb-3">
                   <div className="p-2 bg-emerald-500/10 rounded-lg">
                     <Code className="w-5 h-5 text-emerald-500" />
                   </div>
                   <span className="text-xs font-mono text-slate-500">{skill.usageCount} executions</span>
                 </div>
                 <h3 className="text-slate-200 font-semibold mb-1 group-hover:text-nexus-accent transition-colors">{skill.name}</h3>
                 <p className="text-slate-400 text-xs mb-4">{skill.description}</p>
                 <div className="w-full bg-nexus-800 rounded-full h-1.5 overflow-hidden">
                   <div className="bg-nexus-success h-full" style={{ width: `${skill.successRate * 100}%` }}></div>
                 </div>
                 <div className="mt-1 text-right text-[10px] text-nexus-success">{(skill.successRate * 100).toFixed(0)}% Success Rate</div>
               </div>
             ))}
           </div>
        ) : (
          <div className="h-full overflow-y-auto space-y-3 pr-2 pb-10">
            {filteredMemories.map((memory) => (
              <div key={memory.id} className="bg-nexus-900/30 border border-nexus-800 rounded-lg p-4 hover:bg-nexus-800/30 transition-colors animate-in fade-in duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      memory.relevance > 0.8 ? 'bg-nexus-success' : 
                      memory.relevance > 0.5 ? 'bg-nexus-warning' : 'bg-slate-500'
                    }`} />
                    <div>
                      <p className="text-slate-200 text-sm leading-relaxed">{memory.content}</p>
                      <div className="flex gap-2 mt-2">
                        {memory.tags.map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-nexus-800 text-slate-400 border border-nexus-700">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-4">
                    {new Date(memory.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {filteredMemories.length === 0 && (
              <div className="text-center py-20 text-slate-500">
                <Brain className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No memory traces found for this vector.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryBank;
