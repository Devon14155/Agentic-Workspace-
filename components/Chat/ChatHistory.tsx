
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { MessageSquare, Trash2, Edit2, Check, X, Plus } from 'lucide-react';

interface ChatHistoryProps {
  onClose: () => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onClose }) => {
  const { sessions, activeSessionId, switchSession, deleteSession, renameSession, createNewSession } = useStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleCreateNew = async () => {
    await createNewSession();
    if (window.innerWidth < 768) onClose();
  };

  const startEdit = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const saveEdit = async (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await renameSession(id, editTitle);
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat session?')) {
        await deleteSession(id);
    }
  };

  return (
    <div className="w-80 h-full bg-slate-50 dark:bg-nexus-900/95 border-l border-slate-200 dark:border-nexus-800 flex flex-col shadow-2xl z-40 backdrop-blur-sm absolute right-0 top-16 bottom-0 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-200 dark:border-nexus-800 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200">Chat History</h3>
        <button onClick={onClose}><X className="w-5 h-5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" /></button>
      </div>

      <div className="p-4">
        <button 
            onClick={handleCreateNew}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-nexus-accent text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20 font-medium text-sm"
        >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {sessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => { switchSession(session.id); if(window.innerWidth < 768) onClose(); }}
            className={`group relative rounded-lg p-3 cursor-pointer transition-all border ${
              activeSessionId === session.id 
                ? 'bg-white dark:bg-nexus-800 border-nexus-accent/50 shadow-sm' 
                : 'border-transparent hover:bg-slate-100 dark:hover:bg-nexus-800/50'
            }`}
          >
            {editingId === session.id ? (
                <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                    <input 
                        type="text" 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 bg-slate-100 dark:bg-nexus-950 border border-nexus-accent rounded px-2 py-1 text-xs focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(session.id, e);
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                    />
                    <button onClick={(e) => saveEdit(session.id, e)} className="p-1 text-green-500 hover:bg-green-500/10 rounded"><Check className="w-3 h-3" /></button>
                    <button onClick={cancelEdit} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><X className="w-3 h-3" /></button>
                </div>
            ) : (
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-nexus-accent' : 'text-slate-700 dark:text-slate-300'}`}>
                            {session.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 truncate">{session.preview}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(session.lastModified).toLocaleDateString()}</p>
                    </div>
                </div>
            )}
            
            {editingId !== session.id && (
                <div className="absolute right-2 top-2 hidden group-hover:flex space-x-1">
                    <button 
                        onClick={(e) => startEdit(session.id, session.title, e)} 
                        className="p-1.5 text-slate-400 hover:text-nexus-accent hover:bg-slate-200 dark:hover:bg-nexus-700 rounded transition-colors"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-nexus-700 rounded transition-colors"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;
