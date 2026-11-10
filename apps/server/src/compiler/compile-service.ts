import { emptyAiExtraction, type SeriesOverride } from '@descriptio-forge/shared';
import type { ActivityLogService } from '../pipeline/activity-log.js';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { RunManager } from '../vault/run-manager.js';
import type { RunPartRepository } from '../vault/run-part-repository.js';
import type { RunSeriesRepository } from '../vault/run-series-repository.js';
import type { StagedPart } from '../vault/run-types.js';
import { inferArchetypeFromType } from '../vault/seeds/archetype-seeds.js';
import type { CompileBatchSummary, CompileSummary } from './compiler-types.js';
import { compilePart } from './part-compiler.js';

/** Verbindet den reinen Compiler mit der aktiven Run-Datenbank. */
export class CompileService {
  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly runManager: RunManager,
    private readonly parts: RunPartRepository,
    private readonly series: RunSeriesRepository,
    private readonly logger?: ActivityLogService,
  ) {}

  /** Kompiliert genau einen Artikel und persistiert das Ergebnis im Run. */
  compilePart(runId: string, partId: string): CompileSummary {
    this.runManager.assertWritable(runId);
    const staged = this.parts.getPart(runId, partId);
    if (!staged) throw new Error(`Artikel ${partId} existiert nicht im Run ${runId}.`);

    const facts = staged.aiRawJson ?? emptyAiExtraction();
    const manualArch =
      typeof staged.manualOverrides.archetypeId === 'string' && staged.manualOverrides.archetypeId
        ? staged.manualOverrides.archetypeId
        : null;
    if (!staged.aiRawJson && !manualArch && !staged.archetypeId) {
      const hasRaw = Boolean(this.globalDb.findRawDocument(staged.manufacturer, staged.articleNr)?.extractedMarkdown);
      const msg = hasRaw
        ? 'Noch nicht mit KI extrahiert (aiRawJson fehlt).'
        : 'Kein Datenblatt im Cache (Download / HTTP 404 fehlgeschlagen).';
      return this.persistError(runId, partId, msg);
    }
    const inferredArch = inferArchetypeFromType(facts.type, facts.name);
    const candidateArch = manualArch || facts.archetypeId || staged.archetypeId;
    const archetypeId =
      !manualArch && candidateArch === 'MECHANICAL_ACCESSORY' && inferredArch && inferredArch !== 'MECHANICAL_ACCESSORY'
        ? inferredArch
        : candidateArch || inferredArch;
    if (!archetypeId) {
      this.logger?.warn('COMPILE', `${partId}: Kein Archetyp zugewiesen (${facts.type ?? 'unbekannt'})`);
      return this.persistError(runId, partId, 'Kein Archetyp zugewiesen (archetypeId fehlt).');
    }
    const archetype = this.globalDb.getArchetype(archetypeId);
    if (!archetype) {
      return this.persistError(runId, partId, `Archetyp ${archetypeId} nicht gefunden.`);
    }

    const series = this.resolveSeries(runId, staged, facts);
    const started = performance.now();
    const result = compilePart({
      partId,
      manufacturer: staged.manufacturer,
      articleNr: staged.articleNr,
      facts,
      archetype,
      series,
      manualOverrides: staged.manualOverrides,
    });
    const durationMs = roundMs(performance.now() - started);

    this.parts.saveCompiledResult(runId, partId, {
      compiledPart: result.part,
      fieldOrigins: result.fieldOrigins,
      validationErrors: result.validationErrors,
      qualityTier: result.qualityTier,
      completenessPct: result.completenessPct,
      pipelineStatus: result.status,
      archetypeId: archetype.id,
    });

    const groups = result.part?.functionGroups ?? [];
    return {
      runId,
      partId,
      status: result.status,
      qualityTier: result.qualityTier,
      completenessPct: result.completenessPct,
      validationErrors: result.validationErrors,
      durationMs,
      groupCount: groups.length,
      pinCount: groups.reduce((sum, group) => sum + group.pins.length, 0),
      archetypeId: archetype.id,
    };
  }

  /** Kompiliert alle (oder die uebergebenen) bereits extrahierten Artikel eines Runs. */
  compileParts(runId: string, partIds?: string[]): CompileBatchSummary {
    this.runManager.assertWritable(runId);
    const ids = partIds ?? this.parts.listParts(runId).map((part) => part.id);
    const results: CompileSummary[] = [];
    let skipped = 0;
    for (const id of ids) {
      const staged = this.parts.getPart(runId, id);
      if (!staged) continue;
      if (!staged.aiRawJson && Object.keys(staged.manualOverrides).length === 0) {
        skipped += 1;
        continue;
      }
      try {
        results.push(this.compilePart(runId, id));
      } catch (error) {
        results.push(this.persistError(runId, id, error instanceof Error ? error.message : String(error)));
      }
    }
    const compiled = results.filter((result) => result.status === 'VALIDATED').length;
    const errors = results.length - compiled;
    const totals = this.parts.countParts(runId);
    this.runManager.updateCounters(runId, totals.total, totals.validated);
    const totalDurationMs = roundMs(results.reduce((sum, r) => sum + r.durationMs, 0));
    this.logger?.ok(
      'COMPILE',
      `Batch kompiliert: ${compiled} VALIDATED, ${errors} ERROR, ${skipped} ohne KI-Fakten uebersprungen (${totalDurationMs} ms)`,
    );
    return {
      compiled,
      errors,
      totalDurationMs,
      results,
    };
  }

  private resolveSeries(
    runId: string,
    staged: StagedPart,
    facts: ReturnType<typeof emptyAiExtraction>,
  ): SeriesOverride | null {
    if (staged.seriesId) {
      const byId = this.series.getSeries(runId, staged.seriesId);
      if (byId) return byId;
    }
    if (!facts.seriesName) return null;
    return this.series.findSeriesByName(runId, staged.manufacturer, facts.seriesName);
  }

  private persistError(runId: string, partId: string, message: string): CompileSummary {
    this.parts.saveCompiledResult(runId, partId, {
      compiledPart: null,
      fieldOrigins: {},
      validationErrors: [message],
      qualityTier: 'BRONZE',
      completenessPct: 0,
      pipelineStatus: 'ERROR',
      archetypeId: '',
    });
    return {
      runId,
      partId,
      status: 'ERROR',
      qualityTier: 'BRONZE',
      completenessPct: 0,
      validationErrors: [message],
      durationMs: 0,
      groupCount: 0,
      pinCount: 0,
      archetypeId: '',
    };
  }
}

function roundMs(value: number): number {
  return Math.round(value * 1000) / 1000;
}
