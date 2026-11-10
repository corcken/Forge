import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { CatalogPartVersion } from '@descriptio-forge/shared';
import type { GlobalVaultDb } from '../vault/global-db.js';
import type { VaultPaths } from '../vault/paths.js';
import type { RunManager } from '../vault/run-manager.js';
import { normalizeProductImage } from './image-normalizer.js';

export interface MediaDiscoverySummary {
  eatonTotal: number;
  eatonWithImage: number;
  eatonUniqueImages: number;
  abbTotal: number;
  abbWithImage: number;
  abbNormalizedFiles: number;
}

export interface RunMediaEnrichSummary {
  runId: string;
  updatedParts: number;
  withDatasheet: number;
  withImage: number;
  durationMs: number;
}

const OG_IMAGE_RE = /property=["']og:image["']\s+content=["']([^"']+)["']/iu;
const CONTENT_ID_RE = /contentId\/([a-z0-9_-]+)/iu;
const PART_TAG_RE = /<part\b([^>]+)>/giu;

function attrVal(attrs: string, name: string): string | null {
  const m = new RegExp(`${name}=["']([^"']+)["']`, 'iu').exec(attrs);
  return m?.[1]?.trim() ?? null;
}

export function buildDefaultDatasheetUrl(manufacturer: string, articleNr: string): string | null {
  const mfg = manufacturer.trim().toLowerCase();
  if (mfg === 'eaton') return `https://www.eaton.com/de/de-de/skuPage.${articleNr.trim()}.html`;
  if (mfg === 'abb') return `https://new.abb.com/products/de/${encodeURIComponent(articleNr.trim())}`;
  return null;
}

export class MediaHarvesterService {
  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly runManager: RunManager,
    private readonly paths: VaultPaths,
  ) {}

  /** Scannt die ersten 24 KB aller gecachten Eaton-HTML-Dateien nach og:image & Datenblatt-Link. */
  discoverEatonMedia(): { total: number; withImage: number; uniqueImages: number } {
    const db = this.globalDb.db;
    const rows = db
      .prepare(`SELECT article_nr, source_url, local_file_path FROM raw_documents WHERE UPPER(manufacturer) = 'EATON'`)
      .all() as { article_nr: string; source_url: string | null; local_file_path: string | null }[];

    const upsert = db.prepare(`
      INSERT INTO part_media_assets (manufacturer, article_nr, datasheet_url, remote_image_url, image_key, status, updated_at)
      VALUES (@manufacturer, @article_nr, @datasheet_url, @remote_image_url, @image_key, @status, @updated_at)
      ON CONFLICT(manufacturer, article_nr) DO UPDATE SET
        datasheet_url = excluded.datasheet_url,
        remote_image_url = COALESCE(excluded.remote_image_url, part_media_assets.remote_image_url),
        image_key = COALESCE(excluded.image_key, part_media_assets.image_key),
        status = CASE WHEN part_media_assets.status = 'NORMALIZED' THEN 'NORMALIZED' ELSE excluded.status END,
        updated_at = excluded.updated_at
    `);

    const buf = Buffer.allocUnsafe(24576);
    const uniqueKeys = new Set<string>();
    let withImage = 0;
    const now = new Date().toISOString();

    const tx = db.transaction(() => {
      for (const r of rows) {
        const datasheetUrl = r.source_url || buildDefaultDatasheetUrl('Eaton', r.article_nr);
        let remoteImageUrl: string | null = null;
        let imageKey: string | null = null;

        const htmlPath = r.local_file_path
          ? path.isAbsolute(r.local_file_path)
            ? r.local_file_path
            : path.join(this.paths.rawCacheDir, r.local_file_path)
          : null;
        if (htmlPath && fs.existsSync(htmlPath)) {
          try {
            const fd = fs.openSync(htmlPath, 'r');
            const bytes = fs.readSync(fd, buf, 0, 24576, 0);
            fs.closeSync(fd);
            const head = buf.toString('utf8', 0, bytes);
            const m = OG_IMAGE_RE.exec(head);
            if (m?.[1]) {
              remoteImageUrl = m[1].trim();
              const cid = CONTENT_ID_RE.exec(remoteImageUrl)?.[1] ?? Buffer.from(remoteImageUrl).toString('hex').slice(0, 24);
              imageKey = `eaton_${cid}`;
              withImage += 1;
              uniqueKeys.add(imageKey);
            }
          } catch {
            // Datei ueberspringen
          }
        }
        upsert.run({
          manufacturer: 'Eaton',
          article_nr: r.article_nr,
          datasheet_url: datasheetUrl,
          remote_image_url: remoteImageUrl,
          image_key: imageKey,
          status: remoteImageUrl ? 'DISCOVERED' : 'NO_IMAGE',
          updated_at: now,
        });
      }
    });
    tx();
    return { total: rows.length, withImage, uniqueImages: uniqueKeys.size };
  }

  /** Extrahiert Bilder & Zuordnungen direkt aus den lokalen ABB-EDZ-Archiven und normalisiert sie. */
  async discoverAndExtractAbbEdzMedia(
    edzRootDir = '/home/hermes_agent/stammdaten/edz/abb',
  ): Promise<{ total: number; withImage: number; normalizedFiles: number }> {
    const edzFiles: string[] = [];
    const walk = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.toLowerCase().endsWith('.edz')) edzFiles.push(full);
      }
    };
    walk(edzRootDir);

    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-abb-media-'));
    const rawAbbDir = path.join(this.paths.imagesRawDir, 'abb');
    fs.mkdirSync(rawAbbDir, { recursive: true });
    const hasExtractedPics = fs.readdirSync(rawAbbDir).length >= 4000;
    const sevenZTargets = hasExtractedPics
      ? ['items/partxml/*.part.xml']
      : ['items/partxml/*.part.xml', 'items/picture/*'];

    const partToPic = new Map<string, string>();
    for (const edzPath of edzFiles) {
      const workDir = path.join(tmpBase, path.basename(edzPath, '.edz'));
      fs.mkdirSync(workDir, { recursive: true });
      try {
        execFileSync('7z', ['e', '-y', `-o${workDir}`, edzPath, ...sevenZTargets], {
          stdio: 'ignore',
        });
        for (const f of fs.readdirSync(workDir)) {
          const full = path.join(workDir, f);
          if (f.endsWith('.part.xml')) {
            const xml = fs.readFileSync(full, 'utf8');
            for (const m of xml.matchAll(PART_TAG_RE)) {
              const attrs = m[1] ?? '';
              const picRaw = attrVal(attrs, 'P_ARTICLE_PICTUREFILE');
              const picFile = picRaw ? picRaw.split(/[\\/]/u).pop() ?? null : null;
              const partNr = attrVal(attrs, 'P_ARTICLE_PARTNR');
              const orderNr = attrVal(attrs, 'P_ARTICLE_ORDERNR');
              if (picFile) {
                for (const rawNr of [partNr, orderNr]) {
                  if (!rawNr) continue;
                  partToPic.set(rawNr, picFile);
                  const stripped = rawNr.replace(/^(?:ABB|JOK|STRIEBEL|THOMAS_BETTS)\./iu, '').trim();
                  if (stripped) partToPic.set(stripped, picFile);
                }
              }
            }
          } else if (/\.(jpg|jpeg|png|webp|gif)$/iu.test(f)) {
            const destRaw = path.join(rawAbbDir, f);
            if (!fs.existsSync(destRaw)) fs.copyFileSync(full, destRaw);
          }
        }
      } catch {
        // Beschädigtes EDZ überspringen
      } finally {
        fs.rmSync(workDir, { recursive: true, force: true });
      }
    }
    fs.rmSync(tmpBase, { recursive: true, force: true });

    let normalizedFiles = 0;
    for (const f of fs.readdirSync(rawAbbDir)) {
      const base = path.parse(f).name;
      const normPath = path.join(this.paths.imagesNormalizedDir, `abb_${base}.webp`);
      if (!fs.existsSync(normPath)) {
        try {
          await normalizeProductImage(path.join(rawAbbDir, f), normPath);
          normalizedFiles += 1;
        } catch {
          // Defektes Bild überspringen
        }
      } else {
        normalizedFiles += 1;
      }
    }

    const db = this.globalDb.db;
    const rawDocs = db
      .prepare(`SELECT article_nr FROM raw_documents WHERE UPPER(manufacturer) = 'ABB'`)
      .all() as { article_nr: string }[];
    const upsert = db.prepare(`
      INSERT INTO part_media_assets (manufacturer, article_nr, datasheet_url, remote_image_url, image_key, raw_image_path, norm_image_path, status, updated_at)
      VALUES (@manufacturer, @article_nr, @datasheet_url, @remote_image_url, @image_key, @raw_image_path, @norm_image_path, @status, @updated_at)
      ON CONFLICT(manufacturer, article_nr) DO UPDATE SET
        datasheet_url = excluded.datasheet_url,
        remote_image_url = excluded.remote_image_url,
        image_key = excluded.image_key,
        raw_image_path = excluded.raw_image_path,
        norm_image_path = excluded.norm_image_path,
        status = excluded.status,
        updated_at = excluded.updated_at
    `);

    let withImage = 0;
    const now = new Date().toISOString();
    const tx = db.transaction(() => {
      for (const r of rawDocs) {
        const picFile = partToPic.get(r.article_nr) ?? null;
        const base = picFile ? path.parse(picFile).name : null;
        const imageKey = base ? `abb_${base}` : null;
        const rawPath = picFile ? path.join(rawAbbDir, picFile) : null;
        const normPath = imageKey ? path.join(this.paths.imagesNormalizedDir, `${imageKey}.webp`) : null;
        const hasNorm = Boolean(normPath && fs.existsSync(normPath));
        if (picFile) withImage += 1;
        upsert.run({
          manufacturer: 'ABB',
          article_nr: r.article_nr,
          datasheet_url: buildDefaultDatasheetUrl('ABB', r.article_nr),
          remote_image_url: picFile ? `https://cdn.productimages.abb.com/${picFile}` : null,
          image_key: imageKey,
          raw_image_path: rawPath && fs.existsSync(rawPath) ? rawPath : null,
          norm_image_path: hasNorm ? normPath : null,
          status: hasNorm ? 'NORMALIZED' : picFile ? 'DISCOVERED' : 'NO_IMAGE',
          updated_at: now,
        });
      }
    });
    tx();
    return { total: rawDocs.length, withImage, normalizedFiles };
  }
}
