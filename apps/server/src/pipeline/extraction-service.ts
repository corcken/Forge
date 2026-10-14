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
 * Fuehrt die KI-Faktorenextraktion (Stufe 2) fuer ausgewaehlte Artikel eines
 * Runs aus. Nutzt ausschliesslich den globalen Rohdaten-Cache als Quelle.
 */
export class ExtractionService {
  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly parts: RunPartRepository,
    private readonly aiVault: AiVaultRepository,
    private readonly gateway: AiGateway,
  ) {}

  async extractParts(
    runId: string,
    partIds: string[],
    providerId: string,
    modelId: string,
  ): Promise<ExtractionSummary> {
    const archetypeIds = this.globalDb.listArchetypes().map((archetype) => archetype.id);
    const systemPrompt = buildExtractionSystemPrompt(archetypeIds);
    const model = this.aiVault.getModel(`${providerId}:${modelId}`);
    const results: ExtractionItemResult[] = [];

    for (const partId of partIds) {
      const staged = this.parts.getPart(runId, partId);
      if (!staged) {
        results.push({ partId, status: 'ERROR', error: 'Artikel nicht im Run gefunden.' });
        continue;
      }
      const raw = this.globalDb.findRawDocument(staged.manufacturer, staged.articleNr);
      if (!raw?.extractedMarkdown) {
        results.push({
          partId,
          status: 'ERROR',
          error: 'Keine Rohdaten gecacht (Ingestion folgt in Meilenstein 7).',
        });
        continue;
      }
      try {
        const extracted = await this.gateway.extractFacts(providerId, {
          modelId,
          systemPrompt,
          userText: raw.extractedMarkdown,
          allowedArchetypeIds: archetypeIds,
        });
        const costUsd = model
          ? (extracted.inputTokens / 1_000_000) * (model.inputPricePer1m ?? 0) +
            (extracted.outputTokens / 1_000_000) * (model.outputPricePer1m ?? 0)
          : 0;
        this.parts.saveExtraction(runId, partId, extracted.data, modelId, costUsd);
        results.push({ partId, status: 'AI_EXTRACTED', costUsd });
      } catch (error) {
        results.push({
          partId,
          status: 'ERROR',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const extracted = results.filter((result) => result.status === 'AI_EXTRACTED').length;
    return { runId, extracted, errors: results.length - extracted, results };
  }
}
