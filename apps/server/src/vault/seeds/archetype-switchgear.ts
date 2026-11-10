import type {
  ArchetypeCategory,
  IecArchetype,
  MountingType,
} from '@descriptio-forge/shared';
import {
  archetype,
  AUX_COMBOS_COMPACT,
  AUX_COMBOS_FULL,
  buildAuxGroups,
  coil,
  formatAuxLabel,
  group,
  mainPoleGroups,
  pin,
  type AuxCombo,
} from './archetype-builders.js';

function symbolForPrefix(prefix: string): string {
  if (prefix === 'MAIN_SWITCH') return 'SYM_DISCONNECTOR_POLE';
  if (prefix === 'MSS') return 'SYM_MSS_POLE';
  if (['MCCB', 'MCB', 'RCBO'].includes(prefix)) return 'SYM_CB_POLE';
  if (prefix === 'RCD') return 'SYM_RCD_POLE';
  if (prefix === 'OVERLOAD_RELAY') return 'SYM_OVERLOAD_THERMAL_POLE';
  if (prefix === 'FUSE_HOLDER') return 'SYM_FUSE_POLE';
  if (prefix === 'SPD') return 'SYM_SPD_POLE';
  return 'SYM_SWITCH_POLE';
}

function expandPoleFamily(params: {
  prefix: string;
  labelPrefix: string;
  category: ArchetypeCategory;
  bmk: string;
  mount: MountingType;
  poles: readonly string[];
  auxCombos: readonly AuxCombo[];
  withCoil?: boolean;
}): IecArchetype[] {
  const result: IecArchetype[] = [];
  const symbolId = symbolForPrefix(params.prefix);
  for (const poleSpec of params.poles) {
    const poleLabel = poleSpec.replace('_N', '+N');
    for (const combo of params.auxCombos) {
      const { idSuffix, nameSuffix } = formatAuxLabel(combo);
      const groups = [
        ...(params.withCoil ? [coil('COIL_1', params.bmk)] : []),
        ...mainPoleGroups(poleSpec, symbolId),
        ...buildAuxGroups(combo),
      ];
      result.push(
        archetype(
          `${params.prefix}_${poleSpec}${idSuffix}`,
          `${params.labelPrefix} ${poleLabel}${nameSuffix}`,
          params.category,
          params.bmk,
          params.mount,
          groups,
        ),
      );
    }
  }
  return result;
}

