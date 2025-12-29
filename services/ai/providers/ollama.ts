
import { RouterRequest } from "../router";
import { withRetry } from "../../resilience";

export class OllamaProvider {
  constructor(private baseUrl: string = "http://localhost:11434/v1") {}

  async checkConnection(): Promise<boolean> {
    try {
      const res = await fetch(this.baseUrl.replace('/v1', '/api/tags'));
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async chat(request: RouterRequest) {
    const isConnected = await this.checkConnection();
    if (!isConnected) {
        throw new Error("Ollama server not reachable. Ensure it is running.");
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

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        type: 'function',
        function: t
      }));
    }

    // Retry configuration for local - less strict than cloud
    return await withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Ollama API Error: ${err}`);
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
    }, { retries: 1, initialDelay: 500 }); // Fewer retries for local
  }
}
