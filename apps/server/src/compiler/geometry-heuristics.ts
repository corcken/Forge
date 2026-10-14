import {
  CatalogFunctionGroupSchema,
  CatalogPinSchema,
  type CatalogFunctionGroup,
  type FieldOriginsMap,
} from '@descriptio-forge/shared';
import { setOrigin } from './field-merger.js';

/** Verfuegbare Gehaeusemasse fuer die Geometrie-Heuristik (in mm). */
export interface GeometryDimensions {
  width: number | null;
  height: number | null;
  depth: number | null;
}

const DEFAULT_WIDTH = 45;
const DEFAULT_HEIGHT = 90;
const DEFAULT_DEPTH = 60;

/**
 * Berechnet fuer alle Pins ohne echte CAD-Koordinaten vorlaeufige
 * 3D-Anschlusspunkte (`physicalOffsetX/Y/Z`) und die Einfuehrrichtung
 * anhand der Gehaeusemasse. Alle so erzeugten Werte erhalten `HEU` und
 * `isHeuristicGeometry = true`.
 */
export function applyGeometryHeuristics(
  groups: CatalogFunctionGroup[],
  dims: GeometryDimensions,
): CatalogFunctionGroup[] {
  const width = positive(dims.width, DEFAULT_WIDTH);
  const height = positive(dims.height, DEFAULT_HEIGHT);
  const depth = positive(dims.depth, DEFAULT_DEPTH);

  return groups.map((group) => {
    const pinCount = group.pins.length || 1;
    const pins = group.pins.map((pin, index) => {
      if (hasRealCoordinates(pin.physicalOffsetX, pin.physicalOffsetY, pin.physicalOffsetZ)) {
        return pin;
      }
      const x = round3(-width / 2 + (width * (index + 0.5)) / pinCount);
      const isTop = pin.electricalRole === 'SOURCE' || pin.electricalRole === 'REFERENCE';
      const y = round3(isTop ? height / 2 : -height / 2);
      const z = round3(depth / 2);
      let origins: FieldOriginsMap = pin.fieldOrigins;
      origins = setOrigin(origins, 'physicalOffsetX', 'HEU');
      origins = setOrigin(origins, 'physicalOffsetY', 'HEU');
      origins = setOrigin(origins, 'physicalOffsetZ', 'HEU');
      origins = setOrigin(origins, 'wireEntryDirection', 'HEU');
      return CatalogPinSchema.parse({
        ...pin,
        physicalOffsetX: x,
        physicalOffsetY: y,
        physicalOffsetZ: z,
        wireEntryDirection: isTop ? 'TOP' : 'BOTTOM',
        isHeuristicGeometry: true,
        fieldOrigins: origins,
      });
    });
    return CatalogFunctionGroupSchema.parse({ ...group, pins });
  });
}

function hasRealCoordinates(x: number | null, y: number | null, z: number | null): boolean {
  return x !== null || y !== null || z !== null;
}

function positive(value: number | null, fallback: number): number {
  return value !== null && value > 0 ? value : fallback;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
