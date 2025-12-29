
import { AIModel, AIProviderId } from '../../../types';

export const MODEL_REGISTRY: AIModel[] = [
  // --- GOOGLE GEMINI ---
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    providerId: AIProviderId.Google,
    contextWindow: 2000000,
    inputPrice: 0.50,
    outputPrice: 3.00,
    capabilities: ['vision', 'toolCalling', 'streaming'],
    badges: ['Default', '2M Context'],
    description: 'Fast, multimodal, huge context window (Dec 2025).'
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    providerId: AIProviderId.Google,
    contextWindow: 2000000,
    inputPrice: 2.50,
    outputPrice: 10.00,
    capabilities: ['vision', 'toolCalling', 'reasoning', 'streaming'],
    badges: ['Reasoning'],
    description: 'Complex reasoning and heavy tasks.'
  },
  {
    id: 'gemini-3-deep-think',
    name: 'Gemini 3 Deep Think',
    providerId: AIProviderId.Google,
    contextWindow: 2000000,
    inputPrice: 5.00,
    outputPrice: 15.00,
    capabilities: ['vision', 'toolCalling', 'reasoning', 'streaming'],
    badges: ['Max Reasoning'],
    description: 'Maximum reasoning depth.'
  },

  // --- OPENAI ---
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    providerId: AIProviderId.OpenAI,
    contextWindow: 256000,
    inputPrice: 1.75,
    outputPrice: 14.00,
    capabilities: ['vision', 'toolCalling', 'reasoning', 'streaming'],
    badges: ['Flagship'],
    description: 'The standard for high intelligence (Dec 11).'
  },
  {
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    providerId: AIProviderId.OpenAI,
    contextWindow: 256000,
    inputPrice: 5.00,
    outputPrice: 30.00,
    capabilities: ['vision', 'toolCalling', 'reasoning', 'streaming'],
    badges: ['Max Reasoning'],
    description: 'Extended thinking for complex problems.'
  },
  {
    id: 'gpt-5.2-codex',
    name: 'GPT-5.2 Codex',
    providerId: AIProviderId.OpenAI,
    contextWindow: 128000,
    inputPrice: 1.50,
    outputPrice: 12.00,
    capabilities: ['toolCalling', 'streaming'],
    badges: ['Coding'],
    description: 'Specialized for software engineering.'
  },
  {
    id: 'gpt-image-1.5',
    name: 'GPT Image 1.5',
    providerId: AIProviderId.OpenAI,
    contextWindow: 4096,
    inputPrice: 0.04, // Per image approx
    outputPrice: 0.04,
    capabilities: ['vision'],
    badges: ['Image Gen'],
    description: '4x faster image generation.'
  },

  // --- ANTHROPIC ---
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude 4.5 Opus',
    providerId: AIProviderId.Anthropic,
    contextWindow: 200000,
    inputPrice: 5.00,
    outputPrice: 25.00,
    capabilities: ['vision', 'toolCalling', 'computerUse', 'streaming', 'reasoning'],
    badges: ['Deep Thinker'],
    description: 'Highest capability for nuanced tasks.'
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude 4.5 Sonnet',
    providerId: AIProviderId.Anthropic,
    contextWindow: 200000,
    inputPrice: 3.00,
    outputPrice: 15.00,
    capabilities: ['vision', 'toolCalling', 'computerUse', 'streaming'],
    badges: ['Balanced'],
    description: 'Best balance of intelligence and speed.'
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude 4.5 Haiku',
    providerId: AIProviderId.Anthropic,
    contextWindow: 200000,
    inputPrice: 0.25,
    outputPrice: 1.25,
    capabilities: ['vision', 'toolCalling', 'streaming'],
    badges: ['Fast'],
    description: 'Fast and cost-effective.'
  },

  // --- DEEPSEEK ---
  {
    id: 'deepseek-chat',
    name: 'DeepSeek V3.2',
    providerId: AIProviderId.DeepSeek,
    contextWindow: 128000,
    inputPrice: 0.28,
    outputPrice: 1.10,
    capabilities: ['toolCalling', 'thinkingInTools', 'streaming'],
    badges: ['Best Value'],
    description: 'Incredible performance per dollar.'
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek V3.2 Speciale',
    providerId: AIProviderId.DeepSeek,
    contextWindow: 128000,
    inputPrice: 0.50,
    outputPrice: 2.00,
    capabilities: ['reasoning', 'toolCalling', 'streaming', 'thinkingInTools'],
    badges: ['Gold Medal Logic'],
    description: 'Top-tier reasoning performance.'
  },

  // --- GROK (xAI) ---
  {
    id: 'grok-beta',
    name: 'Grok 4.1',
    providerId: AIProviderId.Grok,
    contextWindow: 256000,
    inputPrice: 5.00,
    outputPrice: 15.00,
    capabilities: ['toolCalling', 'realTimeSearch', 'vision', 'streaming'],
    badges: ['Real-time Search'],
    description: 'Access to real-time X platform data.'
  },
  {
    id: 'grok-voice',
    name: 'Grok Voice',
    providerId: AIProviderId.Grok,
    contextWindow: 128000,
    inputPrice: 4.00,
    outputPrice: 12.00,
    capabilities: ['streaming'],
    badges: ['Audio'],
    description: 'Fastest <1s latency audio model.'
  },

  // --- MOONSHOT (KIMI) ---
  {
    id: 'moonshot-v1-128k',
    name: 'Kimi K2 (Moonshot)',
    providerId: AIProviderId.Moonshot,
    contextWindow: 200000,
    inputPrice: 1.6,
    outputPrice: 1.6,
    capabilities: ['toolCalling', 'streaming'],
    badges: ['Chinese SOTA'],
    description: 'Excellent Chinese/English bilingual.'
  },

  // --- GLM (ZHIPU) ---
  {
    id: 'glm-4.7',
    name: 'GLM 4.7',
    providerId: AIProviderId.GLM,
    contextWindow: 128000,
    inputPrice: 1.0,
    outputPrice: 1.0,
    capabilities: ['vision', 'toolCalling', 'streaming'],
    badges: ['GLM'],
    description: 'Strong general purpose model.'
  },
  {
    id: 'glm-4v',
    name: 'GLM 4V',
    providerId: AIProviderId.GLM,
    contextWindow: 128000,
    inputPrice: 1.0,
    outputPrice: 1.0,
    capabilities: ['vision', 'streaming'],
    badges: ['Vision'],
    description: 'Specialized vision model.'
  },

  // --- OLLAMA (LOCAL) ---
  {
    id: 'llama3.3',
    name: 'Llama 3.3 (Local)',
    providerId: AIProviderId.Ollama,
    contextWindow: 32000,
    inputPrice: 0,
    outputPrice: 0,
    capabilities: ['toolCalling', 'streaming'],
    badges: ['Private'],
    description: 'Runs locally. Requires Ollama.'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large (Local)',
    providerId: AIProviderId.Ollama,
    contextWindow: 32000,
    inputPrice: 0,
    outputPrice: 0,
    capabilities: ['toolCalling', 'streaming'],
    badges: ['Private'],
    description: 'Runs locally.'
  },

  // --- NANO BANANA ---
  {
    id: 'nanobanana-pro',
    name: 'Nano Banana Pro',
    providerId: AIProviderId.NanoBanana,
    contextWindow: 4096,
    inputPrice: 0.1,
    outputPrice: 0.1,
    capabilities: ['vision'],
    badges: ['Edge Image Gen'],
    description: 'Studio-quality edge generation.'
  },

  // --- MISTRAL AI ---
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 2',
    providerId: AIProviderId.Mistral,
    contextWindow: 128000,
    inputPrice: 2.0,
    outputPrice: 6.0,
    capabilities: ['toolCalling', 'streaming'],
    badges: ['EU Flagship'],
    description: 'Strong reasoning and coding.'
  }
];

