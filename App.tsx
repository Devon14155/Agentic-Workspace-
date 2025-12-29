import React, { useEffect, useState } from 'react';
import { Settings, Plus, Command, History, Clock } from 'lucide-react';
import ChatInterface from './components/Chat/ChatInterface';
import SettingsModal from './components/Settings/SettingsModal';
import Sidebar from './components/Layout/Sidebar';
import AgentNetwork from './components/Visualization/AgentNetwork';
import MemoryBank from './components/Memory/MemoryBank';
import WorkflowBuilder from './components/Workflow/WorkflowBuilder';
import SystemDashboard from './components/Dashboard/SystemDashboard';
import ChatHistory from './components/Chat/ChatHistory';
import { ViewState } from './types';
import { useStore } from './store/useStore';
import { useAgentRuntime } from './hooks/useAgentRuntime';
import { memoryService } from './services/memoryService';

function App() {
  const { 
    themeMode, currentView, setView, setError, error,
    initialize, createNewSession
  } = useStore();
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'security'>('general');
  const [showHistory, setShowHistory] = useState(false);
  
  const { handleSendMessage } = useAgentRuntime();

  // Initialize
  useEffect(() => {
    initialize();
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (themeMode === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(systemDark ? 'dark' : 'light');
    } else {
      root.classList.add(themeMode);
    }
  }, [themeMode]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-nexus-950 text-slate-900 dark:text-slate-200 overflow-hidden font-sans selection:bg-nexus-accent selection:text-white transition-colors duration-300">

      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
        defaultTab={settingsTab}
      />

      <Sidebar 
        currentView={currentView} 
        setView={setView} 
        onOpenSettings={() => { setSettingsTab('general'); setShowSettingsModal(true); }}
      />
      
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-nexus-950 relative">
        <header className="h-16 bg-white dark:bg-nexus-950 border-b border-slate-100 dark:border-nexus-800 flex items-center justify-between px-6 z-20">
          <div className="flex items-center">
             <div className="w-8 h-8 rounded-lg bg-nexus-accent flex items-center justify-center mr-3 shadow-lg shadow-nexus-accent/20">
                <Command className="w-5 h-5 text-white" />
             </div>
             <div className="flex items-center text-sm">
                <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-lg">Agentic Workspace</span>
             </div>
          </div>
          
          <div className="flex items-center space-x-2">
             <button 
                onClick={() => setShowHistory(!showHistory)} 
                className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-nexus-accent/10 text-nexus-accent' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} 
                title="Chat History"
             >
               <History className="w-5 h-5" />
             </button>
             <button onClick={() => { setSettingsTab('general'); setShowSettingsModal(true); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
               <Settings className="w-5 h-5" />
             </button>
             <button 
                onClick={() => createNewSession()}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-nexus-800 flex items-center justify-center text-nexus-accent hover:bg-slate-200 dark:hover:bg-nexus-700 transition-colors ml-2"
                title="New Chat"
             >
               <Plus className="w-5 h-5" />
             </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 px-4 py-2 text-xs font-mono text-center flex justify-between items-center animate-in slide-in-from-top-1">
            <span>SYSTEM ERROR: {error}</span>
            <button onClick={() => setError(null)} className="hover:text-red-800 dark:hover:text-red-200">×</button>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden bg-white dark:bg-nexus-950 flex">
          <div className="flex-1 relative">
            {currentView === ViewState.CHAT && (
                <ChatInterface onSendMessage={handleSendMessage} onOpenSettings={() => { setSettingsTab('security'); setShowSettingsModal(true); }} />
            )}
            {currentView === ViewState.AGENTS && (
                <div className="h-full flex flex-col">
                <div className="flex-1 p-6 relative">
                    <AgentNetwork />
                </div>
                <div className="h-1/3 border-t border-slate-200 dark:border-nexus-800 p-6 bg-slate-50 dark:bg-nexus-900/50">
                    <SystemDashboard />
                </div>
                </div>
            )}
            {currentView === ViewState.WORKFLOW && (
                <WorkflowBuilder />
            )}
            {currentView === ViewState.MEMORY && <MemoryBank />}
          </div>
          
          {/* History Sidebar Overlay */}
          {showHistory && <ChatHistory onClose={() => setShowHistory(false)} />}
        </div>
      </main>
    </div>
  );
}

export default App;