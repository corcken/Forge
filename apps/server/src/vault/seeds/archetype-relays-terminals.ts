import type {
  FunctionGroupTemplate,
  IecArchetype,
  PinTemplate,
} from '@descriptio-forge/shared';
import {
  archetype,
  buildAuxGroups,
  coil,
  formatAuxLabel,
  group,
  pin,
  type AuxCombo,
} from './archetype-builders.js';
import { buildPowerPilotPlcAndCables } from './archetype-power-automation.js';

function buildRelaysAndAuxBlocks(): IecArchetype[] {
  const list: IecArchetype[] = [];

  const relayFamilies = [
    { prefix: 'RELAY_COIL', label: 'Relais' },
    { prefix: 'TIME_RELAY', label: 'Zeitrelais' },
    { prefix: 'SAFETY_RELAY', label: 'Sicherheitsrelais' },
    { prefix: 'MONITOR_RELAY', label: 'Ueberwachungsrelais' },
  ] as const;
  const relayCombos: readonly AuxCombo[] = [
    { no: 0, nc: 0, co: 1 },
    { no: 0, nc: 0, co: 2 },
    { no: 0, nc: 0, co: 3 },
    { no: 0, nc: 0, co: 4 },
    { no: 1, nc: 0 },
    { no: 2, nc: 0 },
    { no: 1, nc: 1 },
    { no: 2, nc: 1 },
    { no: 2, nc: 2 },
    { no: 3, nc: 1 },
    { no: 4, nc: 0 },
    { no: 4, nc: 1 },
    { no: 4, nc: 2 },
  ];
  for (const fam of relayFamilies) {
    const coilSym =
      fam.prefix === 'TIME_RELAY'
        ? 'SYM_COIL_MULTIFUNC'
        : fam.prefix === 'SAFETY_RELAY'
          ? 'SYM_SAFETY_RELAY_COIL'
          : 'SYM_COIL_STD';
    const auxSyms =
      fam.prefix === 'TIME_RELAY'
        ? { no: 'SYM_NO_DELAY_ON', nc: 'SYM_NC_DELAY_ON' }
        : undefined;
    for (const combo of relayCombos) {
      const { idSuffix, nameSuffix } = formatAuxLabel(combo);
      list.push(
        archetype(
          `${fam.prefix}${idSuffix}`,
          `${fam.label}${nameSuffix}`,
          'SWITCHGEAR',
          'K',
          'DIN_RAIL',
          [coil('COIL_1', 'K', 'ANY', coilSym), ...buildAuxGroups(combo, auxSyms)],
        ),
      );
    }
  }

  for (let no = 0; no <= 4; no += 1) {
    for (let nc = 0; nc <= 4; nc += 1) {
      if (no === 0 && nc === 0) continue;
      if (no + nc > 6) continue;
      const { idSuffix, nameSuffix } = formatAuxLabel({ no, nc });
      list.push(
        archetype(
          `AUX_BLOCK${idSuffix}`,
          `Hilfsschalterblock${nameSuffix}`,
          'SWITCHGEAR',
          'Q',
          'DIN_RAIL',
          buildAuxGroups({ no, nc }),
        ),
      );
    }
  }
  for (const co of [1, 2]) {
    list.push(
      archetype(
        `AUX_BLOCK_${co}CO`,
        `Hilfsschalterblock + ${co}W`,
        'SWITCHGEAR',
        'Q',
        'DIN_RAIL',
        buildAuxGroups({ no: 0, nc: 0, co }),
      ),
    );
  }

  return list;
}

