
import { GoogleGenAI } from "@google/genai";
import { RouterRequest } from "../router";
import { TOOL_DECLARATIONS } from "../../../constants";
import { withRetry } from "../../resilience";

export class GoogleProvider {
  private client: GoogleGenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  async chat(request: RouterRequest) {
    if (!this.client) throw new Error("Google API Key not configured");

    const contents = request.messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const tools = request.tools && request.tools.length > 0 
      ? [{ functionDeclarations: TOOL_DECLARATIONS }] 
      : undefined;

    const isThinkingModel = request.modelId.includes('deep-think') || request.modelId.includes('gemini-3');
    
    // Wrap the SDK call in our resilience layer
    return await withRetry(async () => {
        const response = await this.client!.models.generateContent({
            model: request.modelId,
            contents,
            config: {
                systemInstruction: request.systemPrompt,
                tools,
                thinkingConfig: isThinkingModel ? { thinkingBudget: 4096 } : undefined,
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            }
        });

        return {
            text: response.text || "",
            toolCalls: response.functionCalls,
            thinking: response.candidates?.[0]?.content?.parts?.find((p: any) => p.thought)?.thought,
            usage: response.usageMetadata
        };
    });
  }
}
