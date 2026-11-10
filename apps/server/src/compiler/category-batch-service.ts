import type { CatalogPartVersion } from '@descriptio-forge/shared';
import type { ActivityLogService } from '../pipeline/activity-log.js';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { RunManager } from '../vault/run-manager.js';
import { classifyPartCategory } from './category-classifier.js';

export interface ReclassifyOutcome {
  runId: string;
  totalUpdated: number;
  durationMs: number;
  distribution: Record<string, number>;
}

/** Dienst zum schnellen, deterministischen Nach-Klassifizieren aller Artikel eines Runs. */
export class CategoryBatchService {
  constructor(
    private readonly runManager: RunManager,
    private readonly globalDb: GlobalVaultDb,
    private readonly logger?: ActivityLogService,
  ) {}

  /**
   * Durchlaeuft alle VALIDATED-Artikel eines Runs in einer einzigen SQLite-Transaktion
   * und versieht ihr `compiled_part_json` mit der exakten 4-stufigen Kategorie.
   */
  reclassifyRun(runId: string): ReclassifyOutcome {
    const started = performance.now();
    const runDb = this.runManager.getRunDb(runId);

    const rows = runDb
      .prepare(
        `SELECT id, manufacturer, article_nr, archetype_id, compiled_part_json
         FROM staged_parts
         WHERE pipeline_status = 'VALIDATED' AND compiled_part_json IS NOT NULL`,
      )
      .all() as {
        id: string;
        manufacturer: string;
        article_nr: string;
        archetype_id: string | null;
        compiled_part_json: string;
      }[];

    const updateStmt = runDb.prepare(
      `UPDATE staged_parts
       SET compiled_part_json = @compiled_part_json,
           updated_at = @updated_at
       WHERE id = @id`,
    );

    const distribution: Record<string, number> = {};
    const now = new Date().toISOString();

    const runTx = runDb.transaction(() => {
      for (const row of rows) {
        try {
          const compiled = JSON.parse(row.compiled_part_json) as CatalogPartVersion;
          const raw = this.globalDb.findRawDocument(row.manufacturer, row.article_nr);

          const classification = classifyPartCategory({
            archetypeId: row.archetype_id,
            mainCurrentAmps: compiled.mainCurrentAmps,
            rawMarkdown: raw?.extractedMarkdown,
            partName: compiled.name,
            description: compiled.description,
          });

          compiled.categoryId = classification.categoryId;
          compiled.categorySlug = classification.categorySlug;
          compiled.categoryPath = classification.categoryPath;

          updateStmt.run({
            id: row.id,
            compiled_part_json: JSON.stringify(compiled),
            updated_at: now,
          });

          distribution[classification.categorySlug] = (distribution[classification.categorySlug] ?? 0) + 1;
        } catch {
          // Einzelne fehlerhafte Datensaetze ueberspringen
        }
      }
    });

    runTx();
    const durationMs = Math.round(performance.now() - started);
    this.logger?.ok(
      'COMPILE',
      `Kategorien fuer ${runId} zugeordnet: ${rows.length} Artikel in ${durationMs} ms aktualisiert.`,
    );

    return {
      runId,
      totalUpdated: rows.length,
      durationMs,
      distribution,
    };
  }
}
