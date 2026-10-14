import fs from 'node:fs';
import path from 'node:path';
import type { RawSourceType } from '@descriptio-forge/shared';
import { request } from '../ai-gateway/http-client.js';
import type { RawDocumentRepository } from '../vault/raw-repository.js';
import type { VaultPaths } from '../vault/paths.js';
import {
  guessExtension,
  htmlToText,
  parseIngestFilename,
  sha256Hex,
  TEXT_EXTENSIONS,
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
  constructor(
    private readonly paths: VaultPaths,
    private readonly repo: RawDocumentRepository,
  ) {}

  private idFor(target: IngestTarget): string {
    return sha256Hex(`${target.manufacturer}|${target.articleNr}|${target.sourceType}`);
  }

  private writeRaw(id: string, extension: string, content: string | Buffer): string {
    const fileName = `${id}.${extension}`;
    fs.writeFileSync(path.join(this.paths.rawCacheDir, fileName), content);
    return fileName;
  }

  /** Speichert bereits vorliegenden Text/HTML-Inhalt im Cache. */
  ingestText(
    target: IngestTarget,
    text: string,
    options: { sourceUrl?: string | null; extension?: string } = {},
  ): IngestResult {
    const extension = options.extension ?? 'html';
    const id = this.idFor(target);
    const fileName = this.writeRaw(id, extension, text);
    const markdown = extension === 'html' || extension === 'htm' ? htmlToText(text) : text;
    this.repo.upsert({
      id,
      ...target,
      sourceUrl: options.sourceUrl ?? null,
      localFilePath: fileName,
      extractedMarkdown: markdown,
      fileHashSha256: sha256Hex(text),
    });
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
    return { id, localFilePath: fileName, hasMarkdown: markdown !== null && markdown.trim().length > 0 };
  }

  /** Laedt eine URL (JS-freie HTTP-Quelle) herunter und cacht sie. */
  async ingestUrl(target: IngestTarget, url: string): Promise<IngestResult> {
    const res = await request(url, { method: 'GET' }, 15000);
    if (!res.ok) throw new Error(`HTTP ${res.status} beim Laden von ${url}`);
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
