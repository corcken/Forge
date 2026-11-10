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
