/** Eine aus einer Liste geparste Artikelzeile. */
export interface ImportEntry {
  id: string;
  manufacturer: string;
  articleNr: string;
}

/**
 * Parst eine CSV/TXT-Artikelnummernliste. Unterstuetzt pro Zeile entweder
 * `Hersteller;Artikelnummer`, `Hersteller,Artikelnummer` (auch Tab) oder nur
 * `Artikelnummer`. Leere Zeilen und `#`-Kommentare werden ignoriert. Doppelte
 * Eintraege werden dedupliziert.
 */
export function parseArticleList(text: string, defaultManufacturer = 'UNBEKANNT'): ImportEntry[] {
  const entries: ImportEntry[] = [];
  const seen = new Set<string>();
  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;
    const fields = line
      .split(/[;,\t]+/u)
      .map((field) => field.trim())
      .filter((field) => field.length > 0);
    const manufacturer = fields.length >= 2 ? fields[0]! : defaultManufacturer;
    const articleNr = fields.length >= 2 ? fields[1]! : fields[0]!;
    if (!articleNr) continue;
    const id = `${manufacturer}:${articleNr}`;
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({ id, manufacturer, articleNr });
  }
  return entries;
}
