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

interface GeminiModelEntry {
  name: string;
  displayName?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
}

interface GeminiModelsResponse {
  models?: GeminiModelEntry[];
}

interface GeminiGenerateResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

/** Nativer Adapter fuer die Google Gemini API (Text + natives PDF). */
export class GeminiAdapter implements IAiProviderAdapter {
  readonly adapterType = 'GEMINI' as const;

  async testConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
    const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const start = performance.now();
    try {
      const res = await request(this.modelsUrl(params.baseUrl, params.apiKey), { method: 'GET' }, timeoutMs);
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
      this.modelsUrl(params.baseUrl, params.apiKey),
      { method: 'GET' },
      params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    await assertOk(res);
    const payload = await readJson<GeminiModelsResponse>(res);
    return (payload.models ?? []).map((entry) => this.normalize(entry));
  }

  async extractPartFacts(params: ExtractPartFactsParams): Promise<ExtractPartFactsResult> {
    const parts: Record<string, unknown>[] = [];
    const text = params.userText ? buildExtractionUserText(params.userText) : null;
    if (text) parts.push({ text });
    if (params.pdf) {
      parts.push({
        inlineData: { mimeType: params.pdf.mimeType, data: params.pdf.base64 },
      });
    }
    if (parts.length === 0) parts.push({ text: buildExtractionUserText('(kein Inhalt uebergeben)') });

    const url = `${this.modelsBase(params.baseUrl)}/${params.modelId}:generateContent${this.keyQuery(params.apiKey)}`;
    const res = await request(
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: params.systemPrompt }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0 },
        }),
      },
      params.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    await assertOk(res);
    const payload = await readJson<GeminiGenerateResponse>(res);
    const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return {
      data: coerceExtractionOutput(parseLooseJson(rawText)),
      inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  private normalize(entry: GeminiModelEntry): NormalizedAiModel {
    const modelId = entry.name.replace(/^models\//u, '');
    const methods = entry.supportedGenerationMethods ?? [];
    return {
      modelId,
      displayName: entry.displayName ?? modelId,
      contextWindow: entry.inputTokenLimit ?? null,
      supportsVision: methods.includes('generateContent') && /gemini/iu.test(modelId),
      supportsJsonSchema: true,
      inputPricePer1m: null,
      outputPricePer1m: null,
    };
  }

  private modelsBase(baseUrl: string): string {
    return joinUrl(baseUrl, 'v1beta/models');
  }

  private modelsUrl(baseUrl: string, apiKey: string | null): string {
    return `${this.modelsBase(baseUrl)}${this.keyQuery(apiKey)}`;
  }

  private keyQuery(apiKey: string | null): string {
    return apiKey ? `?key=${encodeURIComponent(apiKey)}` : '';
  }

  private elapsed(start: number): number {
    return Math.round(performance.now() - start);
  }
}
