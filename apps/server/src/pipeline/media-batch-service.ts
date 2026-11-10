import fs from 'node:fs';
import path from 'node:path';
import type { CatalogPartVersion } from '@descriptio-forge/shared';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { VaultPaths } from '../vault/paths.js';
import type { RunManager } from '../vault/run-manager.js';
import { normalizeProductImage } from './image-normalizer.js';
import { buildDefaultDatasheetUrl, type RunMediaEnrichSummary } from './media-harvester.js';

export interface EatonDownloadBatchResult {
  attemptedUnique: number;
  normalizedUnique: number;
  noImageUnique: number;
  failedUnique: number;
  remainingUnique: number;
  durationMs: number;
}

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
};

class NotFoundImageError extends Error {
  constructor() {
    super('Unable to find image');
  }
}

export class MediaBatchService {
  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly runManager: RunManager,
    private readonly paths: VaultPaths,
  ) {}

  /**
   * Laedt alle deduplizierten Produktbilder (nach `image_key`) herunter,
   * speichert das Original unter `images/raw/` und erzeugt das
   * 600x600 WebP unter `images/normalized/`.
   * Erkennt Eatons Pseudo-403 ("Unable to find image", text/plain) und bereinigt tote Bild-Links.
   */
  async downloadAndNormalizePendingImages(
    limit = 10_000,
    concurrency = 12,
  ): Promise<EatonDownloadBatchResult> {
    const started = performance.now();
    const db = this.globalDb.db;
    const rawEatonDir = path.join(this.paths.imagesRawDir, 'eaton');
    const rawAbbDir = path.join(this.paths.imagesRawDir, 'abb');
    fs.mkdirSync(rawEatonDir, { recursive: true });
    fs.mkdirSync(rawAbbDir, { recursive: true });
    fs.mkdirSync(this.paths.imagesNormalizedDir, { recursive: true });

    const pending = db
      .prepare(
        `SELECT manufacturer, image_key, MIN(remote_image_url) AS remote_image_url
         FROM part_media_assets
         WHERE status IN ('DISCOVERED', 'ERROR')
           AND image_key IS NOT NULL
           AND remote_image_url IS NOT NULL
         GROUP BY manufacturer, image_key
         LIMIT ?`,
      )
      .all(limit) as { manufacturer: string; image_key: string; remote_image_url: string }[];

    const updateByKey = db.prepare(`
      UPDATE part_media_assets
      SET raw_image_path = @raw_image_path,
          norm_image_path = @norm_image_path,
          status = @status,
          updated_at = @updated_at
      WHERE image_key = @image_key
    `);

    const markNoImageByKey = db.prepare(`
      UPDATE part_media_assets
      SET remote_image_url = NULL,
          raw_image_path = NULL,
          norm_image_path = NULL,
          status = 'NO_IMAGE',
          updated_at = @updated_at
      WHERE image_key = @image_key
    `);

    let normalizedUnique = 0;
    let noImageUnique = 0;
    let failedUnique = 0;
    let idx = 0;

    const fetchWithRetry = async (url: string): Promise<Buffer> => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await new Promise((r) => setTimeout(r, 250));
        const resp = await fetch(url, {
          headers: BROWSER_HEADERS,
          signal: AbortSignal.timeout(15_000),
        });
        const ct = (resp.headers.get('content-type') ?? '').toLowerCase();
        if (resp.status === 403 && ct.includes('text/plain')) {
          await resp.body?.cancel();
          throw new NotFoundImageError();
        }
        if (resp.status === 404) {
          await resp.body?.cancel();
          throw new NotFoundImageError();
        }
        if (resp.status === 403 || resp.status === 429) {
          await resp.body?.cancel();
          if (attempt === 3) throw new Error(`WAF HTTP ${resp.status}`);
          await new Promise((r) => setTimeout(r, 20_000 * attempt));
          continue;
        }
        if (!resp.ok) {
          await resp.body?.cancel();
          throw new Error(`HTTP ${resp.status}`);
        }
        return Buffer.from(await resp.arrayBuffer());
      }
      throw new Error('Max retries');
    };

    const worker = async (): Promise<void> => {
      while (idx < pending.length) {
        const current = pending[idx++];
        if (!current) break;
        const subDir = current.manufacturer.toUpperCase() === 'ABB' ? rawAbbDir : rawEatonDir;
        const rawPath = path.join(subDir, `${current.image_key}.jpg`);
        const normPath = path.join(this.paths.imagesNormalizedDir, `${current.image_key}.webp`);
        try {
          if (!fs.existsSync(normPath)) {
            const buf = fs.existsSync(rawPath)
              ? fs.readFileSync(rawPath)
              : await fetchWithRetry(current.remote_image_url);
            if (!fs.existsSync(rawPath)) fs.writeFileSync(rawPath, buf);
            await normalizeProductImage(buf, normPath);
          }
          updateByKey.run({
            image_key: current.image_key,
            raw_image_path: fs.existsSync(rawPath) ? rawPath : null,
            norm_image_path: normPath,
            status: 'NORMALIZED',
            updated_at: new Date().toISOString(),
          });
          normalizedUnique += 1;
        } catch (err) {
          if (err instanceof NotFoundImageError) {
            markNoImageByKey.run({
              image_key: current.image_key,
              updated_at: new Date().toISOString(),
            });
            noImageUnique += 1;
          } else {
            updateByKey.run({
              image_key: current.image_key,
              raw_image_path: null,
              norm_image_path: null,
              status: 'ERROR',
              updated_at: new Date().toISOString(),
            });
            failedUnique += 1;
          }
        }
        const done = normalizedUnique + noImageUnique + failedUnique;
        if (done % 250 === 0 || done === pending.length) {
          console.log(
            `   [Bild-Harvester] ${done} / ${pending.length} geprueft (${normalizedUnique} gespeichert & normalisiert, ${noImageUnique} ohne Herstellerbild, ${failedUnique} Fehler)...`,
          );
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, () => worker()));

    const remRow = db
      .prepare(
        `SELECT COUNT(DISTINCT image_key) AS rem
         FROM part_media_assets
         WHERE status = 'DISCOVERED' AND image_key IS NOT NULL`,
      )
      .get() as { rem: number };

    return {
      attemptedUnique: pending.length,
      normalizedUnique,
      noImageUnique,
      failedUnique,
      remainingUnique: remRow.rem,
      durationMs: Math.round(performance.now() - started),
    };
  }

  /** Reichert alle VALIDATED-Artikel eines Runs mit `datasheetLink` und `imageLink` an. */
  applyMediaToRun(runId: string): RunMediaEnrichSummary {
    const started = performance.now();
    const db = this.globalDb.db;
    const assets = db
      .prepare(`SELECT manufacturer, article_nr, datasheet_url, remote_image_url FROM part_media_assets`)
      .all() as {
        manufacturer: string;
        article_nr: string;
        datasheet_url: string | null;
        remote_image_url: string | null;
      }[];

    const assetMap = new Map<string, { datasheetUrl: string | null; remoteImageUrl: string | null }>();
    for (const a of assets) {
      assetMap.set(`${a.manufacturer.toUpperCase()}:::${a.article_nr}`, {
        datasheetUrl: a.datasheet_url,
        remoteImageUrl: a.remote_image_url,
      });
    }

    const runDb = this.runManager.getRunDb(runId);
    const rows = runDb
      .prepare(
        `SELECT id, manufacturer, article_nr, compiled_part_json, field_origins_json
         FROM staged_parts
         WHERE pipeline_status = 'VALIDATED' AND compiled_part_json IS NOT NULL`,
      )
      .all() as {
        id: string;
        manufacturer: string;
        article_nr: string;
        compiled_part_json: string;
        field_origins_json: string | null;
      }[];

    const updateStmt = runDb.prepare(`
      UPDATE staged_parts
      SET compiled_part_json = @compiled_part_json,
          field_origins_json = @field_origins_json,
          updated_at = @updated_at
      WHERE id = @id
    `);

    let withDatasheet = 0;
    let withImage = 0;
    const now = new Date().toISOString();

    const tx = runDb.transaction(() => {
      for (const row of rows) {
        const compiled = JSON.parse(row.compiled_part_json) as CatalogPartVersion;
        const origins = row.field_origins_json
          ? (JSON.parse(row.field_origins_json) as Record<string, string>)
          : { ...(compiled.fieldOrigins ?? {}) };

        const found = assetMap.get(`${row.manufacturer.toUpperCase()}:::${row.article_nr}`);
        const dsUrl = found?.datasheetUrl ?? buildDefaultDatasheetUrl(row.manufacturer, row.article_nr);
        const imgUrl = found?.remoteImageUrl ?? null;

        compiled.datasheetLink = dsUrl;
        compiled.imageLink = imgUrl;
        origins.datasheetLink = dsUrl ? 'AI' : 'NULL';
        origins.imageLink = imgUrl ? 'AI' : 'NULL';
        compiled.fieldOrigins = origins as CatalogPartVersion['fieldOrigins'];

        if (dsUrl) withDatasheet += 1;
        if (imgUrl) withImage += 1;

        updateStmt.run({
          id: row.id,
          compiled_part_json: JSON.stringify(compiled),
          field_origins_json: JSON.stringify(origins),
          updated_at: now,
        });
      }
    });
    tx();

    return {
      runId,
      updatedParts: rows.length,
      withDatasheet,
      withImage,
      durationMs: Math.round(performance.now() - started),
    };
  }
}
