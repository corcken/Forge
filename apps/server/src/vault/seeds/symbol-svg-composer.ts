import { svgWrap16 } from './symbol-svg-builders.js';
import { IEC_BASE_SHAPES, renderIecBaseShape } from './symbol-svg-shapes.js';

export const ACTUATOR_OVERLAYS: Record<string, string> = {
  NONE: '',
  PUSHBUTTON:
    '<line x1="2.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><path d="M2.5 6v5M1 6h1.5M1 11h1.5"/>',
  PULL:
    '<line x1="2.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><path d="M2.5 6v5M2.5 6h1.5M2.5 11h1.5"/>',
  MUSHROOM:
    '<line x1="3" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><path d="M3 6v5M3 6a2.5 2.5 0 0 0-2 2.5 2.5 2.5 0 0 0 2 2.5z"/>',
  KEY:
    '<line x1="3.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><circle cx="2" cy="7.5" r="1.2"/><path d="M2 8.7v2.5h1.2"/>',
  ROTARY:
    '<line x1="3" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><path d="M1.5 6.5v4M1.5 6.5h1.5M1.5 10.5l-1 1"/>',
  TOGGLE_LEVER:
    '<line x1="3" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><line x1="3" y1="8.5" x2="1" y2="5.5"/><circle cx="1" cy="5.5" r="0.8" fill="currentColor"/>',
  FOOT_PEDAL:
    '<line x1="3" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><path d="M1 10.5l2.5-3v3.5"/>',
  ROLLER:
    '<line x1="3.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><circle cx="2" cy="8.5" r="1.4"/>',
  CAM:
    '<line x1="3.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><path d="M1.2 8.5a1.5 1.5 0 1 0 2.5-1l.5-1.2-1.2.5a1.5 1.5 0 0 0-1.8 1.7z"/>',
  SPRING_RETURN:
    '<path d="M2 7l1 1.5-1 1.5"/><line x1="3" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  LATCH_DETENT:
    '<path d="M1.5 8.5h1.5l.8 1.2.7-1.2h1.7" stroke-dasharray="1 1"/>',
  POSITIVE_OPENING:
    '<circle cx="11.5" cy="8.5" r="1.8"/><path d="M10.5 8.5h2m-.7-.8l.7.8-.7.8"/>',
  THERMAL:
    '<path d="M1.5 7h2v2.5h1"/><line x1="3.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  MAGNETIC:
    '<path d="M1.5 7l2 1.5-2 1.5"/><line x1="3.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/><text x="2.2" y="6" font-size="2.6" fill="currentColor">I&gt;</text>',
  THERMAL_MAGNETIC:
    '<rect x="1" y="5.5" width="3.2" height="6"/><path d="M1.6 7.5h2M1.6 9.5l1.5 1"/><line x1="4.2" y1="8.5" x2="6.2" y2="8.5" stroke-dasharray="1 1"/>',
  DELAY_ON:
    '<path d="M2.5 6.5a2.5 2.5 0 0 1 0 4"/><line x1="3.5" y1="8.5" x2="6" y2="8.5"/>',
  DELAY_OFF:
    '<path d="M3.5 6.5a2.5 2.5 0 0 0 0 4"/><line x1="2.5" y1="8.5" x2="6" y2="8.5"/>',
  DELAY_BOTH:
    '<path d="M2.2 6.5a2.5 2.5 0 0 1 0 4M3.8 6.5a2.5 2.5 0 0 0 0 4"/><line x1="3.8" y1="8.5" x2="6" y2="8.5"/>',
  EARLY_MAKE:
    '<path d="M3 9.5l1.5-1.5 1.5 1.5"/>',
  LATE_BREAK:
    '<path d="M3 7.5l1.5 1.5 1.5-1.5"/>',
  PRESSURE:
    '<rect x="1" y="6.5" width="3.2" height="4"/><line x1="4.2" y1="8.5" x2="6.2" y2="8.5" stroke-dasharray="1 1"/><text x="2.6" y="9.5" font-size="2.8" text-anchor="middle" fill="currentColor">P</text>',
  TEMPERATURE:
    '<rect x="1" y="6.5" width="3.2" height="4"/><line x1="4.2" y1="8.5" x2="6.2" y2="8.5" stroke-dasharray="1 1"/><text x="2.6" y="9.5" font-size="2.8" text-anchor="middle" fill="currentColor">θ</text>',
  LEVEL:
    '<circle cx="2.5" cy="8.5" r="1.5"/><line x1="4" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  FLOW:
    '<path d="M1 7l3 1.5-3 1.5z"/><line x1="4" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  SPEED_RPM:
    '<rect x="1" y="6.5" width="3.2" height="4"/><line x1="4.2" y1="8.5" x2="6.2" y2="8.5" stroke-dasharray="1 1"/><text x="2.6" y="9.5" font-size="2.8" text-anchor="middle" fill="currentColor">n</text>',
  COUNT_IMPULSE:
    '<rect x="1" y="6.5" width="3.2" height="4"/><line x1="4.2" y1="8.5" x2="6.2" y2="8.5" stroke-dasharray="1 1"/><path d="M1.5 9.5h.8v-2h.8v2h.8"/>',
  OPTICAL:
    '<path d="M1 6l2.5 1.5m-.8.2l.8-.2-.2-.8M1 8.8l2.5 1.5m-.8.2l.8-.2-.2-.8"/>',
  LIGHT_EMITTING:
    '<path d="M11.5 6l2.5-1.5m-.8-.2l.8.2-.2.8M11.5 8.8l2.5-1.5m-.8-.2l.8.2-.2.8"/>',
  PROXIMITY:
    '<path d="M1.5 6.8l2 1.7-2 1.7M3.2 6.8l2 1.7-2 1.7"/>',
  CAPACITIVE:
    '<line x1="2.2" y1="6.5" x2="2.2" y2="10.5"/><line x1="3.8" y1="6.5" x2="3.8" y2="10.5"/><line x1="3.8" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  ULTRASONIC:
    '<path d="M2 6.8a2.2 2.2 0 0 1 0 3.4M3.5 6.2a3 3 0 0 1 0 4.6"/>',
  SEMICONDUCTOR:
    '<path d="M1.2 7h2.8L2.6 9.3z"/><line x1="1.2" y1="9.3" x2="4" y2="9.3"/><line x1="4" y1="8.3" x2="6.2" y2="8.3" stroke-dasharray="1 1"/>',
};

