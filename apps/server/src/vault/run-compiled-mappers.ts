import type { CatalogFunctionGroup, CatalogPin } from '@descriptio-forge/shared';

/** Mappt eine Funktionsgruppe auf die Insert-Parameter der `compiled_function_groups`. */
export function toGroupParams(
  partId: string,
  group: CatalogFunctionGroup,
): Record<string, unknown> {
  return {
    id: group.id,
    partId,
    groupKey: group.groupKey,
    functionType: group.functionType,
    symbolDefinitionId: group.symbolDefinitionId,
    potentialPropagation: group.potentialPropagation,
    isPositivelyDriven: group.isPositivelyDriven ? 1 : 0,
    originSource: group.originSource,
  };
}

/** Mappt einen Pin auf die Insert-Parameter der `compiled_pins`. */
export function toPinParams(partId: string, pin: CatalogPin): Record<string, unknown> {
  return {
    id: pin.id,
    partId,
    functionGroupId: pin.functionGroupId,
    pinName: pin.pinName,
    contactType: pin.contactType,
    electricalRole: pin.electricalRole,
    voltageType: pin.voltageType,
    nominalVoltage: pin.nominalVoltage,
    minVoltage: pin.minVoltage,
    maxVoltage: pin.maxVoltage,
    maxCurrent: pin.maxCurrent,
    minCrossSec: pin.minCrossSec,
    maxCrossSec: pin.maxCrossSec,
    maxCrossSecTwin: pin.maxCrossSecTwin,
    maxConnections: pin.maxConnections,
    connectionType: pin.connectionType,
    strippingLengthMm: pin.strippingLengthMm,
    torqueNm: pin.torqueNm,
    physicalOffsetX: pin.physicalOffsetX,
    physicalOffsetY: pin.physicalOffsetY,
    physicalOffsetZ: pin.physicalOffsetZ,
    wireEntryDirection: pin.wireEntryDirection,
    isHeuristicGeometry: pin.isHeuristicGeometry ? 1 : 0,
    fieldOrigins: JSON.stringify(pin.fieldOrigins),
  };
}
