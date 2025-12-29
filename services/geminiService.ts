
import { GoogleGenAI, GenerateContentResponse, Type, FunctionCall, FunctionResponse, UsageMetadata } from "@google/genai";
import { INITIAL_AGENTS, TOOL_DECLARATIONS } from "../constants";
import { PlanStep } from "../types";
import { storage } from "./storage";
import { withRetry } from "./resilience";

let aiClient: GoogleGenAI | null = null;

// --- API Key Management ---

export const getStoredApiKey = async (): Promise<string | null> => {
  return await storage.getApiKey();
};

export const setStoredApiKey = async (key: string) => {
  await storage.saveApiKey(key);
  aiClient = null; // Reset client
};

export const validateApiKey = async (key: string): Promise<boolean> => {
  try {
    const testClient = new GoogleGenAI({ apiKey: key });
    await withRetry<GenerateContentResponse>(() => testClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Test",
    }));
    return true;
  } catch (e) {
    return false;
  }
};

const getClient = async () => {
  if (aiClient) return aiClient;
  
  const apiKey = await getStoredApiKey() || process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key missing. Please configure your key in Settings.");
  }
  
  aiClient = new GoogleGenAI({ apiKey });
  return aiClient;
};

// --- Vector Embeddings ---

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text) return [];
  try {
    const client = await getClient();
    // Wrap embedding in retry logic
    const response: any = await withRetry(() => client.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    }));
    
    const values = response.embedding?.values || response.embeddings?.[0]?.values;
    
    if (!values) throw new Error("Failed to generate embedding");
    return values;
  } catch (error) {
    console.error("Embedding generation failed:", error);
    return []; 
  }
};

// --- Real Tool Implementations ---

export const performWebSearch = async (query: string): Promise<{ text: string; usage?: UsageMetadata }> => {
  try {
    const client = await getClient();
    const response = await withRetry<GenerateContentResponse>(() => client.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: `Search query: ${query}. Summarize the top findings with sources.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    }));

    const text = response.text || "No results found.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((c: any) => c.web?.title ? `- ${c.web.title}: ${c.web.uri}` : null)
      .filter(Boolean)
      .join('\n');

    return { text: sources ? `${text}\n\nSources:\n${sources}` : text, usage: response.usageMetadata };
  } catch (error) {
    return { text: `Search failed: ${(error as Error).message}` };
  }
};

export const analyzeCode = async (code: string, focus?: string): Promise<{ text: string; usage?: UsageMetadata }> => {
  try {
    const client = await getClient();
    const response = await withRetry<GenerateContentResponse>(() => client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this code focusing on ${focus || 'general quality'}:\n\n${code}`,
      config: {
        systemInstruction: "You are a senior code reviewer. Be concise, critical, and constructive."
      }
    }));
    return { text: response.text || "No analysis generated.", usage: response.usageMetadata };
  } catch (error) {
    return { text: `Analysis failed: ${(error as Error).message}` };
  }
};

// --- Planning Service ---

export const generateAgentPlan = async (
  userRequest: string, 
  context: string
): Promise<{ plan: PlanStep[]; usage?: UsageMetadata }> => {
  const client = await getClient();
  
  try {
    const response = await withRetry<GenerateContentResponse>(() => client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        Context from Memory Bank: ${context}
        User Request: ${userRequest}
        
        Available Agents:
        ${INITIAL_AGENTS.map(a => `- ${a.id} (${a.name}): ${a.role}`).join('\n')}
        
        Create a detailed execution plan. Return ONLY JSON.
        Ensure steps are granular and assigned to the correct specialist.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              agentId: { type: Type.STRING },
              description: { type: Type.STRING },
              dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "agentId", "description", "dependencies"]
          }
        }
      }
    }));

    const planData = JSON.parse(response.text || "[]");
    return { 
      plan: planData.map((p: any) => ({ ...p, status: 'pending' })),
      usage: response.usageMetadata
    };
  } catch (error) {
    console.error("Planning Error:", error);
    throw error;
  }
};

// --- Execution Service ---

export interface ExecutionResponse {
  text: string;
  thinking?: string;
  functionCalls?: FunctionCall[];
  usage?: UsageMetadata;
}

export const sendMessageToAgent = async (
  agentId: string,
  history: any[], 
  taskContext: string,
  toolResponses?: FunctionResponse[] 
): Promise<ExecutionResponse> => {
  const client = await getClient();
  const agent = INITIAL_AGENTS.find(a => a.id === agentId) || INITIAL_AGENTS[0];

  const parts: any[] = [{ text: `TASK CONTEXT:\n${taskContext}` }];
  if (toolResponses && toolResponses.length > 0) {
    parts.push({ text: `\n\nTOOL RESULTS:\n${JSON.stringify(toolResponses)}` });
  }

  try {
    const response = await withRetry<GenerateContentResponse>(() => client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: `${agent.systemPrompt}\n\nYou have access to tools. Use them if necessary to complete the task.`,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        thinkingConfig: { thinkingBudget: 2048 }
      }
    }));

    return { 
      text: response.text || "", 
      functionCalls: response.functionCalls, 
      thinking: response.candidates?.[0]?.content?.parts?.find(p => p.thought)?.thought as string | undefined,
      usage: response.usageMetadata
    };

  } catch (error) {
    console.error("Execution Error:", error);
    throw error;
  }
};
