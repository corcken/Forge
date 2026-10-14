import type { SeriesOverride } from '@descriptio-forge/shared';

/** Leere Baureihen-Vorlage fuer den Editor (Defaults werden in Zod gesetzt). */
export function createEmptySeries(): SeriesOverride {
  return {
    id: `SERIE_${Date.now()}`,
    manufacturer: 'HERSTELLER',
    seriesName: 'NEUE SERIE',
    defaultArchetypeId: null,
    sharedFields: {
      torqueNm: null,
      strippingLengthMm: null,
      maxCrossSecTwin: null,
      dinRailMountOffsetY: null,
      connectionType: null,
      terminalLevels: null,
      voltageType: null,
      minClearanceTopMm: null,
      minClearanceBottomMm: null,
      minClearanceSideMm: null,
      customFields: {},
    },
    accessories: [],
    updatedAt: null,
  };
}
