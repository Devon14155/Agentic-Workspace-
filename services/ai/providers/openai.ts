
import { AIProviderId } from "../../../types";
import { RouterRequest } from "../router";
import { withRetry } from "../../resilience";

export class OpenAICompatibleProvider {
  constructor(
    private providerId: AIProviderId,
    private apiKey?: string,
    private baseUrl?: string
  ) {}

  async chat(request: RouterRequest) {
    if (!this.apiKey && this.providerId !== AIProviderId.Ollama) {
      throw new Error(`${this.providerId} API Key not configured`);
    }
    
    const messages = [
      ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
      ...request.messages.map(m => ({ role: m.role, content: m.content }))
    ];

    const body: any = {
      model: request.modelId,
      messages,
      stream: false
    };

    // GPT-5.2 Pro Specifics
    if (request.modelId === 'gpt-5.2-pro') {
       body.reasoning_effort = 'high';
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        type: 'function',
        function: t
      }));
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
    };

    return await withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`${this.providerId} API Error (${response.status}): ${err}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      
      return {
        text: choice.message.content || "",
        toolCalls: choice.message.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments)
        })),
        usage: data.usage
      };
    });
  }
}
