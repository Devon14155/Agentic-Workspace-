import React, { useRef, useEffect, useState } from 'react';
import { Message, AIProviderId } from '../../types';
import { useStore } from '../../store/useStore';
import { MODEL_REGISTRY, PROVIDER_CONFIGS } from '../../services/ai/config/model-registry';
import { Cpu, ChevronDown, ChevronRight, Wrench, Sparkles, ArrowUp, Check, Lightbulb, Code, BarChart3, GraduationCap, Zap, Paperclip, Mic } from 'lucide-react';

interface ChatInterfaceProps {
  onSendMessage: (text: string) => void;
  onOpenSettings: () => void;
}

const SuggestionCard: React.FC<{ icon: any; title: string; prompt: string; onClick: (t: string) => void; color: string }> = ({ icon: Icon, title, prompt, onClick, color }) => (
  <button 
    onClick={() => onClick(prompt)}
    className="flex flex-col text-left p-4 bg-white dark:bg-nexus-900 border border-slate-200 dark:border-nexus-800 rounded-xl hover:border-nexus-accent dark:hover:border-nexus-accent hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group h-full"
  >
    <div className={`p-2 rounded-lg ${color} bg-opacity-10 w-max mb-3`}>
      <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
    </div>
    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-nexus-accent transition-colors">{title}</span>
    <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{prompt}</span>
  </button>
);

