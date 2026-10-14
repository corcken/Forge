import {
  ArchetypeCategorySchema,
  FunctionGroupTemplateSchema,
  IecArchetypeSchema,
  PinTemplateSchema,
  type ArchetypeCategory,
  type FunctionGroupTemplate,
  type FunctionGroupType,
  type IecArchetype,
  type MountingType,
  type PinTemplate,
  type PotentialPropagation,
  type ContactType,
  type ElectricalRole,
  type VoltageType,
} from '@descriptio-forge/shared';

/** Erzeugt einen validierten Pin aus Kurzangaben + optionalen Overrides. */
function pin(
  pinName: string,
  contactType: ContactType,
  electricalRole: ElectricalRole,
  voltageType: VoltageType,
  extra: Partial<PinTemplate> = {},
): PinTemplate {
  return PinTemplateSchema.parse({ pinName, contactType, electricalRole, voltageType, ...extra });
}

/** Erzeugt eine validierte Funktionsgruppe inkl. Pins. */
function group(
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
function archetype(
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

const coil = (
  groupKey: string,
  potentials: PotentialPropagation = 'ISOLATED_TRANSFORM',
): FunctionGroupTemplate =>
  group(
    groupKey,
    'COIL',
    potentials,
    [
      pin('A1', 'COIL', 'SOURCE', 'ANY'),
      pin('A2', 'COIL', 'SINK', 'ANY'),
    ],
    { bmkPrefix: 'K' },
  );

const mainPoles = (count: number): FunctionGroupTemplate => {
  const pins: PinTemplate[] = [];
  for (let pole = 1; pole <= count; pole += 1) {
    const from = pole * 2 - 1;
    const to = pole * 2;
    pins.push(pin(`${from}/L${pole}`, 'NO_CONTACT', 'SOURCE', 'AC_DC'));
    pins.push(pin(`${to}/T${pole}`, 'NO_CONTACT', 'SINK', 'AC_DC'));
  }
  return group(`MAIN_NO_${count}P`, 'NO_CONTACT', 'SWITCHED_PASS_THROUGH', pins);
};

const auxContact = (
  groupKey: string,
  contactType: ContactType,
  from: string,
  to: string,
): FunctionGroupTemplate =>
  group(groupKey, contactType, 'SWITCHED_PASS_THROUGH', [
    pin(from, contactType, 'SOURCE', 'ANY'),
    pin(to, contactType, 'SINK', 'ANY'),
  ]);

/** Die 10 initialen Standard-IEC-Archetypen fuer das globale Seeding. */
export const STANDARD_IEC_ARCHETYPES: readonly IecArchetype[] = [
  archetype(
    'CONTACTOR_3P_1NO',
    'Schuetz 3P + 1S',
    'SWITCHGEAR',
    'Q',
    'DIN_RAIL',
    [coil('COIL_1'), mainPoles(3), auxContact('AUX_NO_1', 'NO_CONTACT', '13', '14')],
  ),
  archetype(
    'CONTACTOR_3P_1NC',
    'Schuetz 3P + 1OE',
    'SWITCHGEAR',
    'Q',
    'DIN_RAIL',
    [coil('COIL_1'), mainPoles(3), auxContact('AUX_NC_1', 'NC_CONTACT', '21', '22')],
  ),
  archetype('MCB_1P', 'Leitungsschutzschalter 1P', 'PROTECTION', 'F', 'DIN_RAIL', [
    mainPoles(1),
  ]),
  archetype('MCB_3P', 'Leitungsschutzschalter 3P', 'PROTECTION', 'F', 'DIN_RAIL', [
    mainPoles(3),
  ]),
  archetype(
    'MSS_3P',
    'Motorschutzschalter 3P',
    'PROTECTION',
    'F',
    'DIN_RAIL',
    [mainPoles(3), auxContact('AUX_NO_1', 'NO_CONTACT', '13', '14')],
  ),
  archetype(
    'TERMINAL_THROUGH_1LVL_2PIN',
    'Reihenklemme Durchgang 1 Ebene 2 Anschluesse',
    'TERMINAL',
    'X',
    'DIN_RAIL',
    [
      group('PASS_1', 'TERMINAL_PASS', 'INTERNAL_BRIDGE', [
        pin('1', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
        pin('2', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
      ]),
    ],
  ),
  archetype(
    'TERMINAL_THROUGH_1LVL_4PIN',
    'Reihenklemme Durchgang 1 Ebene 4 Anschluesse',
    'TERMINAL',
    'X',
    'DIN_RAIL',
    [
      group('PASS_1', 'TERMINAL_PASS', 'INTERNAL_BRIDGE', [
        pin('1', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
        pin('2', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
        pin('3', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
        pin('4', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
      ]),
    ],
  ),
  archetype('TERMINAL_PE_1LVL', 'PE-Klemme 1 Ebene', 'TERMINAL', 'X', 'DIN_RAIL', [
    group('PE_1', 'TERMINAL_PASS', 'POTENTIAL_SINK', [
      pin('PE1', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
      pin('PE2', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
    ]),
  ]),
  archetype('PSU_1AC_24VDC', 'Netzteil 1AC / 24VDC', 'POWER_SUPPLY', 'G', 'DIN_RAIL', [
    group(
      'INPUT_MAINS',
      'TERMINAL_PASS',
      'NONE',
      [
        pin('L', 'TERMINAL_PASS', 'SOURCE', 'AC', { nominalVoltage: 230 }),
        pin('N', 'TERMINAL_PASS', 'SINK', 'AC', { nominalVoltage: 230 }),
        pin('PE', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
      ],
      { bmkPrefix: 'G' },
    ),
    group(
      'OUTPUT_DC',
      'POWER_OUT',
      'ISOLATED_TRANSFORM',
      [
        pin('+24V', 'POWER_OUT', 'SOURCE', 'DC', { nominalVoltage: 24 }),
        pin('0V', 'POWER_OUT', 'SINK', 'DC', { nominalVoltage: 0 }),
      ],
      { bmkPrefix: 'G' },
    ),
  ]),
  archetype('RELAY_COIL_2CO', 'Relais 2 Wechsler', 'SWITCHGEAR', 'K', 'DIN_RAIL', [
    coil('COIL_1', 'ISOLATED_TRANSFORM'),
    group('CO_1', 'CHANGEOVER_CONTACT', 'SWITCHED_PASS_THROUGH', [
      pin('11', 'CHANGEOVER_CONTACT', 'SOURCE', 'ANY'),
      pin('12', 'CHANGEOVER_CONTACT', 'SINK', 'ANY'),
      pin('14', 'CHANGEOVER_CONTACT', 'SINK', 'ANY'),
    ]),
    group('CO_2', 'CHANGEOVER_CONTACT', 'SWITCHED_PASS_THROUGH', [
      pin('21', 'CHANGEOVER_CONTACT', 'SOURCE', 'ANY'),
      pin('22', 'CHANGEOVER_CONTACT', 'SINK', 'ANY'),
      pin('24', 'CHANGEOVER_CONTACT', 'SINK', 'ANY'),
    ]),
  ]),
];

/** Wirft beim Import, falls ein Seed-Archetyp die Zod-Validierung verletzt. */
export function assertArchetypeSeeds(): void {
  for (const seed of STANDARD_IEC_ARCHETYPES) {
    IecArchetypeSchema.parse(seed);
    ArchetypeCategorySchema.parse(seed.category);
  }
}