export const PROVIDER_CONFIGS = {
  [AIProviderId.Google]: { name: 'Google Gemini', icon: 'google', baseUrl: '' },
  [AIProviderId.OpenAI]: { name: 'OpenAI', icon: 'openai', baseUrl: 'https://api.openai.com/v1' },
  [AIProviderId.Anthropic]: { name: 'Anthropic', icon: 'anthropic', baseUrl: 'https://api.anthropic.com/v1' },
  [AIProviderId.DeepSeek]: { name: 'DeepSeek', icon: 'deepseek', baseUrl: 'https://api.deepseek.com/v1' },
  [AIProviderId.Grok]: { name: 'xAI Grok', icon: 'grok', baseUrl: 'https://api.x.ai/v1' },
  [AIProviderId.Moonshot]: { name: 'Moonshot AI', icon: 'moonshot', baseUrl: 'https://api.moonshot.cn/v1' },
  [AIProviderId.GLM]: { name: 'Zhipu GLM', icon: 'glm', baseUrl: 'https://open.bigmodel.cn/api/paas/v4' },
  [AIProviderId.Ollama]: { name: 'Ollama (Local)', icon: 'ollama', baseUrl: 'http://localhost:11434/v1' },
  [AIProviderId.NanoBanana]: { name: 'Nano Banana', icon: 'banana', baseUrl: '' },
  [AIProviderId.Mistral]: { name: 'Mistral AI', icon: 'mistral', baseUrl: 'https://api.mistral.ai/v1' },
  [AIProviderId.Meta]: { name: 'Meta AI', icon: 'meta', baseUrl: '' },
};
