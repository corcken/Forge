import type { FieldOrigin } from '@descriptio-forge/shared';

export type HarvestKind = 'series' | 'part' | 'group' | 'pin';

export interface HarvestNode {
  id: string;
  name: string;
  kind: HarvestKind;
  status: string;
  origin: FieldOrigin | null;
  voltage: number | null;
  current: number | null;
  torque: number | null;
  note: string;
  subItems?: HarvestNode[];
}

const pin = (
  id: string,
  name: string,
  origin: FieldOrigin,
  voltage: number | null,
  current: number | null,
  torque: number | null,
): HarvestNode => ({
  id,
  name,
  kind: 'pin',
  status: 'COMPILED',
  origin,
  voltage,
  current,
  torque,
  note: `Pin ${name}`,
});

const group = (
  id: string,
  name: string,
  pins: HarvestNode[],
  note: string,
): HarvestNode => ({
  id,
  name,
  kind: 'group',
  status: 'COMPILED',
  origin: 'ARC',
  voltage: null,
  current: null,
  torque: null,
  note,
  subItems: pins,
});

const part = (
  id: string,
  name: string,
  status: string,
  origin: FieldOrigin,
  groups: HarvestNode[],
  note: string,
): HarvestNode => ({
  id,
  name,
  kind: 'part',
  status,
  origin,
  voltage: null,
  current: null,
  torque: null,
  note,
  subItems: groups,
});

const series = (id: string, name: string, parts: HarvestNode[], note: string): HarvestNode => ({
  id,
  name,
  kind: 'series',
  status: 'VALIDATED',
  origin: 'SER',
  voltage: null,
  current: null,
  torque: null,
  note,
  subItems: parts,
});

/** Demo-Baum (Compiler-/Harvest-Ergebnis) fuer das 24px-Grid in Meilenstein 5. */
export const DEMO_HARVEST_TREE: HarvestNode[] = [
  series('SER_EATON_DILM', 'Eaton DILM7..15', [
    part(
      'P_EATON_DILM7_10',
      'DILM7-10',
      'VALIDATED',
      'AI',
      [
        group(
          'G_DILM7_COIL',
          'COIL_1',
          [pin('PIN_DILM7_A1', 'A1', 'AI', 24, null, null), pin('PIN_DILM7_A2', 'A2', 'AI', 24, null, null)],
          'Spule A1/A2, Nennspannung aus Datenblatt',
        ),
        group(
          'G_DILM7_MAIN',
          'MAIN_NO_3P',
          [
            pin('PIN_DILM7_1', '1/L1', 'ARC', null, 20, 2.5),
            pin('PIN_DILM7_2', '2/T1', 'SER', null, 20, 2.5),
            pin('PIN_DILM7_3', '3/L2', 'ARC', null, 20, 2.5),
            pin('PIN_DILM7_4', '4/T2', 'SER', null, 20, 2.5),
          ],
          'Hauptkontakte 3P, Drehmoment aus Baureihe',
        ),
        group(
          'G_DILM7_AUX',
          'AUX_NO_1',
          [pin('PIN_DILM7_13', '13', 'ARC', null, null, 1.0), pin('PIN_DILM7_14', '14', 'ARC', null, null, 1.0)],
          'Hilfskontakt 1S',
        ),
      ],
      '14 Felder AI | 5 Felder Serie | 8 Pins Archetyp',
    ),
    part(
      'P_EATON_DILM9_10',
      'DILM9-10',
      'ERROR',
      'AI',
      [
        group(
          'G_DILM9_COIL',
          'COIL_1',
          [pin('PIN_DILM9_A1', 'A1', 'AI', null, null, null), pin('PIN_DILM9_A2', 'A2', 'AI', null, null, null)],
          'ERC-Warnung: Nennspannung der Spule fehlt',
        ),
      ],
      'Spule ohne Nennspannung -> Validierungsfehler',
    ),
  ], 'Baureihe Eaton DILM7..15'),
  series('SER_WEIDMUELLER_WDU', 'Weidmueller WDU', [
    part(
      'P_WDU_2_5',
      'WDU 2.5',
      'VALIDATED',
      'AI',
      [
        group(
          'G_WDU_2_5_PASS',
          'PASS_1',
          [
            pin('PIN_WDU_1', '1', 'ARC', null, 24, null),
            pin('PIN_WDU_2', '2', 'HEU', null, 24, null),
            pin('PIN_WDU_3', '3', 'MAN', null, 24, null),
            pin('PIN_WDU_4', '4', 'ARC', null, 24, null),
          ],
          'Durchgangsklemme 4 Anschluesse, 3D-Offsets heuristisch',
        ),
      ],
      'Vom Nutzer fixierter Wert (MAN, schreibgeschuetzt)',
    ),
  ], 'Baureihe Weidmueller WDU'),
];
