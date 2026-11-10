import {
  FunctionGroupTemplateSchema,
  IecArchetypeSchema,
  PinTemplateSchema,
  type ArchetypeCategory,
  type ContactType,
  type ElectricalRole,
  type FunctionGroupTemplate,
  type FunctionGroupType,
  type IecArchetype,
  type MountingType,
  type PinTemplate,
  type PotentialPropagation,
  type VoltageType,
} from '@descriptio-forge/shared';

/** Hilfskonfiguration fuer Hilfskontakt-Kombinationen (NO / NC / CO). */
export interface AuxCombo {
  no: number;
  nc: number;
  co?: number;
}

/** Standard-Hilfskontakt-Bestueckungen nach IEC 60947. */
export const AUX_COMBOS_FULL: readonly AuxCombo[] = [
  { no: 0, nc: 0 },
  { no: 1, nc: 0 },
  { no: 0, nc: 1 },
  { no: 1, nc: 1 },
  { no: 2, nc: 0 },
  { no: 0, nc: 2 },
  { no: 2, nc: 1 },
  { no: 1, nc: 2 },
  { no: 2, nc: 2 },
  { no: 3, nc: 1 },
  { no: 1, nc: 3 },
  { no: 4, nc: 0 },
  { no: 4, nc: 4 },
  { no: 0, nc: 0, co: 1 },
  { no: 0, nc: 0, co: 2 },
];

export const AUX_COMBOS_COMPACT: readonly AuxCombo[] = [
  { no: 0, nc: 0 },
  { no: 1, nc: 0 },
  { no: 0, nc: 1 },
  { no: 1, nc: 1 },
  { no: 2, nc: 0 },
  { no: 2, nc: 1 },
  { no: 2, nc: 2 },
  { no: 0, nc: 0, co: 1 },
  { no: 0, nc: 0, co: 2 },
];

/** Erzeugt einen validierten Pin aus Kurzangaben + optionalen Overrides. */
export function pin(
  pinName: string,
  contactType: ContactType,
  electricalRole: ElectricalRole,
  voltageType: VoltageType,
  extra: Partial<PinTemplate> = {},
): PinTemplate {
  return PinTemplateSchema.parse({ pinName, contactType, electricalRole, voltageType, ...extra });
}

/** Erzeugt eine validierte Funktionsgruppe inkl. Pins. */
export function group(
  groupKey: string,
  functionType: FunctionGroupType,
  potentialPropagation: PotentialPropagation,
  pins: PinTemplate[],
  extra: Partial<FunctionGroupTemplate> = {},
): FunctionGroupTemplate {
  return FunctionGroupTemplateSchema.parse({
    groupKey,
    functionType,
    potentialPropagation,
    pins,
    ...extra,
  });
}

/** Erzeugt einen validierten IEC-Archetyp. */
export function archetype(
  id: string,
  name: string,
  category: ArchetypeCategory,
  defaultBmkPrefix: string,
  mountingTypeDefault: MountingType,
  functionGroupsTemplate: FunctionGroupTemplate[],
): IecArchetype {
  return IecArchetypeSchema.parse({
    id,
    name,
    category,
    defaultBmkPrefix,
    mountingTypeDefault,
    functionGroupsTemplate,
  });
}

/** Spulen-Funktionsgruppe A1/A2 fuer Schuetze und Relais. */
export function coil(
  groupKey = 'COIL_1',
  bmkPrefix = 'K',
  voltageType: VoltageType = 'ANY',
  symbolDefinitionId = 'SYM_COIL_STD',
): FunctionGroupTemplate {
  return group(
    groupKey,
    'COIL',
    'ISOLATED_TRANSFORM',
    [
      pin('A1', 'COIL', 'SOURCE', voltageType, { nominalVoltage: 24 }),
      pin('A2', 'COIL', 'SINK', voltageType, { nominalVoltage: 0 }),
    ],
    { bmkPrefix, symbolDefinitionId },
  );
}

