import {
  CatalogFunctionGroupSchema,
  CatalogPinSchema,
  type AiExtractionOutput,
  type CatalogFunctionGroup,
  type CatalogPin,
  type FieldOrigin,
  type FieldOriginsMap,
  type FunctionGroupTemplate,
  type IecArchetype,
  type PinTemplate,
} from '@descriptio-forge/shared';

/** Ergebnis der Archetyp-Expansion (Funktionsgruppen + Pins + Feldherkunft). */
export interface ArchetypeExpansion {
  functionGroups: CatalogFunctionGroup[];
  fieldOrigins: FieldOriginsMap;
}

/** Baut einen einzelnen CatalogPin aus Pin-Template + KI-Fakten. */
function buildPin(
  partId: string,
  groupKey: string,
  template: PinTemplate,
  facts: AiExtractionOutput,
): CatalogPin {
  const isCoil = template.contactType === 'COIL';
  const nominalVoltage = isCoil ? facts.coilNominalVoltage : null;
  const voltageType = isCoil ? (facts.coilVoltageType ?? template.voltageType) : template.voltageType;

  const pin = CatalogPinSchema.parse({
    id: `${partId}::${groupKey}::${template.pinName}`,
    functionGroupId: `${partId}::${groupKey}`,
    pinName: template.pinName,
    contactType: template.contactType,
    electricalRole: template.electricalRole,
    voltageType,
    nominalVoltage,
    minVoltage: template.minVoltage,
    maxVoltage: template.maxVoltage,
    maxCurrent: isCoil ? null : facts.mainCurrentAmps,
    minCrossSec: facts.minCrossSec,
    maxCrossSec: facts.maxCrossSec,
    maxCrossSecTwin: null,
    maxConnections: template.maxConnections,
    connectionType: template.connectionType,
    strippingLengthMm: facts.strippingLengthMm,
    torqueNm: facts.torqueNm,
    wireEntryDirection: template.wireEntryDirection,
    isHeuristicGeometry: true,
  });

  const origins: FieldOriginsMap = {
    pinName: 'ARC',
    contactType: 'ARC',
    electricalRole: 'ARC',
    voltageType: isCoil && facts.coilVoltageType ? 'AI' : 'ARC',
    nominalVoltage: originOf(nominalVoltage),
    maxCurrent: originOf(pin.maxCurrent),
    minCrossSec: originOf(pin.minCrossSec),
    maxCrossSec: originOf(pin.maxCrossSec),
    torqueNm: originOf(pin.torqueNm),
    strippingLengthMm: originOf(pin.strippingLengthMm),
  };
  return CatalogPinSchema.parse({ ...pin, fieldOrigins: origins });
}

function buildGroup(
  partId: string,
  template: FunctionGroupTemplate,
  bmkPrefix: string,
  facts: AiExtractionOutput,
): CatalogFunctionGroup {
  const groupId = `${partId}::${template.groupKey}`;
  return CatalogFunctionGroupSchema.parse({
    id: groupId,
    groupKey: template.groupKey,
    functionType: template.functionType,
    label: template.label,
    bmkPrefix: template.bmkPrefix ?? bmkPrefix,
    symbolDefinitionId: template.symbolDefinitionId,
    potentialPropagation: template.potentialPropagation,
    isPositivelyDriven: template.isPositivelyDriven,
    originSource: 'ARC',
    pins: template.pins.map((pin) => buildPin(partId, template.groupKey, pin, facts)),
  });
}

/**
 * Expandiert einen IEC-Archetyp zu konkreten Funktionsgruppen und Pins.
 * Strukturelle Felder stammen aus dem Archetyp (ARC), elektrische Werte aus
 * dem KI-Extrakt (AI).
 */
export function expandArchetype(
  partId: string,
  archetype: IecArchetype,
  facts: AiExtractionOutput,
): ArchetypeExpansion {
  const functionGroups = archetype.functionGroupsTemplate.map((template) =>
    buildGroup(partId, template, archetype.defaultBmkPrefix, facts),
  );
  return {
    functionGroups,
    fieldOrigins: {
      archetypeId: 'ARC',
      defaultBmkPrefix: 'ARC',
      category: 'ARC',
      mountingType: originOf(archetype.mountingTypeDefault),
    },
  };
}

function originOf(value: unknown): FieldOrigin {
  return value === null || value === undefined ? 'NULL' : 'AI';
}