const WIDE_BOX_OR_CIRCLE_SHAPES = new Set([
  'PROTECTION_RELAY',
  'SENSOR_BOX',
  'METER_BOX',
  'METER_CIRCLE',
  'MOTOR',
  'CONVERTER_BOX',
  'PLC_BLOCK',
  'OPTOCOUPLER',
  'ENCLOSURE_BOX',
  'SHIELD_SCREEN',
  'EARTH_PE',
  'EARTH_FE',
  'EARTH_GENERAL',
  'EARTH_CHASSIS',
  'EQUIPOTENTIAL',
]);

const SEMICONDUCTOR_SHAPES = new Set([
  'DIODE',
  'ZENER_DIODE',
  'THYRISTOR',
  'TRANSISTOR',
  'OPTOCOUPLER',
]);

const ACTUATOR_QUALIFIER_FALLBACK: Record<string, string> = {
  PRESSURE: 'P',
  TEMPERATURE: 'θ',
  THERMAL: 'θ',
  SPEED_RPM: 'n',
  COUNT_IMPULSE: 'Imp',
  LEVEL: 'L',
  FLOW: 'F',
  MAGNETIC: 'I>',
  THERMAL_MAGNETIC: 'I>',
  OPTICAL: 'λ',
  PROXIMITY: 'Px',
  CAPACITIVE: 'C',
  ULTRASONIC: 'US',
};

function escapeSvgText(txt: string): string {
  return txt
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .slice(0, 6);
}

/**
 * Ermittelt fuer Symbole, die zuvor auf generische Fallbacks (`TERMINAL`, `CONVERTER_BOX`)
 * gefallen sind, anhand von IEC-Kapitel und Name die spezifische IEC-60617-Grundform.
 */
export function inferBetterBaseShape(
  rawShape: string | undefined,
  iec60617Ref?: string | null,
  name?: string,
  bmk?: string,
  pinCount = 2,
): string {
  const shape = (rawShape?.toUpperCase() ?? '').trim();
  const sec = (iec60617Ref || '').match(/\b(\d{2}-\d{2})/)?.[1] ?? '';
  const lower = (name || '').toLowerCase();

  if (lower.includes('erdungsschalter')) return 'EARTHING_SWITCH';
  if (lower.includes('abschlusswiderstand') || lower.includes('terminator')) return 'RESISTOR';

  if (sec === '02-15' || sec === '02-01' || sec === '11-17') {
    if (lower.includes('potentialausgleich')) return 'EQUIPOTENTIAL';
    if (lower.includes('funktionserd') || lower.includes('clean earth') || lower.includes('signalerde') || lower.includes('signalmasse')) {
      return 'EARTH_FE';
    }
    if (lower.includes('gehäuseerde') || lower.includes('chassis') || lower.includes('masseanschluss') || lower.includes('rahmengehäuse') || lower.includes('rahmen- oder gehäuseerde')) {
      return 'EARTH_CHASSIS';
    }
    if (lower.includes('schutzleiter') || lower.includes('schutzerd') || lower.includes('pe-klemme') || lower.includes('pen-') || lower.includes('schirmanschluss an pe')) {
      return 'EARTH_PE';
    }
    if (lower.includes('erdung') || lower.includes('erde')) {
      return 'EARTH_GENERAL';
    }
    if (lower.includes('schirm') || lower.includes('abschirm') || lower.includes('faraday')) {
      return 'SHIELD_SCREEN';
    }
    if (sec === '02-01' && (lower.includes('gehäuse') || lower.includes('gegenstand') || lower.includes('rahmen') || lower.includes('schalttafel'))) {
      return 'ENCLOSURE_BOX';
    }
    if (sec === '11-17' && lower.includes('schiene')) {
      return 'BUSBAR';
    }
  }

  if (sec === '02-02' && shape === 'TERMINAL') {
    return 'METER_CIRCLE';
  }

  if (sec === '03-01') {
    if (lower.includes('sammelschiene')) return 'BUSBAR';
    if (lower.includes('schirm')) return 'SHIELD_SCREEN';
    if (lower.includes('koaxial')) return 'COAX_CABLE';
    if (lower.includes('twisted')) return 'TWISTED_PAIR';
    if (lower.includes('ende')) return 'CABLE_TERMINATION';
    if (shape === 'TERMINAL' && pinCount !== 3) return 'CONDUCTOR_LINE';
  }

  if (sec === '03-04') {
    if (lower.includes('erdung') || lower.includes('schirmabschluss')) return 'EARTH_GENERAL';
    if (lower.includes('endverschluss') && pinCount === 1) return 'CABLE_TERMINATION';
    if (shape === 'TERMINAL' || (shape === 'CONVERTER_BOX' && lower.includes('kasten'))) {
      return pinCount >= 3 ? 'TERMINAL' : 'CABLE_SPLICE';
    }
  }

  if (shape && shape in IEC_BASE_SHAPES) return shape;
  if (pinCount === 3) return 'CONTACT_CO';
  if (bmk === 'X') return 'TERMINAL';
  return 'COIL';
}

