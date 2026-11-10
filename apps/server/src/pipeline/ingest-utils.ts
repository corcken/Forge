import { createHash } from 'node:crypto';

/** SHA-256 als Hex-String (fuer Dokument-Hashes und importHash). */
export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

/** Entfernt bekannte Website-Header/Footer-Boilerplate (z. B. Eaton-Modals). */
export function stripWebBoilerplate(text: string): string {
  return text
    .replace(
      /Dokument herunterladen \(\s*\) von 20[\s\S]*?(?=Startseite\s+Produkte|Allgemeine Spezifikation|Produktspezifikationen)/iu,
      '',
    )
    .replace(
      /Seriennummer ist bekanntermaßen verdächtig[\s\S]*?nicht erkannt und ist ungültig\.\s*Weiter/iu,
      '',
    )
    .replace(
      /Geben Sie Ihre Stadt, Ihr Bundesland oder Ihre Postleitzahl ein[\s\S]*$/iu,
      '',
    )
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

/** Wandelt HTML grob in lesbaren Klartext fuer die LLM-Extraktion um. */
export function htmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/giu, ' ')
    .replace(/<style[\s\S]*?<\/style>/giu, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/giu, ' ');
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
    .replace(/&#39;/gu, "'")
    .replace(/&#43;/gu, '+')
    .replace(/&#61;/gu, '=');
  const raw = decoded
    .replace(/[ \t]+/gu, ' ')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
  return stripWebBoilerplate(raw);
}

const SPEC_MARKER_REGEX =
  /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|kg|g|V|A|W|Nm|mm²|mm2)\b|Allgemeine Spezifikation|Produktspezifikation|Bemessungs|Produkthöhe|Produktbreite|Technical data|Specifications/iu;

const BLOCK_PAGE_REGEX =
  /access denied|403 forbidden|rate limit exceeded|too many requests|captcha|cloudflare|bot protection/iu;

/**
 * Prueft vor dem Caching und vor dem KI-Aufruf, ob der extrahierte Text echte
 * technische Produktdaten enthaelt (Schutz gegen Download-Limits / Fehlerseiten).
 */
export function validateExtractedText(
  text: string | null | undefined,
): { valid: boolean; reason?: string } {
  if (!text || text.trim().length < 180) {
    return { valid: false, reason: 'Dokument zu kurz oder leer (< 180 Zeichen).' };
  }
  const hasSpecs = SPEC_MARKER_REGEX.test(text);
  if (!hasSpecs && BLOCK_PAGE_REGEX.test(text)) {
    return {
      valid: false,
      reason: 'Zugriff blockiert / Rate-Limit / Captcha der Herstellerseite erkannt.',
    };
  }
  if (!hasSpecs) {
    return {
      valid: false,
      reason: 'Keine technischen Spezifikationen/Einheiten im Dokument gefunden.',
    };
  }
  return { valid: true };
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
