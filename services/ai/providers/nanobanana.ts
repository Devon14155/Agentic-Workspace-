
import { RouterRequest } from "../router";

// Type definitions for Chrome's experimental AI API
declare global {
  interface Window {
    ai: {
      languageModel: {
        create: (options?: any) => Promise<any>;
        capabilities: () => Promise<any>;
      };
    };
  }
}

export class NanoBananaProvider {
  constructor(private apiKey?: string) {}

  async chat(request: RouterRequest) {
    // Check for Chrome Built-in AI (Gemini Nano)
    if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
      try {
        const capabilities = await window.ai.languageModel.capabilities();
        
        if (capabilities.available === 'no') {
           return this.simulatedResponse(request, "Chrome Built-in AI detected but models are not downloaded.");
        }

        const session = await window.ai.languageModel.create({
          systemPrompt: request.systemPrompt
        });

        // Construct a single prompt from history (current API limitation for simple sessions)
        const lastMessage = request.messages[request.messages.length - 1];
        const context = request.messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n');
        const fullPrompt = `${context}\n${lastMessage.role}: ${lastMessage.content}`;

        const result = await session.prompt(fullPrompt);

        return {
          text: result,
          usage: { totalTokenCount: 0 } // Local, so no token count usually returned yet
        };

      } catch (e) {
        console.warn("Chrome AI Error:", e);
        return this.simulatedResponse(request, `Chrome AI Error: ${(e as Error).message}`);
      }
    }

    return this.simulatedResponse(request, "Chrome Built-in AI (window.ai) not found in this browser. Running in simulation mode.");
  }

  private simulatedResponse(request: RouterRequest, note: string) {
    return {
        text: `[Nano Banana Edge]: ${note}\n\nProcessed request for ${request.modelId}. (Simulated Response)`,
        usage: { totalTokenCount: 50 }
    };
  }
}
