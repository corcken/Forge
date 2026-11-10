import { buildExtractionSystemPrompt } from '../ai-gateway/extraction-prompt.js';
import type { AiGateway } from '../ai-gateway/gateway.js';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { AiVaultRepository } from '../vault/ai-vault-repository.js';
import type { RunPartRepository } from '../vault/run-part-repository.js';
import { resolveCanonicalArchetypeId } from '../vault/seeds/archetype-seeds.js';
import type { ActivityLogService } from './activity-log.js';
import { stripWebBoilerplate, validateExtractedText } from './ingest-utils.js';

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
 * Quelle ist ausschliesslich der globale Rohdaten-Cache (mit Vorab-Schutzpruefung).
 */
export class ExtractionService {
  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly parts: RunPartRepository,
    private readonly aiVault: AiVaultRepository,
    private readonly gateway: AiGateway,
    private readonly logger?: ActivityLogService,
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
    if (!staged) {
      this.logger?.error('AI', `${partId}: Nicht im Run gefunden.`);
      return { partId, status: 'ERROR', error: 'Artikel nicht im Run gefunden.' };
    }

    const raw = this.globalDb.findRawDocument(staged.manufacturer, staged.articleNr);
    if (!raw?.extractedMarkdown) {
      const msg = `${partId}: Keine Rohdaten gecacht (KI-Aufruf uebersprungen).`;
      this.logger?.warn('AI', msg);
      return { partId, status: 'ERROR', error: msg };
    }

    const cleanText = stripWebBoilerplate(raw.extractedMarkdown);
    const check = validateExtractedText(cleanText);
    if (!check.valid) {
      const msg = `${partId}: Rohdaten ungueltig (${check.reason}) – KI-Aufruf blockiert!`;
      this.logger?.error('AI', msg);
      return { partId, status: 'ERROR', error: msg };
    }

    const allArchetypeIds = this.archetypeIds();
    const validSet = new Set(allArchetypeIds);
    try {
      const extracted = await this.gateway.extractFacts(providerId, {
        modelId,
        systemPrompt: buildExtractionSystemPrompt(allArchetypeIds),
        userText: cleanText,
        allowedArchetypeIds: allArchetypeIds,
      });
      const resolvedArchetypeId = resolveCanonicalArchetypeId(
        extracted.data.archetypeId,
        validSet,
      );
      const normalizedData = { ...extracted.data, archetypeId: resolvedArchetypeId };
      const model = this.aiVault.getModel(`${providerId}:${modelId}`);
      const costUsd = model
        ? (extracted.inputTokens / 1_000_000) * (model.inputPricePer1m ?? 0) +
          (extracted.outputTokens / 1_000_000) * (model.outputPricePer1m ?? 0)
        : 0;
      this.parts.saveExtraction(runId, partId, normalizedData, modelId, costUsd);
      this.logger?.ok(
        'AI',
        `${partId} -> ${normalizedData.name ?? '–'} [${normalizedData.archetypeId ?? 'kein Archetyp'}] (${normalizedData.width ?? '?'}x${normalizedData.height ?? '?'}x${normalizedData.depth ?? '?'}mm)`,
      );
      return { partId, status: 'AI_EXTRACTED', costUsd };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger?.error('AI', `${partId} fehlgeschlagen: ${errMsg}`);
      return { partId, status: 'ERROR', error: errMsg };
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
