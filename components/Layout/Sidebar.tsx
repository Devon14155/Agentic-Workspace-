import React from 'react';
import { ViewState } from '../../types';
import { MessageSquare, Users, Database, GitBranch, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, onOpenSettings }) => {
  const navItems = [
    { id: ViewState.CHAT, label: 'Orchestrator', icon: MessageSquare },
    { id: ViewState.AGENTS, label: 'Agent Swarm', icon: Users },
    { id: ViewState.WORKFLOW, label: 'Workflows', icon: GitBranch },
    { id: ViewState.MEMORY, label: 'Memory Bank', icon: Database },
  ];

  return (
    <div className="w-20 md:w-64 h-full bg-white dark:bg-nexus-900 border-r border-slate-200 dark:border-nexus-800 flex flex-col justify-between shrink-0 transition-colors duration-300 z-20 shadow-sm">
      <div>
        <div className="h-16 flex items-center justify-center md:justify-start px-6 border-b border-slate-200 dark:border-nexus-800">
          <span className="font-mono font-bold text-xl hidden md:block text-slate-900 dark:text-slate-100 tracking-wider">AGENTIC</span>
        </div>

        <nav className="mt-8 px-2 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-nexus-accent/10 text-nexus-accent border border-nexus-accent/20 font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-nexus-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-nexus-accent' : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`} />
                <span className="ml-3 hidden md:block">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-nexus-accent shadow-[0_0_8px_rgba(99,102,241,0.8)] hidden md:block" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-nexus-800">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center px-4 py-3 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-nexus-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 group"
        >
          <Settings className="w-5 h-5 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300" />
          <span className="ml-3 hidden md:block">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;