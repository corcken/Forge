import {
  assertOk,
  describeError,
  joinUrl,
  readJson,
  request,
  safeText,
  DEFAULT_TIMEOUT_MS,
} from './http-client.js';
import {
  AI_EXTRACTION_JSON_SCHEMA,
  buildExtractionUserText,
  coerceExtractionOutput,
  parseLooseJson,
} from './extraction-prompt.js';
import type {
  ExtractPartFactsParams,
  ExtractPartFactsResult,
  FetchModelsParams,
  IAiProviderAdapter,
  NormalizedAiModel,
  TestConnectionParams,
  TestConnectionResult,
} from './adapter.interface.js';

interface OpenAiModelEntry {
  id: string;
  owned_by?: string;
  context_length?: number;
}

interface OpenAiModelsResponse {
  data?: OpenAiModelEntry[];
}

interface OpenAiChatResponse {
  choices?: { message?: { content?: string | null } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * Universeller Adapter fuer OpenAI, DeepSeek, OpenRouter und lokales Ollama.
 * Nutzt `GET /v1/models` und `POST /v1/chat/completions` mit JSON-Schema- und
 * JSON-Format-Fallback (fuer Provider ohne `response_format`-Support).
 */
export class OpenAiCompatAdapter implements IAiProviderAdapter {
  readonly adapterType = 'OPENAI_COMPAT' as const;

  async testConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
    const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const start = performance.now();
    try {
      const res = await request(
        joinUrl(params.baseUrl, 'v1/models'),
        { method: 'GET', headers: this.authHeaders(params.apiKey) },
        timeoutMs,
      );
      if (!res.ok) {
        return {
          ok: false,
          latencyMs: this.elapsed(start),
          error: `HTTP ${res.status}: ${await safeText(res)}`,
        };
      }
      await res.arrayBuffer();
      return { ok: true, latencyMs: this.elapsed(start) };
    } catch (error) {
      return { ok: false, latencyMs: this.elapsed(start), error: describeError(error, timeoutMs) };
    }
  }

  async fetchAvailableModels(params: FetchModelsParams): Promise<NormalizedAiModel[]> {
    const res = await request(
      joinUrl(params.baseUrl, 'v1/models'),
      { method: 'GET', headers: this.authHeaders(params.apiKey) },
      params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    await assertOk(res);
    const payload = await readJson<OpenAiModelsResponse>(res);
    return (payload.data ?? []).map((entry) => this.normalize(entry));
  }

  async extractPartFacts(params: ExtractPartFactsParams): Promise<ExtractPartFactsResult> {
    const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const url = joinUrl(params.baseUrl, 'v1/chat/completions');
    const headers = { ...this.authHeaders(params.apiKey), 'content-type': 'application/json' };
    const messages = this.buildMessages(params);

    const firstAttempt = await request(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.modelId,
          messages,
          temperature: 0,
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'ai_extraction',
              strict: false,
              schema: AI_EXTRACTION_JSON_SCHEMA,
            },
          },
        }),
      },
      timeoutMs,
    );
    const res =
      firstAttempt.ok || ![400, 404, 422].includes(firstAttempt.status)
        ? firstAttempt
        : await request(
            url,
            {
              method: 'POST',
              headers,
              body: JSON.stringify({ model: params.modelId, messages, temperature: 0 }),
            },
            timeoutMs,
          );
    await assertOk(res);
    const payload = await readJson<OpenAiChatResponse>(res);
    const rawText = payload.choices?.[0]?.message?.content ?? '';
    return {
      data: coerceExtractionOutput(parseLooseJson(rawText)),
      inputTokens: payload.usage?.prompt_tokens ?? 0,
      outputTokens: payload.usage?.completion_tokens ?? 0,
    };
  }

  private buildMessages(params: ExtractPartFactsParams): unknown[] {
    const userText = params.userText
      ? buildExtractionUserText(params.userText)
      : '(kein Textinhalt uebergeben)';
    const userContent: unknown[] = [{ type: 'text', text: userText }];
    if (params.pdf && params.pdf.mimeType.startsWith('image/')) {
      userContent.push({
        type: 'image_url',
        image_url: { url: `data:${params.pdf.mimeType};base64,${params.pdf.base64}` },
      });
    }
    return [
      { role: 'system', content: params.systemPrompt },
      { role: 'user', content: userContent },
    ];
  }

  private normalize(entry: OpenAiModelEntry): NormalizedAiModel {
    return {
      modelId: entry.id,
      displayName: entry.id,
      contextWindow: entry.context_length ?? null,
      supportsVision: /(vision|gpt-4o|gpt-4\.1|llava|gemini)/iu.test(entry.id),
      supportsJsonSchema: true,
      inputPricePer1m: null,
      outputPricePer1m: null,
    };
  }

  private authHeaders(apiKey: string | null): Record<string, string> {
    return apiKey ? { authorization: `Bearer ${apiKey}` } : {};
  }

  private elapsed(start: number): number {
    return Math.round(performance.now() - start);
  }
}
