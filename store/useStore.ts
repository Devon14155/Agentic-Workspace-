
import { create } from 'zustand';
import { Message, Agent, PlanStep, SystemMetrics, ViewState, AIConfig, ChatSession } from '../types';
import { INITIAL_AGENTS } from '../constants';
import { storage } from '../services/storage';
import { aiRouter } from '../services/ai/router';

interface ChatSlice {
  messages: Message[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  addMessage: (msg: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setMessages: (msgs: Message[]) => void;
  createNewSession: () => Promise<void>;
  switchSession: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  renameSession: (id: string, title: string) => Promise<void>;
}

interface AgentSlice {
  agents: Agent[];
  executionPlan: PlanStep[];
  planResults: Record<string, string>;
  isPlanning: boolean;
  setAgentStatus: (id: string, status: Agent['status']) => void;
  setExecutionPlan: (plan: PlanStep[]) => void;
  updatePlanStep: (id: string, updates: Partial<PlanStep>) => void;
  addPlanResult: (stepId: string, result: string) => void;
  setIsPlanning: (isPlanning: boolean) => void;
  resetPlan: () => void;
}

interface SystemSlice {
  metrics: SystemMetrics;
  isLoading: boolean;
  error: string | null;
  currentView: ViewState;
  themeMode: 'light' | 'dark' | 'system';
  aiConfig: AIConfig | null;
  selectedModelId: string;
  
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setView: (view: ViewState) => void;
  setTheme: (mode: 'light' | 'dark' | 'system') => void;
  setAIConfig: (config: AIConfig) => void;
  setSelectedModelId: (id: string) => void;
  updateMetrics: (tokens: number, isError?: boolean) => void;
}

interface AppState extends ChatSlice, AgentSlice, SystemSlice {
  initialize: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initialization
  initialize: async () => {
    const sessions = await storage.getSessions();
    const aiConfig = await storage.getAIConfig();
    const theme = localStorage.getItem('nexus_theme') as any || 'dark';

    let activeId = sessions[0]?.id;
    let messages: Message[] = [];

    if (!activeId) {
      // Create default session if none exist
      activeId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: activeId,
        title: 'New Session',
        lastModified: Date.now(),
        preview: 'New Conversation'
      };
      sessions.unshift(newSession);
      await storage.saveSessions(sessions);
      messages = []; // Start empty to show suggestion cards
      await storage.saveMessages(activeId, messages);
    } else {
      messages = await storage.getMessages(activeId);
    }

    set({ 
      sessions,
      activeSessionId: activeId,
      messages,
      aiConfig,
      selectedModelId: aiConfig.defaults.generalModel,
      themeMode: theme
    });
  },

  // Chat Slice
  messages: [],
  sessions: [],
  activeSessionId: null,

  addMessage: (msg) => {
    set((state) => {
      const newMsgs = [...state.messages, msg];
      if (state.activeSessionId) {
        storage.saveMessages(state.activeSessionId, newMsgs);
        
        // Update Session Preview
        const updatedSessions = state.sessions.map(s => {
          if (s.id === state.activeSessionId) {
            return {
              ...s,
              lastModified: Date.now(),
              preview: msg.content.substring(0, 60) + (msg.content.length > 60 ? '...' : ''),
              // Auto-title on first user message
              title: (s.title === 'New Session' && msg.role === 'user') 
                ? msg.content.substring(0, 30) + (msg.content.length > 30 ? '...' : '') 
                : s.title
            };
          }
          return s;
        }).sort((a, b) => b.lastModified - a.lastModified);
        
        storage.saveSessions(updatedSessions);
        return { messages: newMsgs, sessions: updatedSessions };
      }
      return { messages: newMsgs };
    });
  },

  updateMessage: (id, updates) => set((state) => {
    const newMsgs = state.messages.map(m => m.id === id ? { ...m, ...updates } : m);
    if (state.activeSessionId) {
       storage.saveMessages(state.activeSessionId, newMsgs);
    }
    return { messages: newMsgs };
  }),

  setMessages: (msgs) => {
    const { activeSessionId } = get();
    if (activeSessionId) {
      storage.saveMessages(activeSessionId, msgs);
    }
    set({ messages: msgs });
  },

  createNewSession: async () => {
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Session',
      lastModified: Date.now(),
      preview: 'New Conversation'
    };
    
    const { sessions } = get();
    const newSessions = [newSession, ...sessions];
    
    await storage.saveSessions(newSessions);
    // Start with empty messages to ensure suggestion cards are shown
    const initialMsgs: Message[] = []; 
    await storage.saveMessages(newId, initialMsgs);

    set({ 
      sessions: newSessions, 
      activeSessionId: newId, 
      messages: initialMsgs,
      // Reset other states
      executionPlan: [],
      planResults: {},
      error: null
    });
  },

