import fs from 'node:fs';
import path from 'node:path';
import type { RawSourceType } from '@descriptio-forge/shared';
import { request } from '../ai-gateway/http-client.js';
import type { RawDocumentRepository } from '../vault/raw-repository.js';
import type { VaultPaths } from '../vault/paths.js';
import type { ActivityLogService } from './activity-log.js';
import {
  guessExtension,
  htmlToText,
  parseIngestFilename,
  sha256Hex,
  TEXT_EXTENSIONS,
  validateExtractedText,
} from './ingest-utils.js';

export interface IngestTarget {
  manufacturer: string;
  articleNr: string;
  sourceType: RawSourceType;
}

export interface IngestResult {
  id: string;
  localFilePath: string;
  hasMarkdown: boolean;
}

/**
 * Rohdaten-Ingestor (Stufe 1): liest lokale Dateien, Ordner oder URLs in den
 * globalen Cache (`raw_documents` + `~/.descriptio-forge/raw-cache/`).
 * Inhalte werden niemals doppelt gespeichert (Hash-basierte ID).
 */
export class RawIngestor {
  private throttleChain: Promise<void> = Promise.resolve();
  private downloadCount = 0;

  constructor(
    private readonly paths: VaultPaths,
    private readonly repo: RawDocumentRepository,
    private readonly logger?: ActivityLogService,
  ) {}

  /** Globaler Taktgeber fuer HTTP-Downloads (~1 Request pro 1,0–1,5s + kurze Pause alle 200 Abrufe). */
  private acquireDownloadSlot(): Promise<void> {
    const next = this.throttleChain.then(async () => {
      this.downloadCount += 1;
      const baseDelay = 900 + Math.floor(Math.random() * 600);
      const batchPause = this.downloadCount % 200 === 0 ? 8000 : 0;
      await new Promise((resolve) => setTimeout(resolve, baseDelay + batchPause));
    });
    this.throttleChain = next.catch(() => {});
    return next;
  }

  private idFor(target: IngestTarget): string {
    return sha256Hex(`${target.manufacturer}|${target.articleNr}|${target.sourceType}`);
  }

  private writeRaw(id: string, extension: string, content: string | Buffer): string {
    const fileName = `${id}.${extension}`;
    fs.writeFileSync(path.join(this.paths.rawCacheDir, fileName), content);
    return fileName;
  }

  /** Speichert bereits vorliegenden Text/HTML-Inhalt im Cache (nach Plausibilitaetscheck). */
  ingestText(
    target: IngestTarget,
    text: string,
    options: { sourceUrl?: string | null; extension?: string } = {},
  ): IngestResult {
    const extension = options.extension ?? 'html';
    const markdown = extension === 'html' || extension === 'htm' ? htmlToText(text) : text;
    const check = validateExtractedText(markdown);
    if (!check.valid) {
      const msg = `${target.manufacturer}:${target.articleNr} abgelehnt – ${check.reason}`;
      this.logger?.error('INGEST', msg);
      throw new Error(msg);
    }

    const id = this.idFor(target);
    const fileName = this.writeRaw(id, extension, text);
    this.repo.upsert({
      id,
      ...target,
      sourceUrl: options.sourceUrl ?? null,
      localFilePath: fileName,
      extractedMarkdown: markdown,
      fileHashSha256: sha256Hex(text),
    });
    this.logger?.ok(
      'INGEST',
      `${target.manufacturer}:${target.articleNr} gecacht (${markdown.length} Zeichen)`,
    );
    return { id, localFilePath: fileName, hasMarkdown: markdown.trim().length > 0 };
  }

  /** Liest eine lokale Datei (HTML/PDF/etc.) in den Cache. */
  ingestFile(target: IngestTarget, filePath: string): IngestResult {
    const buffer = fs.readFileSync(filePath);
    const extension = guessExtension(filePath);
    const id = this.idFor(target);
    const fileName = this.writeRaw(id, extension, buffer);
    const isText = TEXT_EXTENSIONS.has(extension);
    const rawText = isText ? buffer.toString('utf8') : null;
    const markdown =
      rawText === null ? null : extension === 'html' || extension === 'htm' ? htmlToText(rawText) : rawText;
    this.repo.upsert({
      id,
      ...target,
      sourceUrl: null,
      localFilePath: fileName,
      extractedMarkdown: markdown,
      fileHashSha256: sha256Hex(buffer),
    });
    this.logger?.ok('INGEST', `Datei ${target.manufacturer}:${target.articleNr} eingelesen`);
    return { id, localFilePath: fileName, hasMarkdown: markdown !== null && markdown.trim().length > 0 };
  }

  /** Laedt eine URL (JS-freie HTTP-Quelle) herunter, prueft sie und cacht sie. */
  async ingestUrl(target: IngestTarget, url: string): Promise<IngestResult> {
    await this.acquireDownloadSlot();
    const res = await request(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      },
      15000,
    );
    if (!res.ok) {
      const msg = `${target.manufacturer}:${target.articleNr} -> HTTP ${res.status} (${url})`;
      this.logger?.error('INGEST', msg);
      throw new Error(`HTTP ${res.status} beim Laden von ${url}`);
    }
    const html = await res.text();
    return this.ingestText(target, html, { sourceUrl: url, extension: 'html' });
  }

  /** Liest einen kompletten Ordner rekursiv ein (Dateiname: `Hersteller__Artikel.ext`). */
  ingestDirectory(dir: string, sourceType: RawSourceType): { ingested: number; results: IngestResult[] } {
    const results: IngestResult[] = [];
    const walk = (current: string): void => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.isFile()) {
          const parsed = parseIngestFilename(full);
          results.push(
            this.ingestFile(
              { manufacturer: parsed.manufacturer, articleNr: parsed.articleNr, sourceType },
              full,
            ),
          );
        }
      }
    };
    walk(dir);
    return { ingested: results.length, results };
  }
}
