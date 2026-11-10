import { svgWrap16 } from './symbol-svg-builders.js';
import { IEC_BASE_SHAPES } from './symbol-svg-shapes.js';

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
    '<path d="M1.5 8.5h1.5l.8 1.2.7-1.2h1.5"/>',
  POSITIVE_OPENING:
    '<circle cx="11.5" cy="8.5" r="1.8"/><path d="M10.5 8.5h2m-.7-.8l.7.8-.7.8"/>',
  THERMAL:
    '<path d="M1.5 7h2v2.5h2"/><line x1="3.5" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  MAGNETIC:
    '<path d="M1.5 7l2 1.5-2 1.5"/><text x="2" y="6" font-size="2.8" fill="currentColor">I&gt;</text>',
  THERMAL_MAGNETIC:
    '<rect x="1.2" y="5.5" width="3.2" height="6"/><path d="M1.8 7.5h2M1.8 9.5l1.5 1"/>',
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
    '<rect x="1" y="6.5" width="3.2" height="4"/><text x="2.6" y="9.5" font-size="2.8" text-anchor="middle" fill="currentColor">P</text>',
  TEMPERATURE:
    '<rect x="1" y="6.5" width="3.2" height="4"/><text x="2.6" y="9.5" font-size="2.8" text-anchor="middle" fill="currentColor">θ</text>',
  LEVEL:
    '<circle cx="2.5" cy="8.5" r="1.5"/><line x1="4" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  FLOW:
    '<path d="M1 7l3 1.5-3 1.5z"/><line x1="4" y1="8.5" x2="6" y2="8.5" stroke-dasharray="1 1"/>',
  SPEED_RPM:
    '<rect x="1" y="6.5" width="3.2" height="4"/><text x="2.6" y="9.5" font-size="2.8" text-anchor="middle" fill="currentColor">n</text>',
  COUNT_IMPULSE:
    '<rect x="1" y="6.5" width="3.2" height="4"/><path d="M1.5 9.5h.8v-2h.8v2h.8"/>',
  OPTICAL:
    '<path d="M1 6l2.5 1.5m-.8.2l.8-.2-.2-.8M1 8.8l2.5 1.5m-.8.2l.8-.2-.2-.8"/>',
  LIGHT_EMITTING:
    '<path d="M11.5 6l2.5-1.5m-.8-.2l.8.2-.2.8M11.5 8.8l2.5-1.5m-.8-.2l.8.2-.2.8"/>',
  PROXIMITY:
    '<path d="M5.5 6.5l2.5 2-2.5 2M7.5 6.5l2.5 2-2.5 2"/>',
  CAPACITIVE:
    '<line x1="5" y1="6.5" x2="5" y2="10.5"/><line x1="6.5" y1="6.5" x2="6.5" y2="10.5"/>',
  ULTRASONIC:
    '<path d="M4.5 6.5a2.5 2.5 0 0 1 0 4M6 6a3.2 3.2 0 0 1 0 5"/>',
  SEMICONDUCTOR:
    '<path d="M6 7h4l-2 2.5z"/><line x1="6" y1="9.5" x2="10" y2="9.5"/>',
};

function escapeSvgText(txt: string): string {
  return txt
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .slice(0, 6);
}

/**
 * Setzt aus normierten IEC-60617-Grundformen (`baseShape`), Betätigungsorganen (`actuator`)
 * und Kurzzeichen (`qualifier`, z. B. "I>", "U<", "3~", "kWh", "Pt100") ein 16x16-mm-Schaltsymbol zusammen.
 */
export function composeIecPrimitiveSvg(
  baseShape: string | undefined,
  actuator: string | undefined,
  bmk: string,
  pinCount: number,
  qualifier?: string | null,
): string {
  const shapeKey = (baseShape?.toUpperCase() ?? '').trim();
  const actKey = (actuator?.toUpperCase() ?? 'NONE').trim();

  const baseSvg =
    IEC_BASE_SHAPES[shapeKey] ??
    (pinCount === 3
      ? IEC_BASE_SHAPES.CONTACT_CO!
      : bmk === 'X'
        ? IEC_BASE_SHAPES.TERMINAL!
        : IEC_BASE_SHAPES.COIL!);
  const actSvg = ACTUATOR_OVERLAYS[actKey] ?? '';

  const qRaw = qualifier?.trim() || (shapeKey === 'METER_CIRCLE' || shapeKey === 'MOTOR' ? bmk : '');
  let qualSvg = '';
  if (qRaw) {
    const safeQ = escapeSvgText(qRaw);
    if (shapeKey === 'PROTECTION_RELAY' || shapeKey === 'METER_BOX') {
      qualSvg = `<text x="8" y="10.8" font-size="3" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    } else if (shapeKey === 'METER_CIRCLE' || shapeKey === 'MOTOR') {
      qualSvg = `<text x="8" y="9.4" font-size="3.2" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    } else if (shapeKey === 'COIL' && safeQ.length <= 4) {
      qualSvg = `<text x="8" y="9.2" font-size="2.8" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    } else if (shapeKey === 'RESISTOR' || shapeKey === 'CAPACITOR') {
      qualSvg = `<text x="13" y="9" font-size="2.6" text-anchor="middle" fill="currentColor">${safeQ}</text>`;
    }
  }

  return svgWrap16(`${baseSvg}${actSvg}${qualSvg}`);
}
