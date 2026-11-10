import type { SymbolDefinition, SymbolPinPoint } from '@descriptio-forge/shared';

/** Erzeugt normierte 2-Pin Anschlusskoordinaten (oben x=8, y=0; unten x=8, y=16). */
export function twoPinsVertical(topLabel = '1', bottomLabel = '2'): SymbolPinPoint[] {
  return [
    { pinIndex: 1, defaultLabel: topLabel, xMm: 8, yMm: 0, direction: 'TOP' },
    { pinIndex: 2, defaultLabel: bottomLabel, xMm: 8, yMm: 16, direction: 'BOTTOM' },
  ];
}

/** Erzeugt 3-Pin Anschlusskoordinaten fuer Wechsler (Pin 1 oben, Pin 2 & 4 unten). */
export function threePinsChangeover(
  commonLabel = '11',
  ncLabel = '12',
  noLabel = '14',
): SymbolPinPoint[] {
  return [
    { pinIndex: 1, defaultLabel: commonLabel, xMm: 8, yMm: 0, direction: 'TOP' },
    { pinIndex: 2, defaultLabel: ncLabel, xMm: 4, yMm: 16, direction: 'BOTTOM' },
    { pinIndex: 3, defaultLabel: noLabel, xMm: 12, yMm: 16, direction: 'BOTTOM' },
  ];
}

/** Hilfsfunktion zum Erzeugen einer validierten SymbolDefinition. */
export function buildSymbol(params: {
  id: string;
  name: string;
  iec60617Ref: string;
  bmkPrefix: string;
  svgContent: string;
  pins: SymbolPinPoint[];
}): SymbolDefinition {
  return {
    id: params.id,
    name: params.name,
    iec60617Ref: params.iec60617Ref,
    classicRef: null,
    partNumber: null,
    bmkPrefix: params.bmkPrefix,
    gridBaseMm: 4.0,
    svgContent: params.svgContent.trim(),
    pins: params.pins,
    originType: 'STANDARD',
    updatedAt: new Date().toISOString(),
  };
}

/** Erzeugt den SVG-Rahmen fuer 16x16 mm Schaltsymbole im 4-mm-Raster. */
export function svgWrap16(innerSvg: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${innerSvg}</svg>`;
}
