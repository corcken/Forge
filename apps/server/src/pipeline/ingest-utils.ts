import { createHash } from 'node:crypto';

/** SHA-256 als Hex-String (fuer Dokument-Hashes und importHash). */
export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Wandelt HTML grob in lesbaren Klartext fuer die LLM-Extraktion um. */
export function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/giu, ' ')
    .replace(/<style[\s\S]*?<\/style>/giu, ' ');
  const withBreaks = withoutScripts
    .replace(/<\/(p|div|tr|li|h[1-6])>/giu, '\n')
    .replace(/<br\s*\/?>/giu, '\n')
    .replace(/<[^>]+>/gu, ' ');
  const decoded = withBreaks
    .replace(/&nbsp;/gu, ' ')
    .replace(/&amp;/gu, '&')
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'");
  return decoded
    .replace(/[ \t]+/gu, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

/** Ermittelt die Dateiendung aus Pfad oder URL (Default: html). */
export function guessExtension(filePathOrUrl: string): string {
  const clean = filePathOrUrl.split('?')[0] ?? filePathOrUrl;
  const match = /\.([a-z0-9]+)$/iu.exec(clean);
  return match?.[1] ? match[1].toLowerCase() : 'html';
}

/** Dateiendungen, deren Inhalt als Text/Markdown extrahierbar ist. */
export const TEXT_EXTENSIONS = new Set(['html', 'htm', 'txt', 'md', 'csv', 'json']);

/** Leitet Hersteller + Artikelnummer aus einem Dateinamen `Hersteller__Artikel.ext` ab. */
export function parseIngestFilename(filePath: string): { manufacturer: string; articleNr: string } {
  const base = filePath.replace(/\.[a-z0-9]+$/iu, '').split(/[\\/]/u).pop() ?? filePath;
  const parts = base.split('__');
  if (parts.length >= 2) {
    return { manufacturer: parts[0]!.trim(), articleNr: parts[1]!.trim() };
  }
  return { manufacturer: 'UNBEKANNT', articleNr: base.trim() };
}
