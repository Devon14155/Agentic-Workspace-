
import { RouterRequest } from "../router";
import { withRetry } from "../../resilience";

export class DeepSeekProvider {
  private baseUrl = "https://api.deepseek.com";

  constructor(private apiKey?: string) {}

  async chat(request: RouterRequest) {
    if (!this.apiKey) throw new Error("DeepSeek API Key not configured");

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

    return await withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`DeepSeek API Error: ${err}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      
      const thinking = choice.message.reasoning_content || null;

      return {
        text: choice.message.content || "",
        toolCalls: choice.message.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments)
        })),
        thinking,
        usage: data.usage
      };
    });
  }
}
