
import { Message, MemoryItem, AIConfig, AIProviderId, ChatSession } from '../types';
import { PROVIDER_CONFIGS } from './ai/config/model-registry';

export interface StorageRepository {
  saveMessages(sessionId: string, messages: Message[]): Promise<void>;
  getMessages(sessionId: string): Promise<Message[]>;
  saveSessions(sessions: ChatSession[]): Promise<void>;
  getSessions(): Promise<ChatSession[]>;
  saveMemories(memories: MemoryItem[]): Promise<void>;
  getMemories(): Promise<MemoryItem[]>;
  getAIConfig(): Promise<AIConfig>;
  saveAIConfig(config: AIConfig): Promise<void>;
  clearAll(): Promise<void>;
  getApiKey(providerId?: string): Promise<string | null>;
  saveApiKey(key: string, providerId?: string): Promise<void>;
  deleteSessionData(sessionId: string): Promise<void>;
}

class BrowserStorage implements StorageRepository {
  private KEYS = {
    SESSIONS: 'nexus_sessions_index_v1',
    SESSION_PREFIX: 'nexus_msg_session_',
    MEMORIES: 'nexus_memory_store_v2',
    AI_CONFIG: 'nexus_ai_config_v1',
    LEGACY_MESSAGES: 'nexus_messages_v2'
  };

  async saveMessages(sessionId: string, messages: Message[]): Promise<void> {
    try {
      localStorage.setItem(`${this.KEYS.SESSION_PREFIX}${sessionId}`, JSON.stringify(messages));
    } catch (e) {
      console.error("Storage Quota Exceeded", e);
    }
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const data = localStorage.getItem(`${this.KEYS.SESSION_PREFIX}${sessionId}`);
    return data ? JSON.parse(data) : [];
  }

  async saveSessions(sessions: ChatSession[]): Promise<void> {
    localStorage.setItem(this.KEYS.SESSIONS, JSON.stringify(sessions));
  }

  async getSessions(): Promise<ChatSession[]> {
    const data = localStorage.getItem(this.KEYS.SESSIONS);
    let sessions: ChatSession[] = data ? JSON.parse(data) : [];
    
    // Migration: If no sessions but legacy messages exist, create a default session
    if (sessions.length === 0) {
      const legacyMsgs = localStorage.getItem(this.KEYS.LEGACY_MESSAGES);
      if (legacyMsgs) {
        const defaultId = crypto.randomUUID();
        const messages = JSON.parse(legacyMsgs);
        const newSession: ChatSession = {
          id: defaultId,
          title: 'Migrated Session',
          lastModified: Date.now(),
          preview: messages[messages.length - 1]?.content.substring(0, 50) || 'History'
        };
        sessions.push(newSession);
        await this.saveSessions(sessions);
        await this.saveMessages(defaultId, messages);
        localStorage.removeItem(this.KEYS.LEGACY_MESSAGES);
      }
    }
    
    return sessions.sort((a, b) => b.lastModified - a.lastModified);
  }

  async deleteSessionData(sessionId: string): Promise<void> {
    localStorage.removeItem(`${this.KEYS.SESSION_PREFIX}${sessionId}`);
  }

  async saveMemories(memories: MemoryItem[]): Promise<void> {
    try {
      localStorage.setItem(this.KEYS.MEMORIES, JSON.stringify(memories));
    } catch (e) {
      console.error("Storage Quota Exceeded", e);
    }
  }

  async getMemories(): Promise<MemoryItem[]> {
    const data = localStorage.getItem(this.KEYS.MEMORIES);
    return data ? JSON.parse(data) : [];
  }

  async getAIConfig(): Promise<AIConfig> {
    const data = localStorage.getItem(this.KEYS.AI_CONFIG);
    if (data) return JSON.parse(data);

    // Default Config
    const providers: any = {};
    Object.values(AIProviderId).forEach(id => {
       providers[id] = {
         id,
         ...PROVIDER_CONFIGS[id],
         isEnabled: false,
         apiKey: ''
       };
    });

    return {
      providers,
      defaults: {
        generalModel: 'gemini-3-flash-preview',
        codingModel: 'claude-opus-4-5-20251101',
        visionModel: 'gpt-5.2',
        reasoningModel: 'deepseek-reasoner',
        longContextModel: 'gemini-3-flash-preview'
      },
      preferences: {
        useReasoning: true,
        useThinkingInTools: true,
        useRealTimeSearch: true,
        streamResponses: true,
        autoSwitchModels: true,
        costWarningThreshold: 5.0
      },
      usage: {}
    };
  }

  async saveAIConfig(config: AIConfig): Promise<void> {
    localStorage.setItem(this.KEYS.AI_CONFIG, JSON.stringify(config));
  }

  async clearAll(): Promise<void> {
    // Clear sessions
    const sessions = await this.getSessions();
    for (const s of sessions) {
      localStorage.removeItem(`${this.KEYS.SESSION_PREFIX}${s.id}`);
    }
    localStorage.removeItem(this.KEYS.SESSIONS);
    localStorage.removeItem(this.KEYS.MEMORIES);
    // Preserves API Config
  }

  async getApiKey(providerId: string = 'google'): Promise<string | null> {
    const config = await this.getAIConfig();
    return config.providers[providerId]?.apiKey || null;
  }

  async saveApiKey(key: string, providerId: string = 'google'): Promise<void> {
    const config = await this.getAIConfig();
    if (config.providers[providerId]) {
      config.providers[providerId].apiKey = key;
      config.providers[providerId].isEnabled = !!key;
      await this.saveAIConfig(config);
    }
  }
}

export const storage = new BrowserStorage();
