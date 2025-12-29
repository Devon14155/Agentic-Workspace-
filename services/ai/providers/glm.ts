
import { RouterRequest } from "../router";
import { withRetry } from "../../resilience";

// Utility to generate JWT for GLM (kept same)
async function generateGlmToken(apiKey: string): Promise<string> {
  const [id, secret] = apiKey.split('.');
  if (!id || !secret) throw new Error("Invalid GLM API Key Format (Expected id.secret)");

  const encoder = new TextEncoder();
  const now = Date.now();
  
  const header = { alg: "HS256", sign_type: "SIGN" };
  const payload = {
    api_key: id,
    exp: now + 3600 * 1000,
    timestamp: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export class GlmProvider {
  constructor(private apiKey?: string, private baseUrl: string = "https://open.bigmodel.cn/api/paas/v4") {}

  async chat(request: RouterRequest) {
    if (!this.apiKey) throw new Error("GLM API Key not configured");
    
    const token = await generateGlmToken(this.apiKey);

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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`GLM API Error: ${err}`);
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
