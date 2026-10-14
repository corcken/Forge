import {
  CatalogPinSchema,
  type CatalogPin,
  type ConnectionType,
  type PartAccessoryRelation,
  type SeriesOverride,
  type VoltageType,
} from '@descriptio-forge/shared';
import { setOrigin } from './field-merger.js';

/** Partweite Baureihen-Defaults (Herkunft SER), sofern in der Serie vorhanden. */
export interface SeriesPartFields {
  torqueNm: number | null;
  strippingLengthMm: number | null;
  maxCrossSecTwin: number | null;
  dinRailMountOffsetY: number | null;
  connectionType: ConnectionType | null;
  terminalLevels: number | null;
  voltageType: VoltageType | null;
}

const EMPTY: SeriesPartFields = {
  torqueNm: null,
  strippingLengthMm: null,
  maxCrossSecTwin: null,
  dinRailMountOffsetY: null,
  connectionType: null,
  terminalLevels: null,
  voltageType: null,
};

/** Liest die partweiten Defaults aus einer Baureihe (oder liefert leere Werte). */
export function extractSeriesPartFields(series: SeriesOverride | null): SeriesPartFields {
  if (!series) return { ...EMPTY };
  const shared = series.sharedFields;
  return {
    torqueNm: shared.torqueNm,
    strippingLengthMm: shared.strippingLengthMm,
    maxCrossSecTwin: shared.maxCrossSecTwin,
    dinRailMountOffsetY: shared.dinRailMountOffsetY,
    connectionType: shared.connectionType,
    terminalLevels: shared.terminalLevels,
    voltageType: shared.voltageType,
  };
}

/** Zubehoer-Relationen einer Baureihe (Herkunft SER). */
export function extractSeriesAccessories(series: SeriesOverride | null): PartAccessoryRelation[] {
  return series ? series.accessories : [];
}

/**
 * Fuellt ausschliesslich die im Pin noch leeren Felder aus der Baureihe
 * (`torqueNm`, `strippingLengthMm`, `maxCrossSecTwin`, `connectionType`)
 * und setzt deren Herkunft auf `SER`.
 */
export function fillPinFromSeries(pin: CatalogPin, series: SeriesOverride | null): CatalogPin {
  if (!series) return pin;
  const shared = series.sharedFields;
  const next = { ...pin };
  let origins = pin.fieldOrigins;

  if (next.maxCrossSecTwin == null && shared.maxCrossSecTwin != null) {
    next.maxCrossSecTwin = shared.maxCrossSecTwin;
    origins = setOrigin(origins, 'maxCrossSecTwin', 'SER');
  }
  if (next.torqueNm == null && shared.torqueNm != null) {
    next.torqueNm = shared.torqueNm;
    origins = setOrigin(origins, 'torqueNm', 'SER');
  }
  if (next.strippingLengthMm == null && shared.strippingLengthMm != null) {
    next.strippingLengthMm = shared.strippingLengthMm;
    origins = setOrigin(origins, 'strippingLengthMm', 'SER');
  }
  if (next.connectionType == null && shared.connectionType != null) {
    next.connectionType = shared.connectionType;
    origins = setOrigin(origins, 'connectionType', 'SER');
  }
  return CatalogPinSchema.parse({ ...next, fieldOrigins: origins });
}
