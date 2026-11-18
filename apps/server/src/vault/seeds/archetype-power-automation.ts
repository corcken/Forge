import type { IecArchetype, PinTemplate } from '@descriptio-forge/shared';
import {
  archetype,
  buildAuxGroups,
  formatAuxLabel,
  group,
  mainPoleGroups,
  pin,
  type AuxCombo,
} from './archetype-builders.js';

/** Generiert Netzteile, Trafos, Befehlsgeraete, Sensoren, SPS, Kabel & Mechanik (~125 Stueck). */
export function buildPowerPilotPlcAndCables(): IecArchetype[] {
  const list: IecArchetype[] = [];

  // 1. Netzteile, DC/DC-Wandler, Steuertrafos, Elektronischer Schutzschalter
  for (const input of ['1AC', '2AC', '3AC', 'DC'] as const) {
    for (const outV of [5, 12, 24, 48] as const) {
      for (const ch of [1, 2, 4] as const) {
        const suffix = ch === 1 ? '' : `_${ch}CH`;
        const inPins =
          input === '3AC'
            ? [
                pin('L1', 'TERMINAL_PASS', 'SOURCE', 'AC'),
                pin('L2', 'TERMINAL_PASS', 'SOURCE', 'AC'),
                pin('L3', 'TERMINAL_PASS', 'SOURCE', 'AC'),
                pin('PE', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
              ]
            : [
                pin('L', 'TERMINAL_PASS', 'SOURCE', input === 'DC' ? 'DC' : 'AC'),
                pin('N', 'TERMINAL_PASS', 'SINK', input === 'DC' ? 'DC' : 'AC'),
                pin('PE', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
              ];
        const outPins: PinTemplate[] = [];
        for (let c = 1; c <= ch; c += 1) {
          outPins.push(pin(`+${outV}V_${c}`, 'POWER_OUT', 'SOURCE', 'DC', { nominalVoltage: outV }));
          outPins.push(pin(`0V_${c}`, 'POWER_OUT', 'SINK', 'DC', { nominalVoltage: 0 }));
        }
        list.push(
          archetype(
            `PSU_${input}_${outV}VDC${suffix}`,
            `Netzteil ${input} / ${outV}VDC (${ch} Kanal)`,
            'POWER_SUPPLY',
            'G',
            'DIN_RAIL',
            [
              group('INPUT_MAINS', 'TERMINAL_PASS', 'NONE', inPins, { bmkPrefix: 'G', symbolDefinitionId: 'SYM_PSU_INPUT' }),
              group('OUTPUT_DC', 'POWER_OUT', 'ISOLATED_TRANSFORM', outPins, { bmkPrefix: 'G', symbolDefinitionId: 'SYM_PSU_OUTPUT' }),
            ],
          ),
        );
      }
    }
  }

  list.push(
    archetype('TRANSFORMER_1P', 'Steuer-/Trenntransformator 1AC', 'POWER_SUPPLY', 'T', 'MOUNTING_PLATE', [
      group('PRIMARY', 'TERMINAL_PASS', 'NONE', [
        pin('L1', 'TERMINAL_PASS', 'SOURCE', 'AC', { nominalVoltage: 400 }),
        pin('N', 'TERMINAL_PASS', 'SINK', 'AC', { nominalVoltage: 230 }),
        pin('PE', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
      ], { symbolDefinitionId: 'SYM_TRANSFORMER_WINDING' }),
      group('SECONDARY', 'POWER_OUT', 'ISOLATED_TRANSFORM', [
        pin('U1', 'POWER_OUT', 'SOURCE', 'AC', { nominalVoltage: 230 }),
        pin('U2', 'POWER_OUT', 'SINK', 'AC', { nominalVoltage: 0 }),
      ], { symbolDefinitionId: 'SYM_TRANSFORMER_WINDING' }),
    ]),
    archetype('TRANSFORMER_3P', 'Transformator 3AC', 'POWER_SUPPLY', 'T', 'MOUNTING_PLATE', [
      group('PRIMARY', 'TERMINAL_PASS', 'NONE', [
        pin('1U', 'TERMINAL_PASS', 'SOURCE', 'AC'),
        pin('1V', 'TERMINAL_PASS', 'SOURCE', 'AC'),
        pin('1W', 'TERMINAL_PASS', 'SOURCE', 'AC'),
        pin('PE', 'TERMINAL_PASS', 'REFERENCE', 'ANY'),
      ], { symbolDefinitionId: 'SYM_TRANSFORMER_WINDING' }),
      group('SECONDARY', 'POWER_OUT', 'ISOLATED_TRANSFORM', [
        pin('2U', 'POWER_OUT', 'SOURCE', 'AC'),
        pin('2V', 'POWER_OUT', 'SOURCE', 'AC'),
        pin('2W', 'POWER_OUT', 'SOURCE', 'AC'),
        pin('2N', 'POWER_OUT', 'SINK', 'AC'),
      ], { symbolDefinitionId: 'SYM_TRANSFORMER_WINDING' }),
    ]),
  );

  for (const ch of [1, 2, 4, 6, 8]) {
    const pins: PinTemplate[] = [
      pin('+24V_IN', 'TERMINAL_PASS', 'SOURCE', 'DC'),
      pin('0V', 'TERMINAL_PASS', 'REFERENCE', 'DC'),
    ];
    for (let c = 1; c <= ch; c += 1) pins.push(pin(`OUT_${c}`, 'POWER_OUT', 'SOURCE', 'DC'));
    list.push(
      archetype(
        `CB_ELECTRONIC_24VDC_${ch}CH`,
        `Elektronischer Schutzschalter 24VDC ${ch}-Kanal`,
        'POWER_SUPPLY',
        'F',
        'DIN_RAIL',
        [group('CHANNELS', 'POWER_OUT', 'SWITCHED_PASS_THROUGH', pins, { symbolDefinitionId: 'SYM_CB_POLE' })],
      ),
    );
  }

  // 2. Befehls- & Meldegeraete (PILOT_*)
  const pilotCombos: readonly AuxCombo[] = [
    { no: 1, nc: 0 }, { no: 0, nc: 1 }, { no: 1, nc: 1 }, { no: 2, nc: 0 },
    { no: 0, nc: 2 }, { no: 2, nc: 1 }, { no: 1, nc: 2 }, { no: 2, nc: 2 },
  ];
  const ledGroup = group('LED_1', 'COIL', 'POTENTIAL_SINK', [
    pin('X1', 'COIL', 'SOURCE', 'AC_DC', { nominalVoltage: 24 }),
    pin('X2', 'COIL', 'SINK', 'AC_DC', { nominalVoltage: 24 }),
  ], { symbolDefinitionId: 'SYM_LED_INDICATOR' });
  for (const combo of pilotCombos) {
    const { idSuffix, nameSuffix } = formatAuxLabel(combo);
    const pilotAux = buildAuxGroups(combo, { no: 'SYM_PUSHBUTTON_NO', nc: 'SYM_PUSHBUTTON_NC' });
    list.push(
      archetype(`PILOT${idSuffix}`, `Befehlsgeraet / Taster${nameSuffix}`, 'SWITCHGEAR', 'S', 'DOOR', pilotAux),
      archetype(`PILOT${idSuffix}_LED`, `Leuchtdrucktaster${nameSuffix} + LED`, 'SWITCHGEAR', 'S', 'DOOR', [...pilotAux, ledGroup]),
    );
  }
  list.push(
    archetype('PILOT_LED_ONLY', 'Leuchtmelder LED', 'SWITCHGEAR', 'P', 'DOOR', [ledGroup]),
    archetype('PILOT_ACTUATOR_ONLY', 'Befehlsgeraet Frontelement (ohne Kontakte)', 'SWITCHGEAR', 'S', 'DOOR', []),
    archetype('PILOT_ACTUATOR_LED', 'Leuchtwahltaste / Frontelement mit LED', 'SWITCHGEAR', 'S', 'DOOR', [ledGroup]),
  );

  // 3. Sensoren, Positionsschalter, Druckwaechter & SPS-Baugruppen
  list.push(
    archetype('PRESSURE_SWITCH_3P', 'Druckwaechter 3-polig', 'SWITCHGEAR', 'B', 'MOUNTING_PLATE', mainPoleGroups('3P', 'SYM_PRESSURE_NO')),
    archetype('PRESSURE_SWITCH_1NO_1NC', 'Druckwaechter 1S + 1OE', 'SWITCHGEAR', 'B', 'MOUNTING_PLATE', buildAuxGroups({ no: 1, nc: 1 }, { no: 'SYM_PRESSURE_NO', nc: 'SYM_PRESSURE_NC' })),
    archetype('POSITION_SWITCH_1NO_1NC', 'Positionsschalter / Sicherheitsschalter 1S + 1OE', 'SWITCHGEAR', 'B', 'MOUNTING_PLATE', buildAuxGroups({ no: 1, nc: 1 }, { no: 'SYM_LIMIT_NO', nc: 'SYM_LIMIT_NC' })),
    archetype('POSITION_SWITCH_2NC', 'Sicherheitspositionsschalter 2OE', 'SWITCHGEAR', 'B', 'MOUNTING_PLATE', buildAuxGroups({ no: 0, nc: 2 }, { no: 'SYM_LIMIT_NO', nc: 'SYM_LIMIT_NC' })),
    archetype('POSITION_SWITCH_1NO_2NC', 'Sicherheitspositionsschalter 1S + 2OE', 'SWITCHGEAR', 'B', 'MOUNTING_PLATE', buildAuxGroups({ no: 1, nc: 2 }, { no: 'SYM_LIMIT_NO', nc: 'SYM_LIMIT_NC' })),
  );
  for (const sType of [
    '3WIRE_PNP_NO', '3WIRE_PNP_NC', '3WIRE_NPN_NO', '3WIRE_NPN_NC',
    '4WIRE_PNP_NO_NC', '4WIRE_NPN_NO_NC', '2WIRE_NO', '2WIRE_NC',
    'ANALOG_4_20MA', 'ANALOG_0_10V', 'PT100_2WIRE', 'PT100_4WIRE',
  ]) {
    list.push(
      archetype(`SENSOR_${sType}`, `Sensor ${sType}`, 'PLC', 'B', 'MOUNTING_PLATE', [
        group('SENSOR_IO', 'POWER_OUT', 'NONE', [
          pin('BN/+', 'TERMINAL_PASS', 'SOURCE', 'DC'),
          pin('BU/-', 'TERMINAL_PASS', 'SINK', 'DC'),
          pin('BK/OUT', 'POWER_OUT', 'SOURCE', 'DC'),
        ], { symbolDefinitionId: 'SYM_SENSOR_PROXIMITY' }),
      ]),
    );
  }

  for (const ioKind of ['DI', 'DO', 'AI', 'AO'] as const) {
    const plcSym = `SYM_PLC_${ioKind}`;
    for (const ch of [2, 4, 8, 16, 32]) {
      const pins: PinTemplate[] = [];
      for (let c = 1; c <= ch; c += 1) {
        pins.push(pin(`${ioKind}_${c}`, ioKind.endsWith('O') ? 'POWER_OUT' : 'TERMINAL_PASS', 'BIDIRECTIONAL', 'DC'));
      }
      list.push(
        archetype(`PLC_${ioKind}_${ch}CH`, `SPS-Modul ${ioKind} ${ch}-Kanal`, 'PLC', 'K', 'DIN_RAIL', [
          group(`${ioKind}_GROUP`, 'TERMINAL_PASS', 'NONE', pins, { symbolDefinitionId: plcSym }),
        ]),
      );
    }
  }
  const dcSupplyGroup = group('SUPPLY_24VDC', 'COIL', 'POTENTIAL_SINK', [
    pin('+24V', 'COIL', 'SOURCE', 'DC', { nominalVoltage: 24 }),
    pin('0V', 'COIL', 'SINK', 'DC', { nominalVoltage: 0 }),
  ], { symbolDefinitionId: 'SYM_COIL_STD' });
  list.push(
    archetype('HMI_PANEL_24DC', 'Bedienpanel / Touchpanel 24VDC', 'PLC', 'P', 'DOOR', [dcSupplyGroup]),
    archetype('PLC_COMPACT_24DC', 'Kompakt-SPS / Steuerrelais 24VDC', 'PLC', 'K', 'DIN_RAIL', [
      dcSupplyGroup,
      ...buildAuxGroups({ no: 4, nc: 0 }),
    ]),
    archetype('PLC_COMM_MODULE', 'Kommunikations- / Feldbusmodul', 'PLC', 'K', 'DIN_RAIL', [dcSupplyGroup]),
    archetype('PLC_BASE_MODULE', 'SPS-Basismodul / Klemmentraeger', 'PLC', 'K', 'DIN_RAIL', []),
  );

  // 4. Ausloeser, Antriebe, Steckverbinder, Sammelschienen & Mechanik
  for (const cores of [2, 3, 4, 5, 7, 8, 12, 16, 24]) {
    const pins: PinTemplate[] = [];
    for (let c = 1; c <= cores; c += 1) pins.push(pin(`${c}`, 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'));
    list.push(
      archetype(`PLUG_${cores}P`, `Steckverbinder ${cores}-polig`, 'CABLE', 'X', 'MOUNTING_PLATE', [
        group('PLUG_1', 'TERMINAL_PASS', 'INTERNAL_BRIDGE', pins, { symbolDefinitionId: 'SYM_PLUG_PIN' }),
      ]),
    );
  }

  list.push(
    archetype('RELEASE_COIL_SHUNT', 'Arbeitsstromausloeser / Ersatzspule', 'SWITCHGEAR', 'Q', 'DIN_RAIL', [
      group('COIL_SHUNT', 'COIL', 'POTENTIAL_SINK', [
        pin('C1', 'COIL', 'SOURCE', 'AC_DC', { nominalVoltage: 24 }),
        pin('C2', 'COIL', 'SINK', 'AC_DC', { nominalVoltage: 0 }),
      ], { symbolDefinitionId: 'SYM_COIL_SHUNT' }),
    ]),
    archetype('RELEASE_COIL_UV', 'Unterspannungsausloeser', 'SWITCHGEAR', 'Q', 'DIN_RAIL', [
      group('COIL_UV', 'COIL', 'POTENTIAL_SINK', [
        pin('D1', 'COIL', 'SOURCE', 'AC_DC', { nominalVoltage: 230 }),
        pin('D2', 'COIL', 'SINK', 'AC_DC', { nominalVoltage: 0 }),
      ], { symbolDefinitionId: 'SYM_COIL_UV' }),
    ]),
    archetype('MOTOR_OPERATOR_2PIN', 'Motorantrieb / Fernantrieb', 'SWITCHGEAR', 'M', 'MOUNTING_PLATE', [
      group('MOTOR_M', 'COIL', 'POTENTIAL_SINK', [
        pin('M1', 'COIL', 'SOURCE', 'DC', { nominalVoltage: 24 }),
        pin('M2', 'COIL', 'SINK', 'DC', { nominalVoltage: 0 }),
      ], { symbolDefinitionId: 'SYM_MOTOR_OPERATOR' }),
    ]),
    archetype('FUSE_LINK_1P', 'Sicherungseinsatz / Schmelzeinsatz', 'PROTECTION', 'F', 'DIN_RAIL', [
      group('FUSE_1', 'TERMINAL_PASS', 'SWITCHED_PASS_THROUGH', [
        pin('1', 'TERMINAL_PASS', 'SOURCE', 'AC_DC'),
        pin('2', 'TERMINAL_PASS', 'SINK', 'AC_DC'),
      ], { symbolDefinitionId: 'SYM_FUSE_POLE' }),
    ]),
    archetype('DATA_CABLE', 'Daten- / Glasfaser- / Sensorleitung', 'CABLE', 'W', 'MOUNTING_PLATE', []),
    archetype('BUSBAR_TERMINAL_1P', 'Sammelschienenklemme 1-polig', 'TERMINAL', 'X', 'DIN_RAIL', [
      group('PASS_1', 'TERMINAL_PASS', 'INTERNAL_BRIDGE', [
        pin('1', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
        pin('2', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
      ], { symbolDefinitionId: 'SYM_BUSBAR_PASS' }),
    ]),
    archetype('BUSBAR_3P', 'Sammelschiene / Phasenschiene 3-polig', 'TERMINAL', 'W', 'DIN_RAIL', [
      group('BUS_3P', 'TERMINAL_PASS', 'INTERNAL_BRIDGE', [
        pin('L1', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'AC'),
        pin('L2', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'AC'),
        pin('L3', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'AC'),
      ], { symbolDefinitionId: 'SYM_BUSBAR_PASS' }),
    ]),
    archetype('SURGE_SUPPRESSOR_2PIN', 'Schutzbeschaltung / Varistor / RC-Glied', 'PROTECTION', 'F', 'DIN_RAIL', [
      group('SUPP_1', 'TERMINAL_PASS', 'POTENTIAL_SINK', [
        pin('A1', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
        pin('A2', 'TERMINAL_PASS', 'BIDIRECTIONAL', 'ANY'),
      ], { symbolDefinitionId: 'SYM_SPD_POLE' }),
    ]),
    archetype('ENCLOSURE_EMPTY', 'Leergehaeuse / Schaltschrankgehaeuse', 'SWITCHGEAR', 'U', 'MOUNTING_PLATE', []),
    archetype('MECHANICAL_ACCESSORY', 'Mechanisches Zubehoer / Montagebauteil', 'SWITCHGEAR', 'U', 'MOUNTING_PLATE', []),
  );

  return list;
}
