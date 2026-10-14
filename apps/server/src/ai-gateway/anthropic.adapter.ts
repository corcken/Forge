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

const ANTHROPIC_VERSION = '2023-06-01';

interface AnthropicModelEntry {
  id: string;
  display_name?: string;
}

interface AnthropicModelsResponse {
  data?: AnthropicModelEntry[];
}

interface AnthropicMessagesResponse {
  content?: { type: string; text?: string }[];
  usage?: { input_tokens?: number; output_tokens?: number };
}

/** Adapter fuer die Anthropic Claude API (inkl. PDF-Support und JSON-Prefill). */
export class AnthropicAdapter implements IAiProviderAdapter {
  readonly adapterType = 'ANTHROPIC' as const;

  async testConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
    const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const start = performance.now();
    try {
      const res = await request(
        joinUrl(params.baseUrl, 'v1/models'),
        { method: 'GET', headers: this.headers(params.apiKey) },
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
      { method: 'GET', headers: this.headers(params.apiKey) },
      params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    await assertOk(res);
    const payload = await readJson<AnthropicModelsResponse>(res);
    return (payload.data ?? []).map((entry) => ({
      modelId: entry.id,
      displayName: entry.display_name ?? entry.id,
      contextWindow: null,
      supportsVision: true,
      supportsJsonSchema: false,
      inputPricePer1m: null,
      outputPricePer1m: null,
    }));
  }

  async extractPartFacts(params: ExtractPartFactsParams): Promise<ExtractPartFactsResult> {
    const content: unknown[] = [
      {
        type: 'text',
        text: params.userText
          ? buildExtractionUserText(params.userText)
          : '(kein Textinhalt uebergeben)',
      },
    ];
    if (params.pdf) {
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: params.pdf.mimeType, data: params.pdf.base64 },
      });
    }

    const res = await request(
      joinUrl(params.baseUrl, 'v1/messages'),
      {
        method: 'POST',
        headers: { ...this.headers(params.apiKey), 'content-type': 'application/json' },
        body: JSON.stringify({
          model: params.modelId,
          max_tokens: 2048,
          temperature: 0,
          system: params.systemPrompt,
          messages: [
            { role: 'user', content },
            { role: 'assistant', content: '{' },
          ],
        }),
      },
      params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    await assertOk(res);
    const payload = await readJson<AnthropicMessagesResponse>(res);
    const block = payload.content?.find((part) => part.type === 'text');
    const rawText = `{${block?.text ?? ''}`;
    return {
      data: coerceExtractionOutput(parseLooseJson(rawText)),
      inputTokens: payload.usage?.input_tokens ?? 0,
      outputTokens: payload.usage?.output_tokens ?? 0,
    };
  }

  private headers(apiKey: string | null): Record<string, string> {
    const headers: Record<string, string> = { 'anthropic-version': ANTHROPIC_VERSION };
    if (apiKey) headers['x-api-key'] = apiKey;
    return headers;
  }

  private elapsed(start: number): number {
    return Math.round(performance.now() - start);
  }
}
