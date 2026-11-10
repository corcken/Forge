import type { AiProviderTestStatus } from '@descriptio-forge/shared';
import { createAdapter } from './adapter-factory.js';
import type {
  ExtractPartFactsResult,
  IAiProviderAdapter,
} from './adapter.interface.js';
import { estimateBatchCost, type CostEstimate } from './cost-estimator.js';
import { assertOk, joinUrl, readJson, request } from './http-client.js';
import { PROVIDER_DEFINITIONS } from './provider-registry.js';
import type { CredentialsStore } from '../vault/credentials-store.js';
import { AiVaultRepository, type AiModelRecord } from '../vault/ai-vault-repository.js';

/** Ergebnis eines Provider-Verbindungstests inkl. persistiertem Status. */
export interface ProviderTestOutcome {
  providerId: string;
  ok: boolean;
  latencyMs: number;
  error: string | null;
  status: AiProviderTestStatus;
}

/** Parameter fuer eine faktorenextrahierende KI-Anfrage. */
export interface ExtractFactsRequest {
  modelId: string;
  systemPrompt: string;
  userText?: string | null;
  pdf?: { base64: string; mimeType: string } | null;
  allowedArchetypeIds: string[];
  timeoutMs?: number;
}

/**
 * Zentrales KI-Gateway: waehlt den passenden Adapter, testet Verbindungen
 * (mit Latenzmessung), synchronisiert Modelle in den globalen Tresor und
 * fuehrt Faktorenextraktionen aus.
 */
export class AiGateway {
  constructor(
    private readonly credentials: CredentialsStore,
    private readonly repository: AiVaultRepository,
  ) {}

  /** Legt die sechs Standard-Provider an, falls noch nicht vorhanden. */
  ensureProvidersSeeded(): void {
    this.repository.ensureProviders(PROVIDER_DEFINITIONS);
  }

  /** Testet die Verbindung live und persistiert Status, Latenz und Fehler. */
  async testProvider(providerId: string): Promise<ProviderTestOutcome> {
    const provider = this.requireProvider(providerId);
    const adapter = createAdapter(provider.adapterType);
    const result = await adapter.testConnection({
      apiKey: this.credentials.getProviderKey(providerId),
      baseUrl: this.resolveBaseUrl(provider.id, provider.baseUrl),
    });
    const status: AiProviderTestStatus = result.ok ? 'OK' : 'ERROR';
    this.repository.saveProviderTestResult(
      providerId,
      status,
      result.latencyMs,
      result.error ?? null,
    );
    return {
      providerId,
      ok: result.ok,
      latencyMs: result.latencyMs,
      error: result.error ?? null,
      status,
    };
  }

  /** Ruft alle verfuegbaren Modelle ab und speichert sie im Tresor. */
  async syncModels(providerId: string): Promise<AiModelRecord[]> {
    const provider = this.requireProvider(providerId);
    const adapter = createAdapter(provider.adapterType);
    const models = await adapter.fetchAvailableModels({
      apiKey: this.credentials.getProviderKey(providerId),
      baseUrl: this.resolveBaseUrl(provider.id, provider.baseUrl),
    });
    this.repository.upsertModels(providerId, models);
    return this.repository.listModels(providerId);
  }

  /** Fuehrt eine Faktorenextraktion ueber den passenden Provider aus. */
  async extractFacts(providerId: string, req: ExtractFactsRequest): Promise<ExtractPartFactsResult> {
    const provider = this.requireProvider(providerId);
    const adapter = createAdapter(provider.adapterType);
    return adapter.extractPartFacts({
      apiKey: this.credentials.getProviderKey(providerId),
      baseUrl: this.resolveBaseUrl(provider.id, provider.baseUrl),
      modelId: req.modelId,
      systemPrompt: req.systemPrompt,
      userText: req.userText ?? null,
      pdf: req.pdf ?? null,
      allowedArchetypeIds: req.allowedArchetypeIds,
      timeoutMs: req.timeoutMs,
    });
  }

  /** Sendet eine strukturierte Freitext-/JSON-Anfrage an ein beliebiges Modell. */
  async queryChat(
    providerId: string,
    params: { modelId: string; systemPrompt: string; userPrompt: string; timeoutMs?: number },
  ): Promise<string> {
    const provider = this.requireProvider(providerId);
    const apiKey = this.credentials.getProviderKey(providerId);
    const baseUrl = this.resolveBaseUrl(provider.id, provider.baseUrl);
    const timeoutMs = params.timeoutMs ?? 25000;

    if (provider.adapterType === 'GEMINI') {
      const url = joinUrl(baseUrl, `v1beta/models/${params.modelId}:generateContent?key=${apiKey}`);
      const res = await request(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: params.systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: params.userPrompt }] }],
            generationConfig: { temperature: 0.1 },
          }),
        },
        timeoutMs,
      );
      await assertOk(res);
      const json = await readJson<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>(res);
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    }

    if (provider.adapterType === 'ANTHROPIC') {
      const url = joinUrl(baseUrl, 'v1/messages');
      const res = await request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey ?? '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: params.modelId,
            system: params.systemPrompt,
            messages: [{ role: 'user', content: params.userPrompt }],
            max_tokens: 4096,
            temperature: 0.1,
          }),
        },
        timeoutMs,
      );
      await assertOk(res);
      const json = await readJson<{ content?: { text?: string }[] }>(res);
      return json.content?.[0]?.text ?? '';
    }

    // Default: OPENAI_COMPAT (OpenAI, DeepSeek, OpenRouter, Ollama)
    const url = joinUrl(baseUrl, 'v1/chat/completions');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
    const res = await request(
      url,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: params.modelId,
          messages: [
            { role: 'system', content: params.systemPrompt },
            { role: 'user', content: params.userPrompt },
          ],
          temperature: 0.1,
        }),
      },
      timeoutMs,
    );
    await assertOk(res);
    const json = await readJson<{ choices?: { message?: { content?: string | null } }[] }>(res);
    return json.choices?.[0]?.message?.content ?? '';
  }

  /** Schaetzt Token- und Kostenvolumen eines Batch-Laufs. */
  estimateCost(
    modelId: string,
    itemCount: number,
    avgInputTokens: number,
    avgOutputTokens: number,
  ): CostEstimate {
    const model = this.repository.getModel(modelId);
    if (!model) throw new Error(`Modell ${modelId} existiert nicht im Tresor.`);
    return estimateBatchCost({ model, itemCount, avgInputTokens, avgOutputTokens });
  }

  private requireProvider(providerId: string) {
    const provider = this.repository.getProvider(providerId);
    if (!provider) throw new Error(`Provider ${providerId} existiert nicht.`);
    return provider;
  }

  /**
   * Nutzerkonfigurierte Basis-URL aus credentials.json hat Vorrang vor dem
   * Default-Wert aus der ai_providers-Tabelle (z. B. lokaler Proxy/Ollama).
   */
  private resolveBaseUrl(providerId: string, fallback: string): string {
    return this.credentials.getProviderBaseUrl(providerId) ?? fallback;
  }
}

export type { IAiProviderAdapter };
