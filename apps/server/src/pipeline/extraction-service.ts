import { buildExtractionSystemPrompt } from '../ai-gateway/extraction-prompt.js';
import type { AiGateway } from '../ai-gateway/gateway.js';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { AiVaultRepository } from '../vault/ai-vault-repository.js';
import type { RunPartRepository } from '../vault/run-part-repository.js';

export interface ExtractionItemResult {
  partId: string;
  status: 'AI_EXTRACTED' | 'ERROR';
  error?: string;
  costUsd?: number;
}

export interface ExtractionSummary {
  runId: string;
  extracted: number;
  errors: number;
  results: ExtractionItemResult[];
}

/**
 * Fuehrt die KI-Faktorenextraktion (Stufe 2) fuer Artikel eines Runs aus.
 * Quelle ist ausschliesslich der globale Rohdaten-Cache.
 */
export class ExtractionService {
  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly parts: RunPartRepository,
    private readonly aiVault: AiVaultRepository,
    private readonly gateway: AiGateway,
  ) {}

  private archetypeIds(): string[] {
    return this.globalDb.listArchetypes().map((archetype) => archetype.id);
  }

  /** Extrahiert die Fakten eines einzelnen Artikels. */
  async extractOne(
    runId: string,
    partId: string,
    providerId: string,
    modelId: string,
  ): Promise<ExtractionItemResult> {
    const staged = this.parts.getPart(runId, partId);
    if (!staged) return { partId, status: 'ERROR', error: 'Artikel nicht im Run gefunden.' };

    const raw = this.globalDb.findRawDocument(staged.manufacturer, staged.articleNr);
    if (!raw?.extractedMarkdown) {
      return {
        partId,
        status: 'ERROR',
        error: 'Keine Rohdaten gecacht (Ingestion folgt in Meilenstein 7).',
      };
    }

    const archetypeIds = this.archetypeIds();
    try {
      const extracted = await this.gateway.extractFacts(providerId, {
        modelId,
        systemPrompt: buildExtractionSystemPrompt(archetypeIds),
        userText: raw.extractedMarkdown,
        allowedArchetypeIds: archetypeIds,
      });
      const model = this.aiVault.getModel(`${providerId}:${modelId}`);
      const costUsd = model
        ? (extracted.inputTokens / 1_000_000) * (model.inputPricePer1m ?? 0) +
          (extracted.outputTokens / 1_000_000) * (model.outputPricePer1m ?? 0)
        : 0;
      this.parts.saveExtraction(runId, partId, extracted.data, modelId, costUsd);
      return { partId, status: 'AI_EXTRACTED', costUsd };
    } catch (error) {
      return {
        partId,
        status: 'ERROR',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Extrahiert mehrere Artikel sequenziell (Synchron-Variante ohne Queue). */
  async extractParts(
    runId: string,
    partIds: string[],
    providerId: string,
    modelId: string,
  ): Promise<ExtractionSummary> {
    const results: ExtractionItemResult[] = [];
    for (const partId of partIds) {
      results.push(await this.extractOne(runId, partId, providerId, modelId));
    }
    const extracted = results.filter((result) => result.status === 'AI_EXTRACTED').length;
    return { runId, extracted, errors: results.length - extracted, results };
  }
}
