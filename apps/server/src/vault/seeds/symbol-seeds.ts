import type { SymbolDefinition } from '@descriptio-forge/shared';
import { AUTOMATION_AND_TERMINAL_SYMBOLS } from './symbol-seeds-automation.js';
import { COIL_AND_POWER_SYMBOLS } from './symbol-seeds-coils-power.js';
import { CONTACT_AND_SWITCH_SYMBOLS } from './symbol-seeds-contacts.js';
import { SENSORS_METERS_AND_ACTUATOR_SYMBOLS } from './symbol-seeds-sensors-meters.js';

/**
 * Gesamtheit aller kanonischen IEC 60617 E-CAD Symbole fuer die 643 Archetypen
 * und 165 Kategorien. Diese werden beim Serverstart idempotent in
 * `global-vault.sqlite` (`symbol_library`) eingespielt.
 */
export const CANONICAL_IEC_SYMBOLS: readonly SymbolDefinition[] = [
  ...CONTACT_AND_SWITCH_SYMBOLS,
  ...COIL_AND_POWER_SYMBOLS,
  ...AUTOMATION_AND_TERMINAL_SYMBOLS,
  ...SENSORS_METERS_AND_ACTUATOR_SYMBOLS,
];