/** Generiert alle Starkstrom-, Schalt- und Schutzgeraete-Archetypen (~290 Stueck). */
export function buildSwitchgearAndProtectionArchetypes(): IecArchetype[] {
  const list: IecArchetype[] = [];

  // 1. Hauptschalter / Lasttrennschalter / Nockenschalter (MAIN_SWITCH_*)
  list.push(
    ...expandPoleFamily({
      prefix: 'MAIN_SWITCH',
      labelPrefix: 'Hauptschalter',
      category: 'SWITCHGEAR',
      bmk: 'Q',
      mount: 'DIN_RAIL',
      poles: ['1P', '2P', '3P', '3P_N', '4P', '6P'],
      auxCombos: AUX_COMBOS_FULL,
    }),
  );

  // 2. Leistungsschuetze 2P, 3P & 4P (CONTACTOR_*)
  list.push(
    ...expandPoleFamily({
      prefix: 'CONTACTOR',
      labelPrefix: 'Schuetz',
      category: 'SWITCHGEAR',
      bmk: 'Q',
      mount: 'DIN_RAIL',
      poles: ['2P', '3P', '4P'],
      auxCombos: AUX_COMBOS_FULL,
      withCoil: true,
    }),
  );

  // 3. Hilfsschuetze / Steuerrelais (AUX_CONTACTOR_*)
  const auxContactorCombos: readonly AuxCombo[] = [
    { no: 4, nc: 0 }, { no: 3, nc: 1 }, { no: 2, nc: 2 }, { no: 1, nc: 3 }, { no: 0, nc: 4 },
    { no: 2, nc: 0 }, { no: 1, nc: 1 }, { no: 4, nc: 4 }, { no: 6, nc: 2 }, { no: 5, nc: 3 },
    { no: 3, nc: 5 }, { no: 2, nc: 6 },
  ];
  for (const combo of auxContactorCombos) {
    const { idSuffix, nameSuffix } = formatAuxLabel(combo);
    list.push(
      archetype(
        `AUX_CONTACTOR${idSuffix}`,
        `Hilfsschuetz${nameSuffix}`,
        'SWITCHGEAR',
        'K',
        'DIN_RAIL',
        [coil('COIL_1', 'K'), ...buildAuxGroups(combo)],
      ),
    );
  }

  // 4. Motorschutzschalter (MSS_*) & Kompaktleistungsschalter (MCCB_*)
  list.push(
    ...expandPoleFamily({
      prefix: 'MSS',
      labelPrefix: 'Motorschutzschalter',
      category: 'PROTECTION',
      bmk: 'Q',
      mount: 'DIN_RAIL',
      poles: ['3P'],
      auxCombos: AUX_COMBOS_FULL,
    }),
    ...expandPoleFamily({
      prefix: 'MCCB',
      labelPrefix: 'Leistungsschalter',
      category: 'PROTECTION',
      bmk: 'Q',
      mount: 'MOUNTING_PLATE',
      poles: ['3P', '4P'],
      auxCombos: AUX_COMBOS_COMPACT,
    }),
  );

  // 5. Thermische / Elektronische Ueberlastrelais (OVERLOAD_RELAY_*)
  list.push(
    ...expandPoleFamily({
      prefix: 'OVERLOAD_RELAY',
      labelPrefix: 'Ueberlastrelais',
      category: 'PROTECTION',
      bmk: 'F',
      mount: 'DIN_RAIL',
      poles: ['3P'],
      auxCombos: [
        { no: 0, nc: 0 }, { no: 1, nc: 1 }, { no: 1, nc: 0 }, { no: 0, nc: 1 },
        { no: 0, nc: 0, co: 1 }, { no: 2, nc: 1 }, { no: 1, nc: 2 },
      ],
    }),
  );

  // 6. Leitungsschutzschalter (MCB_*), FI (RCD_*), FI/LS (RCBO_*)
  list.push(
    ...expandPoleFamily({
      prefix: 'MCB',
      labelPrefix: 'Leitungsschutzschalter',
      category: 'PROTECTION',
      bmk: 'F',
      mount: 'DIN_RAIL',
      poles: ['1P', '1P_N', '2P', '3P', '3P_N', '4P'],
      auxCombos: AUX_COMBOS_COMPACT,
    }),
    ...expandPoleFamily({
      prefix: 'RCD',
      labelPrefix: 'FI-Schutzschalter',
      category: 'PROTECTION',
      bmk: 'F',
      mount: 'DIN_RAIL',
      poles: ['2P', '3P_N', '4P'],
      auxCombos: AUX_COMBOS_COMPACT,
    }),
    ...expandPoleFamily({
      prefix: 'RCBO',
      labelPrefix: 'FI/LS-Schalter',
      category: 'PROTECTION',
      bmk: 'F',
      mount: 'DIN_RAIL',
      poles: ['1P_N', '2P', '3P_N', '4P'],
      auxCombos: AUX_COMBOS_COMPACT,
    }),
  );

  // 7. Sicherungshalter / Sicherungslasttrennschalter (FUSE_HOLDER_*) & SPD (SPD_*)
  list.push(
    ...expandPoleFamily({
      prefix: 'FUSE_HOLDER',
      labelPrefix: 'Sicherungshalter',
      category: 'PROTECTION',
      bmk: 'F',
      mount: 'DIN_RAIL',
      poles: ['1P', '1P_N', '2P', '3P', '3P_N', '4P'],
      auxCombos: [{ no: 0, nc: 0 }, { no: 1, nc: 0 }, { no: 1, nc: 1 }, { no: 0, nc: 0, co: 1 }],
    }),
    ...expandPoleFamily({
      prefix: 'SPD',
      labelPrefix: 'Ueberspannungsableiter',
      category: 'PROTECTION',
      bmk: 'F',
      mount: 'DIN_RAIL',
      poles: ['1P', '2P', '3P', '3P_N', '4P'],
      auxCombos: [{ no: 0, nc: 0 }, { no: 0, nc: 0, co: 1 }],
    }),
  );

  // 8. Sanftstarter (SOFT_STARTER_*) & Frequenzumrichter (VFD_*)
  for (const supply of ['1AC', '3AC'] as const) {
    for (const combo of [{ no: 0, nc: 0 }, { no: 1, nc: 0 }, { no: 1, nc: 1 }, { no: 2, nc: 0 }, { no: 0, nc: 0, co: 1 }]) {
      const { idSuffix, nameSuffix } = formatAuxLabel(combo);
      const supplyPins =
        supply === '1AC'
          ? [pin('L1', 'TERMINAL_PASS', 'SOURCE', 'AC'), pin('N', 'TERMINAL_PASS', 'SINK', 'AC'), pin('PE', 'TERMINAL_PASS', 'REFERENCE', 'ANY')]
          : [pin('L1', 'TERMINAL_PASS', 'SOURCE', 'AC'), pin('L2', 'TERMINAL_PASS', 'SOURCE', 'AC'), pin('L3', 'TERMINAL_PASS', 'SOURCE', 'AC'), pin('PE', 'TERMINAL_PASS', 'REFERENCE', 'ANY')];
      const motorPins = [
        pin('U/T1', 'POWER_OUT', 'SOURCE', 'AC'),
        pin('V/T2', 'POWER_OUT', 'SOURCE', 'AC'),
        pin('W/T3', 'POWER_OUT', 'SOURCE', 'AC'),
      ];
      list.push(
        archetype(
          `VFD_${supply}_3P${idSuffix}`,
          `Frequenzumrichter ${supply} -> 3AC${nameSuffix}`,
          'SWITCHGEAR',
          'T',
          'MOUNTING_PLATE',
          [
            group('MAINS_IN', 'TERMINAL_PASS', 'NONE', supplyPins, { symbolDefinitionId: 'SYM_TERMINAL_PASS' }),
            group('MOTOR_OUT', 'POWER_OUT', 'ISOLATED_TRANSFORM', motorPins, { symbolDefinitionId: 'SYM_VFD_POWER' }),
            ...buildAuxGroups(combo),
          ],
        ),
        archetype(
          `SOFT_STARTER_${supply}_3P${idSuffix}`,
          `Sanftstarter ${supply}${nameSuffix}`,
          'SWITCHGEAR',
          'Q',
          'DIN_RAIL',
          [...mainPoleGroups('3P'), ...buildAuxGroups(combo)],
        ),
      );
    }
  }

  return list;
}
