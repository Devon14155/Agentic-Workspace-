
import * as d3 from 'd3';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  thinking?: string; // For DeepSeek/Anthropic reasoning chains
  agentId?: string;
  toolCalls?: ToolCall[];
  type?: 'text' | 'plan' | 'result';
}

export interface ChatSession {
  id: string;
  title: string;
  lastModified: number;
  preview: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, any>;
  status: 'pending' | 'success' | 'error';
  result?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'thinking' | 'executing' | 'dormant';
  specialty: string;
  color: string;
  avatar: string;
  systemPrompt: string;
  capabilities: string[];
  requiredCapabilities?: ModelCapability[]; // Auto-router constraints
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  successRate: number;
  usageCount: number;
}

export enum ViewState {
  CHAT = 'CHAT',
  AGENTS = 'AGENTS',
  MEMORY = 'MEMORY',
  WORKFLOW = 'WORKFLOW'
}

export enum MemoryTier {
  SHORT_TERM = 'Short-Term',
  EPISODIC = 'Episodic',
  SEMANTIC = 'Semantic',
  PROCEDURAL = 'Procedural'
}

export interface MemoryItem {
  id: string;
  tier: MemoryTier;
  content: string;
  timestamp: number;
  relevance: number;
  tags: string[];
  embedding?: number[];
  connections?: string[];
}

export interface PlanStep {
  id: string;
  agentId: string;
  description: string;
  dependencies: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  result?: string;
}

export interface WorkflowNodeData {
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  agent: string;
  description: string;
}

export interface WorkingMemoryState {
  scratchpad: Record<string, any>;
  focusStack: string[];
  recentThoughts: string[];
  hypotheses: Array<{ id: string; content: string; confidence: number }>;
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: MemoryTier;
  val: number;
  color: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
}

export interface SystemMetrics {
  totalTokens: number;
  totalRequests: number;
  totalErrors: number;
  startTime: number;
  history: { time: string; load: number; requests: number }[];
}

// --- AI Architecture Types ---

export enum AIProviderId {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  DeepSeek = 'deepseek',
  Grok = 'grok',
  Moonshot = 'moonshot',
  GLM = 'glm',
  Ollama = 'ollama',
  NanoBanana = 'nanobanana',
  Mistral = 'mistral',
  Meta = 'meta'
}

export type ModelCapability = 'vision' | 'toolCalling' | 'reasoning' | 'streaming' | 'computerUse' | 'realTimeSearch' | 'thinkingInTools';

export interface AIModel {
  id: string; // The API string (e.g., 'gemini-3-flash-preview')
  name: string; // Display name (e.g., 'Gemini 3 Flash')
  providerId: AIProviderId;
  contextWindow: number;
  inputPrice: number; // Per 1M tokens
  outputPrice: number; // Per 1M tokens
  capabilities: ModelCapability[];
  badges?: string[];
  releaseDate?: string;
  description?: string;
}

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  icon: string;
  baseUrl?: string;
  apiKey?: string;
  isEnabled: boolean;
  defaultModelId?: string;
}

export interface AIConfig {
  providers: Record<string, AIProviderConfig>;
  defaults: {
    generalModel: string;
    codingModel: string;
    visionModel: string;
    reasoningModel: string;
    longContextModel: string;
  };
  preferences: {
    useReasoning: boolean;
    useThinkingInTools: boolean;
    useRealTimeSearch: boolean;
    streamResponses: boolean;
    autoSwitchModels: boolean;
    costWarningThreshold: number;
  };
  usage: Record<string, number>; // Usage cost per provider
}
