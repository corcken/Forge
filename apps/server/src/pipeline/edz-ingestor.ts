import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { RunManager } from '../vault/run-manager.js';
import type { RunPartRepository } from '../vault/run-part-repository.js';
import type { ActivityLogService } from './activity-log.js';
import { parseEdzPartXml, type ParsedEdzPart } from './edz-parser.js';
import { sha256Hex } from './ingest-utils.js';

export interface EdzIngestSummary {
  edzFilesProcessed: number;
  edzFilesFailed: number;
  uniqueArticles: number;
  runId: string | null;
  durationMs: number;
}

/**
 * Liest EPLAN `.edz`-Archive (7-Zip) direkt aus einem Ordner, extrahiert im
 * Arbeitsspeicher nur die `*.part.xml`-Stammdaten (ohne 20 GB 3D-Makros zu entpacken),
 * erzeugt strukturierte Markdown-Datenblaetter im globalen Vault und legt die
 * Artikel im gewuenschten Run mit Status `INGESTED` an.
 */
export class EdzIngestor {
  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly runManager: RunManager,
    private readonly runParts: RunPartRepository,
    private readonly logger?: ActivityLogService,
  ) {}

  ingestEdzDirectory(dirPath: string, targetRunId?: string | null): EdzIngestSummary {
    const started = performance.now();
    if (!fs.existsSync(dirPath)) {
      throw new Error(`EDZ-Ordner existiert nicht: ${dirPath}`);
    }
    const files = fs
      .readdirSync(dirPath)
      .filter((name) => name.toLowerCase().endsWith('.edz'))
      .sort();

    this.logger?.info('INGEST', `Starte EDZ-Aufbereitung in ${dirPath} (${files.length} .edz-Archive)...`);

    const byArticle = new Map<string, ParsedEdzPart>();
    let failedFiles = 0;

    for (const fileName of files) {
      const fullPath = path.join(dirPath, fileName);
      const res = spawnSync('7z', ['x', '-so', '-r', fullPath, '*.part.xml'], {
        maxBuffer: 100 * 1024 * 1024,
      });
      if (res.status !== 0 || !res.stdout) {
        failedFiles += 1;
        continue;
      }
      const xml = res.stdout.toString('utf8');
      if (!xml.includes('<part')) continue;
      const parts = parseEdzPartXml(xml, fileName);
      for (const part of parts) {
        const key = `${part.manufacturer}:${part.articleNr}`;
        const existing = byArticle.get(key);
        if (!existing || part.markdown.length > existing.markdown.length) {
          byArticle.set(key, part);
        }
      }
    }

    const allParts = Array.from(byArticle.values());
    const now = new Date().toISOString();
    const insertRaw = this.globalDb.db.prepare(
      `INSERT OR REPLACE INTO raw_documents
         (id, manufacturer, article_nr, source_type, source_url,
          local_file_path, extracted_markdown, file_hash_sha256, created_at)
       VALUES (@id, @manufacturer, @articleNr, 'HTML_ETIM', @sourceUrl,
               @localFilePath, @extractedMarkdown, @fileHash, @createdAt)`,
    );

    const rawTx = this.globalDb.db.transaction((items: ParsedEdzPart[]) => {
      for (const item of items) {
        const id = sha256Hex(`${item.manufacturer}|${item.articleNr}|HTML_ETIM`);
        insertRaw.run({
          id,
          manufacturer: item.manufacturer,
          articleNr: item.articleNr,
          sourceUrl: item.externalUrl,
          localFilePath: `edz:${item.articleNr}.part.xml`,
          extractedMarkdown: item.markdown,
          fileHash: sha256Hex(item.markdown),
          createdAt: now,
        });
      }
    });
    rawTx(allParts);

    const resolvedRunId = targetRunId ?? this.runManager.getActiveRunId();
    if (resolvedRunId) {
      this.runManager.assertWritable(resolvedRunId);
      const runDb = this.runManager.getRunDb(resolvedRunId);
      const upsertStaged = runDb.prepare(
        `INSERT INTO staged_parts
           (id, manufacturer, article_nr, pipeline_status, updated_at)
         VALUES (@id, @manufacturer, @articleNr, 'INGESTED', @now)
         ON CONFLICT(id) DO UPDATE SET
           pipeline_status = CASE
             WHEN staged_parts.pipeline_status = 'PENDING_INGEST' THEN 'INGESTED'
             ELSE staged_parts.pipeline_status
           END,
           updated_at = @now`,
      );
      const stageTx = runDb.transaction((items: ParsedEdzPart[]) => {
        for (const item of items) {
          upsertStaged.run({
            id: `${item.manufacturer}:${item.articleNr}`,
            manufacturer: item.manufacturer,
            articleNr: item.articleNr,
            now,
          });
        }
      });
      stageTx(allParts);
      const totals = this.runParts.countParts(resolvedRunId);
      this.runManager.updateCounters(resolvedRunId, totals.total, totals.validated);
    }

    const durationMs = Math.round(performance.now() - started);
    this.logger?.ok(
      'INGEST',
      `EDZ-Import abgeschlossen: ${files.length} Archive -> ${allParts.length} eindeutige ABB-Artikel gecacht (${durationMs} ms)`,
    );

    return {
      edzFilesProcessed: files.length,
      edzFilesFailed: failedFiles,
      uniqueArticles: allParts.length,
      runId: resolvedRunId,
      durationMs,
    };
  }
}
