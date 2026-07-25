// LLM provider abstraction. Swap implementations by changing LLM_PROVIDER in env.
// Add a new provider by implementing this interface and registering it in `providers`.

export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResponse {
  text: string;
  provider: string;
  model: string;
}

export interface LLMProvider {
  complete(req: CompletionRequest): Promise<CompletionResponse>;
}

// -------- Mock (no network, deterministic) --------
export class MockProvider implements LLMProvider {
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    return {
      text: `MOCK RESPONSE (no LLM_API_KEY set)\nSystem: ${req.system.slice(0, 60)}…\nUser: ${req.user.slice(0, 200)}`,
      provider: 'mock',
      model: 'mock',
    };
  }
}

// -------- OpenAI-compatible --------
class OpenAIProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl = 'https://api.openai.com/v1',
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        max_tokens: req.maxTokens ?? 400,
        temperature: req.temperature ?? 0.4,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      model: string;
    };
    return {
      text: data.choices[0]?.message.content ?? '',
      provider: 'openai',
      model: data.model,
    };
  }
}

// -------- Anthropic --------
class AnthropicProvider implements LLMProvider {
  constructor(private readonly apiKey: string, private readonly model: string) {}
  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: req.maxTokens ?? 400,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
        temperature: req.temperature ?? 0.4,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic ${res.status}: ${body.slice(0, 200)}`);
    }
    const data = (await res.json()) as {
      content: { type: string; text: string }[];
      model: string;
    };
    const text = data.content.find((c) => c.type === 'text')?.text ?? '';
    return { text, provider: 'anthropic', model: data.model };
  }
}

export function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER ?? 'mock';
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL ?? 'gpt-4o-mini';

  if (provider === 'openai') {
    if (!apiKey) throw new Error('LLM_PROVIDER=openai but LLM_API_KEY is unset');
    return new OpenAIProvider(apiKey, model);
  }
  if (provider === 'anthropic') {
    if (!apiKey) throw new Error('LLM_PROVIDER=anthropic but LLM_API_KEY is unset');
    return new AnthropicProvider(apiKey, model);
  }
  return new MockProvider();
}
