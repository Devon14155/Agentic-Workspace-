
import { MemoryItem, MemoryTier, WorkingMemoryState, GraphNode, GraphLink } from '../types';
import { generateEmbedding } from './geminiService';

const STORAGE_KEY = 'nexus_memory_store_v2';

// Vector Math Utils
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
};

class WorkingMemory {
  private state: WorkingMemoryState = {
    scratchpad: {},
    focusStack: [],
    recentThoughts: [],
    hypotheses: []
  };

  public updateScratchpad(key: string, value: any) {
    this.state.scratchpad[key] = value;
  }

  public pushThought(thought: string) {
    this.state.recentThoughts.push(thought);
    if (this.state.recentThoughts.length > 10) this.state.recentThoughts.shift();
  }

  public addHypothesis(content: string, confidence: number) {
    this.state.hypotheses.push({ id: crypto.randomUUID(), content, confidence });
  }

  public getSnapshot(): WorkingMemoryState {
    return { ...this.state };
  }

  public clear() {
    this.state = { scratchpad: {}, focusStack: [], recentThoughts: [], hypotheses: [] };
  }
}

class MemorySystem {
  private memories: MemoryItem[] = [];
  public workingMemory: WorkingMemory;

  constructor() {
    this.workingMemory = new WorkingMemory();
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.memories = JSON.parse(stored);
      } else {
        this.memories = [];
        // Bootstrap if empty
        if (this.memories.length === 0) {
           this.addMemory("System Initialized: Nexus Agentic Workspace v2.0", MemoryTier.SEMANTIC, ['system', 'bootstrap']);
        }
      }
    } catch (e) {
      console.error('Failed to load memories', e);
      this.memories = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memories));
    } catch (e) {
      console.error('Failed to persist memories', e);
    }
  }

  public async addMemory(content: string, tier: MemoryTier, tags: string[] = []): Promise<MemoryItem> {
    const embedding = await generateEmbedding(content);
    
    // Find connections (Associative Memory)
    const connections: string[] = [];
    if (embedding.length > 0) {
      this.memories.forEach(m => {
        if (m.embedding && cosineSimilarity(embedding, m.embedding) > 0.8) {
          connections.push(m.id);
        }
      });
    }

    const memory: MemoryItem = {
      id: crypto.randomUUID(),
      content,
      tier,
      tags,
      timestamp: Date.now(),
      relevance: 1.0,
      embedding: embedding.length > 0 ? embedding : undefined,
      connections
    };

    this.memories.push(memory);
    this.save();
    return memory;
  }

  public async getContext(query: string, limit: number = 5): Promise<string> {
    const queryEmbedding = await generateEmbedding(query);
    const hasVector = queryEmbedding.length > 0;

    // Scoring Logic: Vector Similarity + Recency + Tier Weight
    const scored = this.memories.map(m => {
      let score = 0;

      // 1. Vector Search
      if (hasVector && m.embedding) {
        score += cosineSimilarity(queryEmbedding, m.embedding) * 0.7;
      } else {
        // Keyword Fallback
        const terms = query.toLowerCase().split(' ').filter(t => t.length > 3);
        terms.forEach(term => {
          if (m.content.toLowerCase().includes(term)) score += 0.2;
        });
      }

      // 2. Recency (Decay)
      const ageHours = (Date.now() - m.timestamp) / (1000 * 60 * 60);
      const decay = Math.max(0, 0.1 - (ageHours * 0.005)); // Slight boost for very recent
      score += decay;

      // 3. Tier Weighting
      if (m.tier === MemoryTier.SEMANTIC) score *= 1.1; // Prefer facts
      if (m.tier === MemoryTier.PROCEDURAL) score *= 1.2; // Prefer instructions

      return { ...m, relevance: score };
    });

    const topMemories = scored.sort((a, b) => b.relevance - a.relevance).slice(0, limit);
    
    // Format for LLM
    return topMemories.map(m => `[${m.tier.toUpperCase()}] ${m.content}`).join('\n');
  }

  public getAll(): MemoryItem[] {
    return [...this.memories].sort((a, b) => b.timestamp - a.timestamp);
  }

  public clear() {
    this.memories = [];
    this.workingMemory.clear();
    this.save();
  }

  // --- Graph Visualization Data ---
  public getGraphData(): { nodes: GraphNode[], links: GraphLink[] } {
    const nodes: GraphNode[] = this.memories.map(m => ({
      id: m.id,
      label: m.content.length > 30 ? m.content.substring(0, 30) + '...' : m.content,
      type: m.tier,
      val: m.tier === MemoryTier.SEMANTIC ? 8 : 5,
      color: m.tier === MemoryTier.SEMANTIC ? '#f59e0b' : 
             m.tier === MemoryTier.EPISODIC ? '#6366f1' : 
             m.tier === MemoryTier.PROCEDURAL ? '#10b981' : '#94a3b8'
    }));

    const links: GraphLink[] = [];
    
    // Create links based on stored connections and dynamic similarity
    // We limit links to avoid visual clutter
    for (let i = 0; i < this.memories.length; i++) {
      const mA = this.memories[i];
      if (!mA.embedding) continue;

      for (let j = i + 1; j < this.memories.length; j++) {
        const mB = this.memories[j];
        if (!mB.embedding) continue;

        const sim = cosineSimilarity(mA.embedding, mB.embedding);
        if (sim > 0.75) {
          links.push({
            source: mA.id,
            target: mB.id,
            value: sim
          });
        }
      }
    }

    return { nodes, links };
  }

  // --- Consolidation ---
  // Merges short-term memories into episodic summaries
  public async consolidate(llmSynthesizer: (text: string) => Promise<string>) {
    const shortTerm = this.memories.filter(m => m.tier === MemoryTier.SHORT_TERM);
    if (shortTerm.length < 3) return; // Not enough to consolidate

    const textToConsolidate = shortTerm.map(m => m.content).join('\n');
    try {
      const summary = await llmSynthesizer(`Synthesize these short-term execution logs into a concise Episodic Memory:\n${textToConsolidate}`);
      
      // Add new Episode
      await this.addMemory(summary, MemoryTier.EPISODIC, ['consolidation', 'auto-generated']);
      
      // Clear Short Term (in a real DB we might archive them, here we just remove to keep localStorage clean)
      this.memories = this.memories.filter(m => m.tier !== MemoryTier.SHORT_TERM);
      this.save();
    } catch (e) {
      console.error("Consolidation failed", e);
    }
  }
}

export const memoryService = new MemorySystem();