function buildTerminals(): IecArchetype[] {
  const list: IecArchetype[] = [];

  for (const levels of [1, 2, 3, 4]) {
    for (const pinsPerLevel of [2, 3, 4, 6]) {
      const groups: FunctionGroupTemplate[] = [];
      for (let lvl = 1; lvl <= levels; lvl += 1) {
        const pins: PinTemplate[] = [];
        for (let p = 1; p <= pinsPerLevel; p += 1) {
          const name = levels === 1 ? `${p}` : `${lvl}.${p}`;
          pins.push(pin(name, 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'));
        }
        groups.push(group(`PASS_${lvl}`, 'TERMINAL_PASS', 'INTERNAL_BRIDGE', pins, { symbolDefinitionId: 'SYM_TERMINAL_PASS' }));
      }
      list.push(
        archetype(
          `TERMINAL_THROUGH_${levels}LVL_${pinsPerLevel}PIN`,
          `Reihenklemme Durchgang ${levels} Ebene(n) ${pinsPerLevel} Anschluesse`,
          'TERMINAL',
          'X',
          'DIN_RAIL',
          groups,
        ),
      );
    }
  }

  list.push(
    archetype('TERMINAL_PE_1LVL', 'PE-Klemme 1 Ebene', 'TERMINAL', 'X', 'DIN_RAIL', [
      group('PE_1', 'TERMINAL_PASS', 'POTENTIAL_SINK', [
        pin('PE1', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
        pin('PE2', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
      ], { symbolDefinitionId: 'SYM_TERMINAL_PE' }),
    ]),
  );
  for (const levels of [1, 2, 3]) {
    for (const pinsCount of [2, 3, 4]) {
      const pins: PinTemplate[] = [];
      for (let p = 1; p <= pinsCount; p += 1) {
        pins.push(pin(`PE${p}`, 'TERMINAL_PASS', 'REFERENCE', 'ANY'));
      }
      list.push(
        archetype(
          `TERMINAL_PE_${levels}LVL_${pinsCount}PIN`,
          `PE-Klemme ${levels} Ebene(n) ${pinsCount} Anschluesse`,
          'TERMINAL',
          'X',
          'DIN_RAIL',
          [group('PE_1', 'TERMINAL_PASS', 'POTENTIAL_SINK', pins, { symbolDefinitionId: 'SYM_TERMINAL_PE' })],
        ),
      );
    }
  }

  const specialTypes = [
    { key: 'N', label: 'Neutralleiterklemme' },
    { key: 'FUSE', label: 'Sicherungsklemme' },
    { key: 'DISCONNECT', label: 'Trennklemme' },
    { key: 'SENSOR', label: 'Initiatorenklemme' },
    { key: 'DIODE', label: 'Diodenklemme' },
  ] as const;
  for (const spec of specialTypes) {
    const symId =
      spec.key === 'DISCONNECT'
        ? 'SYM_TERMINAL_DISCONNECT'
        : spec.key === 'FUSE'
          ? 'SYM_FUSE_TERMINAL'
          : spec.key === 'N'
            ? 'SYM_N_DISCONNECT_TERMINAL'
            : spec.key === 'DIODE'
              ? 'SYM_DIODE_TERMINAL'
              : 'SYM_TERMINAL_PASS';
    for (const levels of [1, 2, 3]) {
      for (const pinsCount of [2, 3, 4]) {
        const pins: PinTemplate[] = [];
        for (let p = 1; p <= pinsCount; p += 1) {
          pins.push(pin(`${p}`, 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'));
        }
        list.push(
          archetype(
            `TERMINAL_${spec.key}_${levels}LVL_${pinsCount}PIN`,
            `${spec.label} ${levels} Ebene(n) ${pinsCount} Anschluesse`,
            'TERMINAL',
            'X',
            'DIN_RAIL',
            [group(`${spec.key}_1`, 'TERMINAL_PASS', 'INTERNAL_BRIDGE', pins, { symbolDefinitionId: symId })],
          ),
        );
      }
    }
  }

  for (const count of [4, 6, 8, 12, 16]) {
    const pins: PinTemplate[] = [];
    for (let p = 1; p <= count; p += 1) {
      pins.push(pin(`${p}`, 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'));
    }
    list.push(
      archetype(
        `TERMINAL_DIST_1LVL_${count}PIN`,
        `Potenzialverteilerklemme ${count} Anschluesse`,
        'TERMINAL',
        'X',
        'DIN_RAIL',
        [group('DIST_1', 'TERMINAL_PASS', 'INTERNAL_BRIDGE', pins, { symbolDefinitionId: 'SYM_TERMINAL_PASS' })],
      ),
    );
  }

  return list;
}

/** Generiert alle Relais-, Klemmen-, Netzteil-, Sensor- und SPS-Archetypen (~290 Stueck). */
export function buildRelaysTerminalsAndAutomationArchetypes(): IecArchetype[] {
  return [
    ...buildRelaysAndAuxBlocks(),
    ...buildTerminals(),
    ...buildPowerPilotPlcAndCables(),
  ];
}
