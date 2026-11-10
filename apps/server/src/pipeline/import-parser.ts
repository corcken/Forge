/** Eine aus einer Liste geparste Artikelzeile (optional inkl. Quell-URL). */
export interface ImportEntry {
  id: string;
  manufacturer: string;
  articleNr: string;
  url: string | null;
}

const DOMAIN_MANUFACTURERS: readonly { pattern: RegExp; name: string }[] = [
  { pattern: /(?:^|\.)eaton\./iu, name: 'Eaton' },
  { pattern: /(?:^|\.)siemens\./iu, name: 'Siemens' },
  { pattern: /(?:^|\.)phoenixcontact\./iu, name: 'Phoenix Contact' },
  { pattern: /(?:^|\.)weidmueller\.|weidmuller\./iu, name: 'Weidmueller' },
  { pattern: /(?:^|\.)wago\./iu, name: 'Wago' },
  { pattern: /(?:^|\.)findernet\.|(?:^|\.)finder\./iu, name: 'Finder' },
  { pattern: /(?:^|\.)se\.com|schneider-electric\./iu, name: 'Schneider Electric' },
  { pattern: /(?:^|\.)abb\./iu, name: 'ABB' },
  { pattern: /(?:^|\.)pilz\./iu, name: 'Pilz' },
  { pattern: /(?:^|\.)rittal\./iu, name: 'Rittal' },
  { pattern: /(?:^|\.)murrelektronik\./iu, name: 'Murrelektronik' },
  { pattern: /(?:^|\.)ifm\./iu, name: 'ifm' },
  { pattern: /(?:^|\.)sick\./iu, name: 'Sick' },
  { pattern: /(?:^|\.)turck\./iu, name: 'Turck' },
  { pattern: /(?:^|\.)balluff\./iu, name: 'Balluff' },
  { pattern: /(?:^|\.)lapp\./iu, name: 'Lapp' },
  { pattern: /(?:^|\.)harting\./iu, name: 'Harting' },
];

function isHttpUrl(value: string): boolean {
  return /^https?:\/\/\S+$/iu.test(value.trim());
}

/** Leitet den Herstellernamen aus der Domain einer URL ab. */
export function inferManufacturerFromUrl(urlStr: string, fallback = 'UNBEKANNT'): string {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    for (const entry of DOMAIN_MANUFACTURERS) {
      if (entry.pattern.test(host)) return entry.name;
    }
    const parts = host.replace(/^www\./u, '').split('.');
    const core = parts[0] ?? '';
    if (core.length >= 2) {
      return core.charAt(0).toUpperCase() + core.slice(1);
    }
  } catch {
    // ungültige URL -> Fallback
  }
  return fallback;
}

/** Leitet die Artikelnummer aus gängigen Hersteller-URL-Mustern ab. */
export function inferArticleNrFromUrl(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    // Eaton: /skuPage.046989.html oder /skuPage.046989.pdf
    const eatonMatch = /skuPage\.([^/?#]+?)\.(?:html?|pdf)$/iu.exec(parsed.pathname);
    if (eatonMatch?.[1]) return decodeURIComponent(eatonMatch[1]);

    // Query-Parameter (?sku=..., ?article=..., ?part=..., ?pid=...)
    for (const key of ['sku', 'article', 'articlenr', 'part', 'partnumber', 'pid', 'id']) {
      const val = parsed.searchParams.get(key);
      if (val && val.trim().length > 0) return val.trim();
    }

    // Letztes Pfadsegment ohne .html / .htm / .pdf
    const segments = parsed.pathname
      .split('/')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const last = segments[segments.length - 1];
    if (!last) return null;
    const cleaned = decodeURIComponent(last).replace(/\.(?:html?|pdf|aspx|php)$/iu, '').trim();
    return cleaned.length > 0 ? cleaned : null;
  } catch {
    return null;
  }
}

/**
 * Parst eine Artikel- oder URL-Liste (1 Eintrag pro Zeile).
 * Unterstuetzt:
 *  1) Reine URL:               `https://www.eaton.com/de/de-de/skuPage.046989.html`
 *  2) Hersteller;Artikel;URL:  `Eaton;046989;https://...`
 *  3) Artikel;URL:             `046989;https://...`
 *  4) Hersteller;Artikel:      `Eaton;046989`
 */
export function parseArticleList(text: string, defaultManufacturer = 'UNBEKANNT'): ImportEntry[] {
  const entries: ImportEntry[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    let manufacturer = defaultManufacturer;
    let articleNr = '';
    let url: string | null = null;

    if (isHttpUrl(line)) {
      url = line;
      manufacturer = inferManufacturerFromUrl(url, defaultManufacturer);
      articleNr = inferArticleNrFromUrl(url) ?? '';
    } else {
      const fields = line
        .split(/[;,\t]+/u)
        .map((field) => field.trim())
        .filter((field) => field.length > 0);
      const urlIndex = fields.findIndex(isHttpUrl);
      if (urlIndex >= 0) {
        url = fields[urlIndex]!;
        const rest = fields.filter((_, idx) => idx !== urlIndex);
        if (rest.length >= 2) {
          manufacturer = rest[0]!;
          articleNr = rest[1]!;
        } else if (rest.length === 1) {
          manufacturer = inferManufacturerFromUrl(url, defaultManufacturer);
          articleNr = rest[0]!;
        } else {
          manufacturer = inferManufacturerFromUrl(url, defaultManufacturer);
          articleNr = inferArticleNrFromUrl(url) ?? '';
        }
      } else if (fields.length >= 2) {
        manufacturer = fields[0]!;
        articleNr = fields[1]!;
      } else if (fields.length === 1) {
        articleNr = fields[0]!;
      }
    }

    if (!articleNr) continue;
    const id = `${manufacturer}:${articleNr}`;
    if (seen.has(id)) continue;
    seen.add(id);
    entries.push({ id, manufacturer, articleNr, url });
  }
  return entries;
}