/** Erzeugt Hauptstrom-Schaltpole (1P, 2P, 3P, 4P, 6P, 1P_N, 3P_N). */
export function mainPoleGroups(
  poleSpec: string,
  symbolDefinitionId = 'SYM_SWITCH_POLE',
): FunctionGroupTemplate[] {
  const hasN = poleSpec.endsWith('_N');
  const count = Number.parseInt(poleSpec, 10) || 1;
  const pins: PinTemplate[] = [];
  for (let pole = 1; pole <= count; pole += 1) {
    const from = pole * 2 - 1;
    const to = pole * 2;
    const labelIn = count <= 3 ? `${from}/L${pole}` : `${from}`;
    const labelOut = count <= 3 ? `${to}/T${pole}` : `${to}`;
    pins.push(pin(labelIn, 'NO_CONTACT', 'SOURCE', 'AC_DC'));
    pins.push(pin(labelOut, 'NO_CONTACT', 'SINK', 'AC_DC'));
  }
  if (hasN) {
    pins.push(pin('N1', 'NO_CONTACT', 'SOURCE', 'AC_DC'));
    pins.push(pin('N2', 'NO_CONTACT', 'SINK', 'AC_DC'));
  }
  return [group(`MAIN_NO_${poleSpec}`, 'NO_CONTACT', 'SWITCHED_PASS_THROUGH', pins, { symbolDefinitionId })];
}

/** Baut Suffix fuer ID (z. B. `_1NO_1NC`) und deutschen Namen (`+ 1S + 1OE`). */
export function formatAuxLabel(combo: AuxCombo): { idSuffix: string; nameSuffix: string } {
  const idParts: string[] = [];
  const nameParts: string[] = [];
  if (combo.no > 0) {
    idParts.push(`${combo.no}NO`);
    nameParts.push(`${combo.no}S`);
  }
  if (combo.nc > 0) {
    idParts.push(`${combo.nc}NC`);
    nameParts.push(`${combo.nc}OE`);
  }
  if (combo.co && combo.co > 0) {
    idParts.push(`${combo.co}CO`);
    nameParts.push(`${combo.co}W`);
  }
  return {
    idSuffix: idParts.length > 0 ? `_${idParts.join('_')}` : '',
    nameSuffix: nameParts.length > 0 ? ` + ${nameParts.join(' + ')}` : '',
  };
}

/** Erzeugt normgerechte Hilfskontakt-Gruppen (13-14, 21-22, 11-12-14 etc.). */
export function buildAuxGroups(combo: AuxCombo): FunctionGroupTemplate[] {
  const groups: FunctionGroupTemplate[] = [];
  let pos = 1;
  for (let i = 1; i <= combo.no; i += 1) {
    groups.push(
      group(
        `AUX_NO_${i}`,
        'NO_CONTACT',
        'SWITCHED_PASS_THROUGH',
        [
          pin(`${pos}3`, 'NO_CONTACT', 'SOURCE', 'ANY'),
          pin(`${pos}4`, 'NO_CONTACT', 'SINK', 'ANY'),
        ],
        { symbolDefinitionId: 'SYM_NO_CONTACT' },
      ),
    );
    pos += 1;
  }
  for (let i = 1; i <= combo.nc; i += 1) {
    groups.push(
      group(
        `AUX_NC_${i}`,
        'NC_CONTACT',
        'SWITCHED_PASS_THROUGH',
        [
          pin(`${pos}1`, 'NC_CONTACT', 'SOURCE', 'ANY'),
          pin(`${pos}2`, 'NC_CONTACT', 'SINK', 'ANY'),
        ],
        { symbolDefinitionId: 'SYM_NC_CONTACT' },
      ),
    );
    pos += 1;
  }
  for (let i = 1; i <= (combo.co ?? 0); i += 1) {
    groups.push(
      group(
        `AUX_CO_${i}`,
        'CHANGEOVER_CONTACT',
        'SWITCHED_PASS_THROUGH',
        [
          pin(`${pos}1`, 'CHANGEOVER_CONTACT', 'SOURCE', 'ANY'),
          pin(`${pos}2`, 'CHANGEOVER_CONTACT', 'SINK', 'ANY'),
          pin(`${pos}4`, 'CHANGEOVER_CONTACT', 'SINK', 'ANY'),
        ],
        { symbolDefinitionId: 'SYM_CO_CONTACT' },
      ),
    );
    pos += 1;
  }
  return groups;
}