const ToolsPopover: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isOpen ? 'bg-nexus-accent/10 text-nexus-accent' : 'hover:bg-slate-100 dark:hover:bg-nexus-800 text-slate-500'
        }`}
      >
        <Wrench className="w-3.5 h-3.5" />
        <span>Tools</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-nexus-900 border border-slate-200 dark:border-nexus-700 rounded-xl shadow-xl z-50 p-3 animate-in fade-in slide-in-from-bottom-2">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Active Capabilities</div>
           <div className="space-y-1">
              <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-nexus-800">
                 <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">Web Search</span>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-nexus-800">
                 <div className="flex items-center gap-2">
                    <Code className="w-3 h-3 text-blue-500" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">Code Analysis</span>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              </div>
               <div className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-nexus-800">
                 <div className="flex items-center gap-2">
                    <BarChart3 className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">Data Vis</span>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-500" title="Available via React Agent"></div>
              </div>
           </div>
           <div className="mt-2 pt-2 border-t border-slate-100 dark:border-nexus-800 text-[10px] text-slate-400 px-1">
              Tools are automatically invoked by the Orchestrator based on query intent.
           </div>
        </div>
      )}
    </div>
  );
};

const ModelSelector: React.FC<{ currentModelId: string; onSelect: (id: string) => void; onSettings: () => void }> = ({ currentModelId, onSelect, onSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentModel = MODEL_REGISTRY.find(m => m.id === currentModelId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group models by provider
  const groupedModels = MODEL_REGISTRY.reduce((acc, model) => {
    if (!acc[model.providerId]) acc[model.providerId] = [];
    acc[model.providerId].push(model);
    return acc;
  }, {} as Record<AIProviderId, typeof MODEL_REGISTRY>);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white dark:bg-nexus-900 border border-slate-200 dark:border-nexus-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:border-nexus-accent transition-colors shadow-sm"
      >
        <Sparkles className="w-3.5 h-3.5 text-nexus-accent" />
        <span className="truncate max-w-[150px]">{currentModel?.name || 'Select Model'}</span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-72 max-h-[400px] overflow-y-auto bg-white dark:bg-nexus-900 border border-slate-200 dark:border-nexus-700 rounded-xl shadow-2xl z-50 animate-in slide-in-from-bottom-2">
          <div className="p-3 border-b border-slate-100 dark:border-nexus-800 sticky top-0 bg-white/95 dark:bg-nexus-900/95 backdrop-blur z-10 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select AI Model</span>
             <button onClick={onSettings} className="text-xs text-nexus-accent hover:underline">Manage Keys</button>
          </div>
          
          <div className="p-2 space-y-4">
            {Object.entries(groupedModels).map(([providerId, models]) => (
              <div key={providerId}>
                <div className="px-2 mb-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-nexus-800 px-2 py-0.5 rounded">
                     {/* @ts-ignore */}
                     {PROVIDER_CONFIGS[providerId]?.name || providerId}
                  </span>
                </div>
                <div className="space-y-1">
                  {models.map(model => (
                    <button
                      key={model.id}
                      onClick={() => { onSelect(model.id); setIsOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all group ${
                        currentModelId === model.id 
                          ? 'bg-nexus-accent text-white shadow-md shadow-nexus-accent/20' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-nexus-800'
                      }`}
                    >
                      <div className="flex flex-col items-start gap-0.5">
                         <span className="font-medium">{model.name}</span>
                         <div className="flex gap-1.5 opacity-90">
                           {model.badges?.slice(0,2).map(b => (
                             <span key={b} className={`text-[9px] px-1 rounded border ${currentModelId === model.id ? 'border-white/30 bg-white/10' : 'border-slate-200 dark:border-nexus-700 bg-slate-50 dark:bg-nexus-950 text-slate-500'}`}>{b}</span>
                           ))}
                         </div>
                      </div>
                      {currentModelId === model.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ThoughtBlock: React.FC<{ content: string }> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="my-3 border-l-2 border-nexus-accent/30 pl-3 ml-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-xs font-medium text-slate-500 hover:text-nexus-accent transition-colors mb-2"
      >
        <Cpu className="w-3 h-3 mr-2" />
        {isOpen ? 'Reasoning Process' : 'Show Reasoning'}
        {isOpen ? <ChevronDown className="w-3 h-3 ml-1" /> : <ChevronRight className="w-3 h-3 ml-1" />}
      </button>
      {isOpen && (
        <div className="text-slate-600 dark:text-slate-400 text-sm font-mono whitespace-pre-wrap bg-slate-50 dark:bg-nexus-900/50 p-3 rounded-lg text-xs animate-in slide-in-from-top-2">
          {content}
        </div>
      )}
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSendMessage, onOpenSettings }) => {
  const { messages, isLoading, agents, selectedModelId, setSelectedModelId, aiConfig } = useStore();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasActiveKey = React.useMemo(() => {
     if (!aiConfig) return false;
     const model = MODEL_REGISTRY.find(m => m.id === selectedModelId);
     if (model?.providerId === AIProviderId.Ollama) return true; // Local
     return model ? !!aiConfig.providers[model.providerId]?.apiKey : false;
  }, [aiConfig, selectedModelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasActiveKey) {
        onOpenSettings();
        return;
    }
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleSuggestion = (prompt: string) => {
    if (!hasActiveKey) {
      onOpenSettings();
      return;
    }
    onSendMessage(prompt);
  };

  // Determine if we should show the empty state (suggestions)
  // Show if: No messages OR only one message and it is the welcome message (legacy support)
  const showEmptyState = messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-nexus-950 relative font-sans">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 py-8 space-y-8 scroll-smooth pb-32">
        {showEmptyState ? (
          <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto p-4">
            <div className="text-center mb-10">
               <div className="w-16 h-16 bg-gradient-to-br from-nexus-accent to-purple-600 rounded-2xl shadow-xl flex items-center justify-center mb-6 mx-auto transform hover:scale-105 transition-transform duration-500">
                  <Sparkles className="w-8 h-8 text-white" />
               </div>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Agentic Workspace</h3>
               <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                 Orchestrate multi-agent workflows with state-of-the-art models.
               </p>
               
               {!hasActiveKey && (
                  <button 
                    onClick={onOpenSettings}
                    className="mt-6 px-6 py-2 bg-nexus-accent text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/25"
                  >
                    Configure API Keys
                  </button>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
               <SuggestionCard 
                  icon={Code} 
                  title="Architect a System" 
                  prompt="Design a scalable microservices architecture for a high-traffic e-commerce platform using AWS." 
                  color="bg-blue-500 text-blue-500"
                  onClick={handleSuggestion}
               />
               <SuggestionCard 
                  icon={Lightbulb} 
                  title="Strategic Analysis" 
                  prompt="Perform a SWOT analysis for a new AI startup entering the healthcare diagnostic sector." 
                  color="bg-amber-500 text-amber-500"
                  onClick={handleSuggestion}
               />
               <SuggestionCard 
                  icon={Zap} 
                  title="Debug & Optimize" 
                  prompt="Identify performance bottlenecks in a large React application using useMemo and useCallback." 
                  color="bg-purple-500 text-purple-500"
                  onClick={handleSuggestion}
               />
               <SuggestionCard 
                  icon={GraduationCap} 
                  title="Explain Concept" 
                  prompt="Explain Quantum Entanglement to a 5-year-old using simple analogies." 
                  color="bg-emerald-500 text-emerald-500"
                  onClick={handleSuggestion}
               />
            </div>
          </div>
        ) : (
           messages.map((msg) => (
            <div key={msg.id} className={`max-w-3xl mx-auto group animate-in fade-in slide-in-from-bottom-2 duration-500 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
               <div className="flex items-center mb-2 space-x-2">
                 {msg.role !== 'user' && (
                    <div className="w-6 h-6 rounded-md bg-nexus-accent/10 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-nexus-accent" />
                    </div>
                 )}
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {msg.role === 'user' ? 'You' : msg.agentId ? agents.find(a=>a.id===msg.agentId)?.name : 'Agentic Workspace'}
                 </span>
               </div>
               <div className={`prose prose-slate dark:prose-invert max-w-none text-base text-slate-600 dark:text-slate-300 ${msg.role === 'user' ? 'bg-white dark:bg-nexus-900 p-4 rounded-2xl rounded-tr-none shadow-sm border border-slate-100 dark:border-nexus-800' : ''}`}>
                 {msg.thinking && <ThoughtBlock content={msg.thinking} />}
                 <div className="whitespace-pre-wrap">{msg.content}</div>
               </div>
            </div>
          ))
        )}
        
        {isLoading && (
            <div className="max-w-3xl mx-auto flex items-center gap-3 text-slate-400 text-sm">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-nexus-accent rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-nexus-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-nexus-accent rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span>Orchestrating agents...</span>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-nexus-950 dark:via-nexus-950 pb-6 pt-12">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSubmit}
            className={`bg-white dark:bg-nexus-900 border border-slate-200 dark:border-nexus-700 shadow-xl rounded-2xl p-2 transition-all focus-within:ring-2 focus-within:ring-nexus-accent/20 focus-within:border-nexus-accent/50`}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={hasActiveKey ? "Chat with your agentic workspace..." : "Configure API key to start..."}
              className="w-full bg-transparent text-slate-900 dark:text-slate-100 px-3 py-3 resize-none focus:outline-none min-h-[50px] max-h-[200px]"
              rows={1}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                  }
              }}
            />
            
            <div className="flex justify-between items-center mt-2 px-1 pb-1">
              <div className="flex items-center space-x-2">
                 <ModelSelector 
                    currentModelId={selectedModelId} 
                    onSelect={setSelectedModelId}
                    onSettings={onOpenSettings}
                 />
                 <ToolsPopover />
              </div>

              <div className="flex items-center space-x-2">
                 <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-nexus-accent hover:bg-slate-100 dark:hover:bg-nexus-800 rounded-lg transition-colors"
                    title="Upload Media"
                 >
                    <Paperclip className="w-5 h-5" />
                 </button>
                 <button
                    type="button"
                    className="p-2 text-slate-400 hover:text-nexus-accent hover:bg-slate-100 dark:hover:bg-nexus-800 rounded-lg transition-colors"
                    title="Voice Input"
                 >
                    <Mic className="w-5 h-5" />
                 </button>
                 <button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-lg ${
                      input.trim() && !isLoading ? 'bg-nexus-accent text-white hover:bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-100 dark:bg-nexus-800 text-slate-400 shadow-none'
                    }`}
                 >
                    <ArrowUp className="w-5 h-5" />
                 </button>
              </div>
            </div>
          </form>
          <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400">
                  Powered by {MODEL_REGISTRY.length} Models across 11 Providers • Enterprise Grade
              </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;