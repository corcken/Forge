import type { AiProviderTestStatus } from '@descriptio-forge/shared';
import { createAdapter } from './adapter-factory.js';
import type {
  ExtractPartFactsResult,
  IAiProviderAdapter,
} from './adapter.interface.js';
import { estimateBatchCost, type CostEstimate } from './cost-estimator.js';
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
