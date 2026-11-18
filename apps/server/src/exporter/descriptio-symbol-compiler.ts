import crypto from 'node:crypto';
import { IEC_SECTIONS } from '../pipeline/iec-sections-catalog.js';

export interface DescriptioSymbolElement {
  id: string;
  type: 'LINE' | 'RECT' | 'CIRCLE' | 'ARC' | 'PATH' | 'TEXT' | 'POINT' | 'PIN';
  [key: string]: unknown;
}

export interface CompiledDescriptioSymbol {
  id: string;
  name: string;
  iec60617Ref: string | null;
  categoryId: string;
  bmkPrefix: string;
  defaultBmkPrefix: string;
  isTerminal: boolean;
  width: number;
  height: number;
  svgPath: string;
  payload: string;
  svgContent: string;
  originType: string;
  pins: Array<{
    pinIndex: number;
    name: string;
    defaultLabel: string;
    localX: number;
    localY: number;
    xMm: number;
    yMm: number;
    direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  }>;
}

const SCALE = 4;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const tx = (x: number | string): number => round2((Number(x) - 8) * SCALE);
const ty = (y: number | string): number => round2((Number(y) - 8) * SCALE);
const ts = (s: number | string): number => round2(Number(s) * SCALE);

export function deterministicUuid(namespace: string, key: string): string {
  const hash = crypto.createHash('sha1').update(`${namespace}:${key}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

const PART_TITLES: Record<string, string> = {
  'Teil 02': 'IEC 60617-02 Symbolelemente & Kennzeichen',
  'Teil 03': 'IEC 60617-03 Leiter & Verbindungselemente',
  'Teil 04': 'IEC 60617-04 Passive Bauelemente (R, L, C)',
  'Teil 05': 'IEC 60617-05 Halbleiter & Optoelektronik',
  'Teil 06': 'IEC 60617-06 Motoren, Generatoren, Trafos & Umrichter',
  'Teil 07': 'IEC 60617-07 Schaltgeräte, Schütze, Relais & Schutzgeräte',
  'Teil 08': 'IEC 60617-08 Mess-, Melde- & Signalisierungsgeräte',
  'Teil 09': 'IEC 60617-09 Filter, Messumformer & Übertragung',
  'Teil 10': 'IEC 60617-10 SPS, Feldbus & Automatisierungstechnik',
  'Teil 11': 'IEC 60617-11 Gebäudeinstallation, Steckdosen & Verbraucher',
};

const SECTION_FALLBACK_MAP: Record<string, string> = {
  '11-12': '11-13',
  '11-17': '02-15',
  '11-18': '07-22',
  '11-19': '11-13',
  '11-20': '08-04',
};

export function fixGermanUmlauts(text: string): string {
  return text
    .replace(/Naeherung/g, 'Näherung').replace(/naeherung/g, 'näherung')
    .replace(/Schliesser/g, 'Schließer').replace(/schliesser/g, 'schließer')
    .replace(/Oeffner/g, 'Öffner').replace(/oeffner/g, 'öffner')
    .replace(/Empfaenger/g, 'Empfänger').replace(/Ausgaenge/g, 'Ausgänge').replace(/ausgaenge/g, 'ausgänge')
    .replace(/Zaehler/g, 'Zähler').replace(/zaehler/g, 'zähler')
    .replace(/Gehaeuse/g, 'Gehäuse').replace(/gehaeuse/g, 'gehäuse')
    .replace(/Ueber/g, 'Über').replace(/ueber/g, 'über')
    .replace(/Verzoeger/g, 'Verzöger').replace(/verzoeger/g, 'verzöger')
    .replace(/Betaetig/g, 'Betätig').replace(/betaetig/g, 'betätig')
    .replace(/Widerstaende/g, 'Widerstände').replace(/widerstaende/g, 'widerstände')
    .replace(/Schuetz/g, 'Schütz').replace(/schuetz/g, 'schütz')
    .replace(/Luefter/g, 'Lüfter').replace(/luefter/g, 'lüfter')
    .replace(/Geraete/g, 'Geräte').replace(/geraete/g, 'geräte')
    .replace(/Waechter/g, 'Wächter').replace(/waechter/g, 'wächter')
    .replace(/Fuehler/g, 'Fühler').replace(/fuehler/g, 'fühler');
}

export function buildIecSymbolCategories() {
  const categories: Array<{ id: string; name: string; type: string; parentId: string | null; level: number; slug: string; pathLabel: string }> = [];
  const partIds = new Map<string, string>();

  for (const [partKey, title] of Object.entries(PART_TITLES)) {
    const id = deterministicUuid('iec-part', partKey);
    partIds.set(partKey, id);
    const slug = `iec_${partKey.toLowerCase().replace(/\s+/g, '_')}`;
    categories.push({ id, name: title, type: 'SYMBOL', parentId: null, level: 0, slug, pathLabel: title });
  }

  for (const sec of IEC_SECTIONS) {
    const parentId = partIds.get(sec.part) ?? null;
    const id = deterministicUuid('iec-sec', sec.code);
    const cleanName = `${sec.code} ${fixGermanUmlauts(sec.name)}`;
    const slug = `iec_${sec.code.replace('-', '_')}`;
    categories.push({
      id,
      name: cleanName,
      type: 'SYMBOL',
      parentId,
      level: 1,
      slug,
      pathLabel: `${PART_TITLES[sec.part] ?? sec.part} » ${cleanName}`,
    });
  }
  return categories;
}

export function resolveSymbolCategoryId(iec60617Ref: string | null | undefined): string {
  const m = (iec60617Ref || '').match(/\b(\d{2}-\d{2})/);
  const rawSec: string = m?.[1] ?? '07-02';
  const mappedSec: string = SECTION_FALLBACK_MAP[rawSec] ?? rawSec;
  const exists = IEC_SECTIONS.some((s) => s.code === mappedSec);
  return deterministicUuid('iec-sec', exists ? mappedSec : '07-02');
}

export function transformSvgPathD(d: string): string {
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
  const out: Array<string | number> = [];
  let i = 0;
  let cmd = '';
  while (i < tokens.length) {
    const t = tokens[i]!;
    if (/^[a-zA-Z]$/.test(t)) {
      cmd = t;
      i++;
      if (cmd === 'Z' || cmd === 'z') {
        out.push('Z');
        continue;
      }
    }
    const nextNum = (): number => Number(tokens[i++]);
    switch (cmd) {
      case 'M': out.push('M', tx(nextNum()), ty(nextNum())); cmd = 'L'; break;
      case 'm':
        if (out.length === 0) out.push('M', tx(nextNum()), ty(nextNum()));
        else out.push('m', ts(nextNum()), ts(nextNum()));
        cmd = 'l';
        break;
      case 'L': out.push('L', tx(nextNum()), ty(nextNum())); break;
      case 'l': out.push('l', ts(nextNum()), ts(nextNum())); break;
      case 'H': out.push('H', tx(nextNum())); break;
      case 'h': out.push('h', ts(nextNum())); break;
      case 'V': out.push('V', ty(nextNum())); break;
      case 'v': out.push('v', ts(nextNum())); break;
      case 'A': out.push('A', ts(nextNum()), ts(nextNum()), nextNum(), nextNum(), nextNum(), tx(nextNum()), ty(nextNum())); break;
      case 'a': out.push('a', ts(nextNum()), ts(nextNum()), nextNum(), nextNum(), nextNum(), ts(nextNum()), ts(nextNum())); break;
      default: i++; break;
    }
  }
  return out.join(' ');
}

const VECTOR_GLYPHS: Record<string, string> = {
  A: 'M0 1L.5 0 1 1M.2 .65H.8',
  B: 'M0 0V1H.7L.9 .8V.6L.7 .5H0M.7 .5L.9 .35V.15L.7 0H0',
  C: 'M.9 .15L.7 0H.2L0 .2V.8L.2 1H.7L.9 .85',
  D: 'M0 0V1H.6L.9 .75V.25L.6 0H0',
  E: 'M.9 0H0V1H.9M0 .5H.7',
  F: 'M.9 0H0V1M0 .5H.7',
  G: 'M.9 .15L.7 0H.2L0 .2V.8L.2 1H.8V.55H.5',
  H: 'M0 0V1M.9 0V1M0 .5H.9',
  I: 'M.2 0H.7M.45 0V1M.2 1H.7',
  J: 'M.8 0V.8L.6 1H.2L0 .8',
  K: 'M0 0V1M.9 0L0 .55 .9 1',
  L: 'M0 0V1H.9',
  M: 'M0 1V0L.45 .6 .9 0V1',
  N: 'M0 1V0L.9 1V0',
  O: 'M.2 0H.7L.9 .2V.8L.7 1H.2L0 .8V.2Z',
  P: 'M0 1V0H.7L.9 .2V.4L.7 .55H0',
  Q: 'M.2 0H.7L.9 .2V.8L.7 1H.2L0 .8V.2ZM.55 .65L.95 1.05',
  R: 'M0 1V0H.7L.9 .2V.4L.7 .55H0M.55 .55L.9 1',
  S: 'M.9 .15L.7 0H.2L0 .2V.4L.9 .6V.85L.7 1H.2L0 .85',
  T: 'M0 0H.9M.45 0V1',
  U: 'M0 0V.8L.2 1H.7L.9 .8V0',
  V: 'M0 0L.45 1 .9 0',
  W: 'M0 0L.22 1 .45 .4 .68 1 .9 0',
  X: 'M0 0L.9 1M.9 0L0 1',
  Y: 'M0 0L.45 .5V1M.9 0L.45 .5',
  Z: 'M0 0H.9L0 1H.9',
  '0': 'M.2 0H.7L.9 .2V.8L.7 1H.2L0 .8V.2Z',
  '1': 'M.2 .2L.5 0V1M.2 1H.8',
  '2': 'M0 .2L.2 0H.7L.9 .2V.4L0 1H.9',
  '3': 'M0 .15L.2 0H.7L.9 .2V.4L.6 .5 .9 .65V.85L.7 1H.2L0 .85',
  '4': 'M.7 1V0L0 .65H.9',
  '5': 'M.9 0H0V.45H.7L.9 .65V.85L.7 1H.1',
  '6': 'M.8 0H.2L0 .2V.85L.2 1H.7L.9 .8V.6L.7 .45H0',
  '7': 'M0 0H.9L.3 1',
  '8': 'M.2 0H.7L.9 .2V.35L.7 .5H.2L0 .35V.2ZM.2 .5L0 .65V.85L.2 1H.7L.9 .85V.65L.7 .5',
  '9': 'M.1 1H.7L.9 .8V.2L.7 0H.2L0 .2V.4L.2 .55H.9',
  '+': 'M.45 .2V.8M.15 .5H.75',
  '-': 'M.15 .5H.75',
  '=': 'M.1 .35H.85M.1 .65H.85',
  '~': 'M0 .55L.25 .3 .65 .7 .9 .45',
  '>': 'M.1 .2L.8 .5 .1 .8',
  '<': 'M.8 .2L.1 .5 .8 .8',
  '/': 'M.1 1L.8 0',
  'θ': 'M.2 0H.7L.9 .25V.75L.7 1H.2L0 .75V.25ZM0 .5H.9',
  'φ': 'M.45 0V1M.2 .25H.7L.9 .45V.6L.7 .75H.2L0 .6V.45Z',
  '°': 'M.3 0H.6V.3H.3Z',
  'Δ': 'M.45 0L.9 1H0Z',
  'Ω': 'M0 1H.3V.8L.1 .5V.2L.3 0H.6L.8 .2V.5L.6 .8V1H.9',
};

/**
 * Wandelt ein kurzes SVG-Text-Label (`A`, `V`, `kWh`, `U<`, `3~`, `θ`, `DI` usw.)
 * in skalierte Vektor-Linienzuege fuer `svgPath` um.
 */
export function renderVectorTextPath(content: string, x: number, y: number, fontSize: number): string {
  const h = Math.max(4, fontSize * 0.72);
  const w = h * 0.62;
  const step = w * 1.25;
  const topY = round2(y - h);
  const parts: string[] = [];

  for (let idx = 0; idx < content.length; idx++) {
    const rawCh = content[idx]!;
    const glyph = VECTOR_GLYPHS[rawCh] ?? VECTOR_GLYPHS[rawCh.toUpperCase()];
    if (!glyph) continue;
    const ox = round2(x + idx * step);
    const tokens = glyph.match(/[MLHVZ]|-?(?:\d+\.?\d*|\.\d+)/g) || [];
    let i = 0;
    let cmd = '';
    let cx = ox;
    let cy = topY;
    while (i < tokens.length) {
      const t = tokens[i]!;
      if (/^[MLHVZ]$/.test(t)) {
        cmd = t;
        i++;
        if (cmd === 'Z') {
          parts.push('Z');
          continue;
        }
      }
      if (cmd === 'M' || cmd === 'L') {
        cx = round2(ox + Number(tokens[i++]) * w);
        cy = round2(topY + Number(tokens[i++]) * h);
        parts.push(cmd, String(cx), String(cy));
        if (cmd === 'M') cmd = 'L';
      } else if (cmd === 'H') {
        cx = round2(ox + Number(tokens[i++]) * w);
        parts.push('L', String(cx), String(cy));
      } else if (cmd === 'V') {
        cy = round2(topY + Number(tokens[i++]) * h);
        parts.push('L', String(cx), String(cy));
      } else {
        i++;
      }
    }
  }
  return parts.join(' ');
}
