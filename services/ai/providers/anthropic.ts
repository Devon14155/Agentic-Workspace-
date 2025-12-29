
import { RouterRequest } from "../router";
import { withRetry } from "../../resilience";

export class AnthropicProvider {
  constructor(private apiKey?: string) {}

  async chat(request: RouterRequest) {
    if (!this.apiKey) throw new Error("Anthropic API Key not configured");

    const messages = request.messages.map(m => ({
      role: m.role === 'model' ? 'assistant' : m.role,
      content: m.content
    }));

    const validMessages = messages.filter(m => m.role !== 'system');
    
    const body: any = {
      model: request.modelId,
      messages: validMessages,
      system: request.systemPrompt,
      max_tokens: 8192
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters
      }));
    }

    return await withRetry(async () => {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey!,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API Error: ${err}`);
      }

      const data = await response.json();
      
      const textBlock = data.content.find((c: any) => c.type === 'text');
      const toolUseBlocks = data.content.filter((c: any) => c.type === 'tool_use');

      return {
        text: textBlock?.text || "",
        toolCalls: toolUseBlocks.map((tu: any) => ({
          id: tu.id,
          name: tu.name,
          args: tu.input
        })),
        usage: data.usage
      };
    });
  }
}
