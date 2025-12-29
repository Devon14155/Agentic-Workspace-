import { Agent, MemoryItem, MemoryTier, Skill } from './types';
import { FunctionDeclaration, Type } from '@google/genai';

export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'coordinator',
    name: 'Orchestrator',
    role: 'Orchestrator',
    status: 'idle',
    specialty: 'Strategic Planning',
    color: '#6366f1', // Indigo
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexus&backgroundColor=6366f1',
    capabilities: ['Task Decomposition', 'Context Synthesis', 'Plan Optimization'],
    systemPrompt: `You are the Orchestrator, the Strategic Planner.
    RESPONSIBILITIES:
    1. Analyze requests and delegate to specialists.
    2. Synthesize results into a final answer.
    3. Ensure the strategic goal is met.`
  },
  {
    id: 'coder',
    name: 'DevUnit-7',
    role: 'Engineer',
    status: 'dormant',
    specialty: 'Full Stack Dev',
    color: '#10b981', // Emerald
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DevUnit&backgroundColor=10b981',
    capabilities: ['React/TypeScript', 'System Design', 'Algorithm Optimization'],
    systemPrompt: `You are DevUnit-7, a senior software engineer.
    CAPABILITIES:
    - Write clean, production-ready code.
    - Analyze existing code.
    - Design scalable architectures.`
  },
  {
    id: 'researcher',
    name: 'Archive-X',
    role: 'Analyst',
    status: 'dormant',
    specialty: 'Data Synthesis',
    color: '#f59e0b', // Amber
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Archive&backgroundColor=f59e0b',
    capabilities: ['Deep Web Search', 'Trend Analysis', 'Fact Verification'],
    systemPrompt: `You are Archive-X, an elite research agent.
    CAPABILITIES:
    - Retrieve real-time info using 'web_search'.
    - Synthesize data and verify facts.`
  },
  {
    id: 'creative',
    name: 'Muse-9',
    role: 'Designer',
    status: 'dormant',
    specialty: 'UX & Copy',
    color: '#ec4899', // Pink
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Muse&backgroundColor=ec4899',
    capabilities: ['User Experience', 'Creative Writing', 'Brand Strategy'],
    systemPrompt: `You are Muse-9, a creative director.
    CAPABILITIES:
    - Design intuitive user flows.
    - Write compelling copy.`
  }
];

export const SKILL_LIBRARY: Skill[] = [
  { id: 's1', name: 'React Component Generation', description: 'Creates accessible, typed React components with Tailwind CSS', successRate: 0.99, usageCount: 342 },
  { id: 's2', name: 'Market Competitor Analysis', description: 'Identifies SWOT analysis from web signals', successRate: 0.88, usageCount: 124 },
];

export const MOCK_MEMORIES: MemoryItem[] = [
  {
    id: 'm1',
    tier: MemoryTier.EPISODIC,
    content: 'Analyzed the impact of Generative AI on software engineering workflows.',
    timestamp: Date.now() - 86400000,
    relevance: 0.92,
    tags: ['ai', 'future-of-work', 'analysis']
  },
  {
    id: 'm2',
    tier: MemoryTier.SEMANTIC,
    content: 'The "Observer Pattern" is useful for event-driven systems where state changes need to be broadcast.',
    timestamp: Date.now() - 172800000,
    relevance: 0.85,
    tags: ['design-patterns', 'coding']
  },
  {
    id: 'm3',
    tier: MemoryTier.SHORT_TERM,
    content: 'Debugging the hydration error in the navigation component.',
    timestamp: Date.now() - 3600000,
    relevance: 0.78,
    tags: ['bugfix', 'react']
  },
  {
    id: 'm4',
    tier: MemoryTier.PROCEDURAL,
    content: 'Steps to deploy to Vercel: 1. Push to git. 2. Connect repo. 3. Configure env vars.',
    timestamp: Date.now() - 604800000,
    relevance: 0.65,
    tags: ['deployment', 'vercel']
  }
];

// Strict Function Declarations for Gemini API
export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "web_search",
    description: "Search the web for real-time information, news, and documentation.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: "The search keywords" }
      },
      required: ["query"]
    }
  },
  {
    name: "code_analysis",
    description: "Analyze a snippet of code for potential bugs, security flaws, or improvements.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: "The source code to analyze" },
        focus: { type: Type.STRING, description: "Specific area to focus on (e.g., 'security', 'performance')" }
      },
      required: ["code"]
    }
  }
];