/**
 * Setzt aus normierten IEC-60617-Grundformen (`baseShape`), Betaetigungsorganen (`actuator`)
 * und Kurzzeichen (`qualifier`, z. B. "I>", "U<", "3~", "kWh", "Pt100") ein 16x16-mm-Schaltsymbol zusammen.
 */
export function composeIecPrimitiveSvg(
  baseShape: string | undefined,
  actuator: string | undefined,
  bmk: string,
  pinCount: number,
  qualifier?: string | null,
  iec60617Ref?: string | null,
  name?: string,
): string {
  const shapeKey = inferBetterBaseShape(baseShape, iec60617Ref, name, bmk, pinCount);
  const actKey = (actuator?.toUpperCase() ?? 'NONE').trim();

  const baseSvg = renderIecBaseShape(shapeKey, pinCount);

  const isWideOrMultiPole =
    WIDE_BOX_OR_CIRCLE_SHAPES.has(shapeKey) ||
    SEMICONDUCTOR_SHAPES.has(shapeKey) ||
    pinCount === 4;

  // Verhindere Kollisionen zwischen linken Kontakt-Betaetigern (x=1..6) und breiten Gehaeusen (x=2.5..13.5) bzw. 4-Pin-Polen (x=4)
  let actSvg = '';
  if (!isWideOrMultiPole) {
    actSvg = ACTUATOR_OVERLAYS[actKey] ?? '';
  } else if (actKey === 'LIGHT_EMITTING' && shapeKey !== 'OPTOCOUPLER') {
    actSvg = ACTUATOR_OVERLAYS.LIGHT_EMITTING!;
  }

  const fallbackQual = isWideOrMultiPole ? (ACTUATOR_QUALIFIER_FALLBACK[actKey] ?? '') : '';
  const qRaw =
    qualifier?.trim() ||
    fallbackQual ||
    (shapeKey === 'METER_CIRCLE' || shapeKey === 'MOTOR' ? bmk : '');

  let qualSvg = '';
  if (qRaw && shapeKey !== 'OPTOCOUPLER') {
    const safeQ = escapeSvgText(qRaw);
    if (shapeKey === 'PROTECTION_RELAY' || shapeKey === 'METER_BOX') {
      qualSvg = `<text x="8" y="10.8" font-size="3" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    } else if (
      shapeKey === 'METER_CIRCLE' ||
      shapeKey === 'MOTOR' ||
      shapeKey === 'SENSOR_BOX' ||
      shapeKey === 'ENCLOSURE_BOX' ||
      shapeKey === 'SHIELD_SCREEN'
    ) {
      qualSvg = `<text x="8" y="9.3" font-size="2.8" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    } else if (shapeKey === 'PLC_BLOCK') {
      qualSvg = `<text x="8" y="9.1" font-size="2.6" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    } else if (shapeKey === 'CONVERTER_BOX') {
      qualSvg = `<text x="5.6" y="7" font-size="2.6" text-anchor="middle" fill="currentColor">${safeQ.slice(0, 3)}</text>`;
    } else if ((shapeKey === 'COIL' || shapeKey === 'COIL_DOUBLE') && safeQ.length <= 4) {
      qualSvg = `<text x="8" y="9.2" font-size="2.8" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    } else if ((shapeKey === 'RESISTOR' || shapeKey === 'CAPACITOR') && pinCount !== 4) {
      qualSvg = `<text x="13.2" y="9" font-size="2.4" text-anchor="middle" fill="currentColor">${safeQ.slice(0, 4)}</text>`;
    }
  } else if (shapeKey === 'CONVERTER_BOX' && actKey === 'SEMICONDUCTOR') {
    qualSvg = '<text x="5.4" y="7" font-size="2.8" fill="currentColor">~</text><text x="9.6" y="11.5" font-size="2.8" fill="currentColor">=</text>';
  }

  return svgWrap16(`${baseSvg}${actSvg}${qualSvg}`);
}