  switchSession: async (id) => {
    const msgs = await storage.getMessages(id);
    set({ 
      activeSessionId: id, 
      messages: msgs,
      executionPlan: [], // Clear execution plan when switching context
      planResults: {}
    });
  },

  deleteSession: async (id) => {
    const { sessions, activeSessionId } = get();
    const newSessions = sessions.filter(s => s.id !== id);
    await storage.saveSessions(newSessions);
    await storage.deleteSessionData(id);

    // If we deleted the active one, switch to the first available or create new
    if (id === activeSessionId) {
      if (newSessions.length > 0) {
        const nextId = newSessions[0].id;
        const msgs = await storage.getMessages(nextId);
        set({ sessions: newSessions, activeSessionId: nextId, messages: msgs });
      } else {
        // No sessions left, create one
        get().createNewSession();
      }
    } else {
      set({ sessions: newSessions });
    }
  },

  renameSession: async (id, title) => {
    const { sessions } = get();
    const newSessions = sessions.map(s => s.id === id ? { ...s, title } : s);
    await storage.saveSessions(newSessions);
    set({ sessions: newSessions });
  },

  // Agent Slice
  agents: INITIAL_AGENTS,
  executionPlan: [],
  planResults: {},
  isPlanning: false,
  setAgentStatus: (id, status) => set((state) => ({
    agents: state.agents.map(a => a.id === id ? { ...a, status } : a)
  })),
  setExecutionPlan: (plan) => set({ executionPlan: plan }),
  updatePlanStep: (id, updates) => set((state) => ({
    executionPlan: state.executionPlan.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  addPlanResult: (stepId, result) => set((state) => ({
    planResults: { ...state.planResults, [stepId]: result }
  })),
  setIsPlanning: (isPlanning) => set({ isPlanning }),
  resetPlan: () => set({ executionPlan: [], planResults: {} }),

  // System Slice
  metrics: {
    totalTokens: 0,
    totalRequests: 0,
    totalErrors: 0,
    startTime: Date.now(),
    history: []
  },
  isLoading: false,
  error: null,
  currentView: ViewState.CHAT,
  themeMode: 'dark',
  aiConfig: null,
  selectedModelId: 'gemini-3-flash-preview',
  
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setView: (currentView) => set({ currentView }),
  setTheme: (themeMode) => {
    localStorage.setItem('nexus_theme', themeMode);
    set({ themeMode });
  },
  setAIConfig: (config) => {
    storage.saveAIConfig(config);
    aiRouter.reloadConfig(); // Notify router of updates
    set({ aiConfig: config });
  },
  setSelectedModelId: (id) => set({ selectedModelId: id }),
  
  updateMetrics: (tokens, isError = false) => set((state) => {
    const now = new Date();
    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newHistory = [...state.metrics.history];
    
    if (newHistory.length === 0 || newHistory[newHistory.length - 1].time !== timeLabel) {
       if (newHistory.length > 20) newHistory.shift(); 
       newHistory.push({
         time: timeLabel,
         load: Math.min(100, Math.floor(Math.random() * 30) + 20 + (state.isLoading ? 40 : 0)),
         requests: 1
       });
    } else {
       newHistory[newHistory.length - 1].requests += 1;
       if (state.isLoading) newHistory[newHistory.length - 1].load = Math.min(95, newHistory[newHistory.length - 1].load + 10);
    }

    return {
      metrics: {
        ...state.metrics,
        totalTokens: state.metrics.totalTokens + tokens,
        totalRequests: state.metrics.totalRequests + 1,
        totalErrors: isError ? state.metrics.totalErrors + 1 : state.metrics.totalErrors,
        history: newHistory
      }
    };
  })
}));
