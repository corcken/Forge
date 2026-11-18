import {
  type CompiledDescriptioSymbol,
  type DescriptioSymbolElement,
  fixGermanUmlauts,
  renderVectorTextPath,
  resolveSymbolCategoryId,
  transformSvgPathD,
} from './descriptio-symbol-compiler.js';
import { normalizeIec81346BmkPrefix } from '../vault/seeds/symbol-svg-shapes.js';

const SCALE = 4;
const round2 = (n: number): number => Math.round(n * 100) / 100;
const tx = (x: number | string): number => round2((Number(x) - 8) * SCALE);
const ty = (y: number | string): number => round2((Number(y) - 8) * SCALE);
const ts = (s: number | string): number => round2(Number(s) * SCALE);

function getAttr(tagStr: string, attr: string): string | null {
  const m = tagStr.match(new RegExp(`\\b${attr}="([^"]*)"`, 'i'));
  return m ? m[1]! : null;
}

function decodeXmlEntities(str: string): string {
  return str.replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
}

export function normalizePinLabels(
  pins: Array<{ pinIndex?: number; defaultLabel?: string }>,
  iec60617Ref: string | null | undefined,
  name: string,
): string[] {
  const rawLabels = pins.map((p, i) => String(p.defaultLabel || p.pinIndex || i + 1));
  const sec = (iec60617Ref || '').match(/\b(\d{2}-\d{2})/)?.[1] ?? '';
  const hasDuplicate = new Set(rawLabels).size !== rawLabels.length;
  const hasBadToken = rawLabels.some((l) =>
    /[\s~><θφ°]|^(Q|QF|QS|QM|K\d+|RCBO|FI|PTC|Pt100|I>|U<|U>|P>|T>|1~.*|3~.*)$/i.test(l),
  );
  const badCoil = sec === '07-15' && rawLabels.length === 2 && !['A1', 'C1', 'D1', '1'].includes(rawLabels[0]!);
  const badMotor = /^06-0[45678]$/.test(sec) && rawLabels[0] === 'M';
  const badPrefixPin = (rawLabels[0] === 'B' && rawLabels.length === 2 && sec !== '05-03' && sec !== '10-02') ||
    (rawLabels[0] === 'F' && rawLabels.length >= 2) || (rawLabels[0] === 'E' && rawLabels[1] === 'H');

  if (!hasDuplicate && !hasBadToken && !badCoil && !badMotor && !badPrefixPin) return rawLabels;

  const n = pins.length;
  const lower = name.toLowerCase();
  if (sec === '07-15' || lower.includes('spule') || lower.includes('magnetventil')) {
    return n === 4 ? ['A1', 'A2', 'B1', 'B2'] : ['A1', 'A2'];
  }
  if (/^06-0[45678]$/.test(sec) || lower.includes('motor') || lower.includes('generator')) {
    if (n === 2) return lower.includes('gleichstrom') ? ['A1', 'A2'] : ['U1', 'U2'];
    if (n === 3) return ['U', 'V', 'W'];
    return lower.includes('gleichstrom') ? ['A1', 'A2', 'F1', 'F2'] : ['U1', 'U2', 'Z1', 'Z2'];
  }
  if (n === 2) {
    if (lower.includes('öffner') || lower.includes('oeffner')) return ['21', '22'];
    if (lower.includes('schließer') || lower.includes('schliesser')) return ['13', '14'];
    return ['1', '2'];
  }
  if (n === 3) return lower.includes('wechsler') || lower.includes('umschalt') ? ['11', '12', '14'] : ['1', '2', '3'];
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

export function compileElementsToSvgPath(elements: DescriptioSymbolElement[]): string {
  const paths: string[] = [];
  for (const el of elements) {
    if (el.type === 'LINE') paths.push(`M ${el.x1} ${el.y1} L ${el.x2} ${el.y2}`);
    else if (el.type === 'RECT') {
      const x = Number(el.x), y = Number(el.y), w = Number(el.width), h = Number(el.height);
      paths.push(`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`);
    } else if (el.type === 'CIRCLE') {
      const cx = Number(el.cx), cy = Number(el.cy), r = Number(el.r);
      paths.push(`M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`);
    } else if (el.type === 'ARC') paths.push(`M ${el.x1} ${el.y1} A ${el.r} ${el.r} 0 0 1 ${el.x2} ${el.y2}`);
    else if (el.type === 'PATH' && typeof el.d === 'string' && el.d.trim()) paths.push(el.d.trim());
    else if (el.type === 'POINT') {
      const px = Number(el.x), py = Number(el.y);
      paths.push(`M ${px - 1.5} ${py} A 1.5 1.5 0 1 0 ${px + 1.5} ${py} A 1.5 1.5 0 1 0 ${px - 1.5} ${py}`);
    } else if (el.type === 'TEXT' && typeof el.content === 'string' && el.content.trim()) {
      const tp = renderVectorTextPath(el.content.trim(), Number(el.x ?? 0), Number(el.y ?? 0), Number(el.fontSize ?? 8));
      if (tp) paths.push(tp);
    }
  }
  return paths.join(' ').trim();
}

export function compileSymbolForDescriptio(raw: {
  id: string;
  name: string;
  iec60617Ref?: string | null;
  bmkPrefix?: string | null;
  svgContent: string;
  originType?: string;
  pins?: Array<{ pinIndex?: number; defaultLabel?: string; xMm?: number; yMm?: number; direction?: string }>;
}): CompiledDescriptioSymbol {
  const rawCleanName = fixGermanUmlauts(raw.name);
  const cleanName =
    raw.id === 'SYM_NO_CONTACT' ? 'Schließer-Kontakt (NO)' :
    raw.id === 'SYM_NC_CONTACT' ? 'Öffner-Kontakt (NC)' :
    raw.id === 'SYM_CO_CONTACT' ? 'Wechsler-Kontakt (CO)' :
    rawCleanName;
  const elements: DescriptioSymbolElement[] = [];
  let elCounter = 1;

  const tagRegex = /<(line|rect|circle|path|text)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;
  for (const match of raw.svgContent.matchAll(tagRegex)) {
    const tag = match[1]!.toLowerCase();
    const attrs = match[2] || '';
    const inner = match[3] || '';
    const dashed = attrs.includes('stroke-dasharray');
    const filled = (getAttr(attrs, 'fill') ?? '') === 'currentColor';
    const id = `el-${elCounter++}`;

    if (tag === 'line') {
      elements.push({ type: 'LINE', id, x1: tx(getAttr(attrs, 'x1') ?? 0), y1: ty(getAttr(attrs, 'y1') ?? 0), x2: tx(getAttr(attrs, 'x2') ?? 0), y2: ty(getAttr(attrs, 'y2') ?? 0), dashed, strokeWidth: 1.2 });
    } else if (tag === 'rect') {
      elements.push({ type: 'RECT', id, x: tx(getAttr(attrs, 'x') ?? 0), y: ty(getAttr(attrs, 'y') ?? 0), width: ts(getAttr(attrs, 'width') ?? 0), height: ts(getAttr(attrs, 'height') ?? 0), dashed, ...(filled ? { filled: true } : {}), strokeWidth: 1.2 });
    } else if (tag === 'circle') {
      const cx = tx(getAttr(attrs, 'cx') ?? 8), cy = ty(getAttr(attrs, 'cy') ?? 8), rawR = Number(getAttr(attrs, 'r') ?? 1);
      if (filled && rawR <= 1.0) elements.push({ type: 'POINT', id, x: cx, y: cy });
      else elements.push({ type: 'CIRCLE', id, cx, cy, r: ts(rawR), dashed, ...(filled ? { filled: true } : {}), strokeWidth: 1.2 });
    } else if (tag === 'path') {
      const rawD = getAttr(attrs, 'd') ?? '';
      if (rawD) elements.push({ type: 'PATH', id, d: transformSvgPathD(rawD), ...(filled ? { filled: true } : {}), strokeWidth: 1.2 });
    } else if (tag === 'text') {
      const content = decodeXmlEntities(inner.trim());
      if (content) {
        const fontSize = round2(Number(getAttr(attrs, 'font-size') ?? 2.8) * 3.2);
        const baseX = tx(getAttr(attrs, 'x') ?? 8);
        const xPos = getAttr(attrs, 'text-anchor') === 'middle' ? round2(baseX - content.length * fontSize * 0.28) : baseX;
        elements.push({ type: 'TEXT', id, x: xPos, y: ty(getAttr(attrs, 'y') ?? 8), content, fontSize });
      }
    }
  }

  const rawPins = raw.pins || [];
  const normLabels = normalizePinLabels(rawPins, raw.iec60617Ref, cleanName);
  const compiledPins = rawPins.map((p, idx) => {
    const xMm = p.xMm ?? 8, yMm = p.yMm ?? (idx % 2 === 0 ? 0 : 16);
    const localX = tx(xMm), localY = ty(yMm);
    const rawDir = (p.direction || '').toUpperCase();
    const direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' =
      rawDir === 'TOP' || rawDir === 'UP' ? 'UP' :
      rawDir === 'BOTTOM' || rawDir === 'DOWN' ? 'DOWN' :
      rawDir === 'LEFT' ? 'LEFT' : rawDir === 'RIGHT' ? 'RIGHT' : localY < 0 ? 'UP' : 'DOWN';
    const label = normLabels[idx] || String(idx + 1);
    elements.push({ type: 'PIN', id: `pin-${idx + 1}`, name: label, x: localX, y: localY, direction });
    return { pinIndex: p.pinIndex ?? idx + 1, name: label, defaultLabel: label, localX, localY, xMm, yMm, direction };
  });

  const rawPrefix = normalizeIec81346BmkPrefix(raw.bmkPrefix, raw.iec60617Ref, cleanName);
  const defaultBmkPrefix = `-${rawPrefix}`;
  const isTerminal = (rawPrefix.charAt(0).toUpperCase() || 'K') === 'X';
  const width = 64, height = 64;
  const viewBox = { x: -width / 2, y: -height / 2, width, height };
  const rightX = viewBox.x + viewBox.width + 4;
  const topY = viewBox.y;
  const bottomY = viewBox.y + viewBox.height;
  const svgPath = compileElementsToSvgPath(elements);
  const stateObj = {
    viewBox,
    gridSize: 4,
    elements,
    labelOffsets: {
      bmk: { x: rightX, y: topY + 8 },
      description: { x: rightX, y: topY + 18 },
      value: { x: rightX, y: topY + 28 },
      contactMirror: { x: 0, y: bottomY + 12 },
    },
    showBmk: true,
    showDescription: true,
    showValue: true,
    showContactMirror: rawPrefix.startsWith('K') || rawPrefix.startsWith('Q'),
  };

  return {
    id: raw.id, name: cleanName, iec60617Ref: raw.iec60617Ref ?? null,
    categoryId: resolveSymbolCategoryId(raw.iec60617Ref),
    bmkPrefix: defaultBmkPrefix, defaultBmkPrefix, isTerminal, width, height,
    svgPath, payload: JSON.stringify(stateObj), svgContent: raw.svgContent,
    originType: raw.originType ?? 'NORM_SEED', pins: compiledPins,
  };
}
