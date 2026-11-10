import type { SymbolPinPoint } from '@descriptio-forge/shared';

/**
 * 38 detaillierte, normgerechte IEC-60617-Grundgeometrien auf dem 4,0-mm-Raster (16x16 mm).
 * Alle Anschlusspunkte sitzen exakt auf den Fangpunkten (x=8,y=0 / x=8,y=16 bzw. 4/8/12).
 */
export const IEC_BASE_SHAPES: Record<string, string> = {
  // --- Kontakte (Teil 07) ---
  CONTACT_NO:
    '<line x1="8" y1="0" x2="8" y2="5"/><line x1="8" y1="16" x2="8" y2="12"/><line x1="8" y1="12" x2="5" y2="5"/>',
  CONTACT_NC:
    '<line x1="8" y1="0" x2="8" y2="5"/><line x1="8" y1="16" x2="8" y2="12"/><line x1="8" y1="12" x2="6" y2="5"/><line x1="6" y1="5" x2="9" y2="5"/>',
  CONTACT_CO:
    '<line x1="8" y1="0" x2="8" y2="5"/><line x1="4" y1="16" x2="4" y2="11"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="4" y1="11" x2="6" y2="11"/><line x1="8" y1="5" x2="5" y2="11"/>',
  CONTACT_NO_DOUBLE:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><line x1="5" y1="4" x2="5" y2="12"/><line x1="6.5" y1="4" x2="9.5" y2="4"/><line x1="6.5" y1="12" x2="9.5" y2="12"/>',
  CONTACT_TWO_WAY:
    '<line x1="8" y1="0" x2="8" y2="5"/><line x1="4" y1="16" x2="4" y2="11"/><line x1="12" y1="16" x2="12" y2="11"/><line x1="8" y1="5" x2="5" y2="11"/><circle cx="8" cy="8" r="0.8" fill="currentColor"/>',

  // --- Leistungsschaltgeräte (Teil 07-13) ---
  SWITCH_POLE:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="16" x2="8" y2="12"/><line x1="8" y1="12" x2="4.5" y2="4"/><circle cx="8" cy="4" r="1" fill="none"/><circle cx="8" cy="12" r="0.8" fill="currentColor"/>',
  DISCONNECTOR:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="16" x2="8" y2="12"/><line x1="8" y1="12" x2="4.5" y2="4"/><line x1="6.2" y1="4" x2="9.8" y2="4"/>',
  LOAD_SWITCH:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="16" x2="8" y2="12"/><line x1="8" y1="12" x2="4.5" y2="4"/><line x1="6.2" y1="4" x2="9.8" y2="4"/><circle cx="8" cy="4" r="1.2"/>',
  CB_POLE:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="16" x2="8" y2="12"/><line x1="8" y1="12" x2="4.5" y2="4"/><path d="M6.8 2.8l2.4 2.4m0-2.4l-2.4 2.4"/>',
  EARTHING_SWITCH:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="4.5" y2="4"/><line x1="8" y1="12" x2="8" y2="14"/><path d="M5 14h6M6 15h4M7 16h2"/>',

  // --- Spulen, Relais & Auslöser (Teil 07-15 / 07-16) ---
  COIL:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><rect x="4" y="4" width="8" height="8"/>',
  COIL_DOUBLE:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><rect x="4" y="4" width="8" height="8"/><line x1="4" y1="8" x2="12" y2="8"/>',
  COIL_POLARIZED:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><rect x="4" y="4" width="8" height="8"/><circle cx="6" cy="6" r="0.8" fill="currentColor"/>',
  PROTECTION_RELAY:
    '<line x1="8" y1="0" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="16"/><rect x="2.5" y="2.5" width="11" height="11"/><line x1="2.5" y1="5.5" x2="13.5" y2="5.5"/>',
  SOLENOID_VALVE:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><rect x="4" y="4" width="8" height="8"/><path d="M5.5 6l5 4v-4l-5 4z"/>',

  // --- Sicherungen & Ableiter (Teil 07-21 / 07-22) ---
  FUSE:
    '<line x1="8" y1="0" x2="8" y2="16"/><rect x="5" y="3" width="6" height="10"/>',
  FUSE_STRIKER:
    '<line x1="8" y1="0" x2="8" y2="16"/><rect x="5" y="3" width="6" height="10"/><line x1="5" y1="5" x2="11" y2="5"/><path d="M11 4l2-1v2z"/>',
  SPD_ARRESTER:
    '<line x1="8" y1="0" x2="8" y2="3.5"/><line x1="8" y1="12.5" x2="8" y2="16"/><rect x="4" y="3.5" width="8" height="9"/><path d="M8 5v3m-1.5-1L8 8.5 9.5 7M6.5 10h3"/>',
  SPARK_GAP:
    '<line x1="8" y1="0" x2="8" y2="6"/><line x1="8" y1="10" x2="8" y2="16"/><path d="M6.5 4.5L8 6.5l1.5-2M6.5 11.5L8 9.5l1.5 2"/>',

  // --- Passive Bauelemente (Teil 04) ---
  RESISTOR:
    '<line x1="8" y1="0" x2="8" y2="3.5"/><line x1="8" y1="12.5" x2="8" y2="16"/><rect x="5.5" y="3.5" width="5" height="9"/>',
  POTENTIOMETER:
    '<line x1="8" y1="0" x2="8" y2="3.5"/><line x1="8" y1="12.5" x2="8" y2="16"/><rect x="5.5" y="3.5" width="5" height="9"/><path d="M3 11l10-6m-2 0h2v2"/>',
  VARISTOR:
    '<line x1="8" y1="0" x2="8" y2="3.5"/><line x1="8" y1="12.5" x2="8" y2="16"/><rect x="5.5" y="3.5" width="5" height="9"/><path d="M3.5 11l9-6v-2"/>',
  HEATER:
    '<line x1="8" y1="0" x2="8" y2="3.5"/><line x1="8" y1="12.5" x2="8" y2="16"/><rect x="5" y="3.5" width="6" height="9"/><line x1="6.5" y1="3.5" x2="6.5" y2="12.5"/><line x1="9.5" y1="3.5" x2="9.5" y2="12.5"/>',
  CAPACITOR:
    '<line x1="8" y1="0" x2="8" y2="6.5"/><line x1="8" y1="9.5" x2="8" y2="16"/><line x1="4" y1="6.5" x2="12" y2="6.5"/><line x1="4" y1="9.5" x2="12" y2="9.5"/>',
  INDUCTOR:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><path d="M8 3a1.7 1.7 0 0 1 0 3.3 1.7 1.7 0 0 1 0 3.4 1.7 1.7 0 0 1 0 3.3"/>',
  CHOKE_CORE:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><rect x="5.5" y="4" width="5" height="8" fill="currentColor"/><line x1="3.5" y1="4" x2="3.5" y2="12"/>',

  // --- Halbleiter (Teil 05) ---
  DIODE:
    '<line x1="8" y1="0" x2="8" y2="16"/><path d="M5 6h6L8 10.5z"/><line x1="5" y1="10.5" x2="11" y2="10.5"/>',
  ZENER_DIODE:
    '<line x1="8" y1="0" x2="8" y2="16"/><path d="M5 6h6L8 10.5z"/><path d="M5 10.5h6l1 1.5"/>',
  THYRISTOR:
    '<line x1="8" y1="0" x2="8" y2="16"/><path d="M5 6h6L8 10.5z"/><line x1="5" y1="10.5" x2="11" y2="10.5"/><path d="M9.5 10.5l2 2.5h2"/>',
  TRANSISTOR:
    '<line x1="8" y1="0" x2="8" y2="4.5"/><line x1="8" y1="11.5" x2="8" y2="16"/><circle cx="8" cy="8" r="4.5"/><line x1="5.5" y1="5.5" x2="5.5" y2="10.5"/><line x1="5.5" y1="7" x2="8" y2="4.5"/><line x1="5.5" y1="9" x2="8" y2="11.5"/>',
  OPTOCOUPLER:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><path d="M5 6l2 2m-2 1l2 2"/>',

  // --- Maschinen, Wandler & Stromrichter (Teil 06) ---
  MOTOR:
    '<line x1="8" y1="0" x2="8" y2="2.5"/><line x1="8" y1="13.5" x2="8" y2="16"/><circle cx="8" cy="8" r="5.5"/>',
  WINDING:
    '<line x1="8" y1="0" x2="8" y2="3.5"/><line x1="8" y1="12.5" x2="8" y2="16"/><circle cx="8" cy="6" r="2.5"/><circle cx="8" cy="10" r="2.5"/>',
  CURRENT_TRANSFORMER:
    '<line x1="8" y1="0" x2="8" y2="16"/><circle cx="8" cy="8" r="4"/><line x1="12" y1="6" x2="15" y2="6"/><line x1="12" y1="10" x2="15" y2="10"/>',
  CONVERTER_BOX:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="13" x2="13" y2="3"/>',
  BATTERY:
    '<line x1="8" y1="0" x2="8" y2="6.5"/><line x1="8" y1="9.5" x2="8" y2="16"/><line x1="4" y1="6.5" x2="12" y2="6.5"/><line x1="6" y1="9.5" x2="10" y2="9.5" stroke-width="2"/>',

  // --- Klemmen, Stecker, Sensoren & Messgeräte (Teil 03 / 08 / 10 / 11) ---
  TERMINAL:
    '<line x1="8" y1="0" x2="8" y2="5.5"/><line x1="8" y1="10.5" x2="8" y2="16"/><circle cx="8" cy="8" r="2.5"/>',
  PLUG_SOCKET:
    '<line x1="8" y1="0" x2="8" y2="6"/><path d="M5.5 9a2.5 2.5 0 0 1 5 0"/><line x1="8" y1="9" x2="8" y2="16"/><line x1="8" y1="6" x2="8" y2="8.5" stroke-width="2"/>',
  SENSOR_BOX:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><path d="M8 3l5 5-5 5-5-5z"/>',
  METER_CIRCLE:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><circle cx="8" cy="8" r="5"/>',
  METER_BOX:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="6" x2="13" y2="6"/>',
  LAMP_CROSS:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><circle cx="8" cy="8" r="4"/><line x1="5.2" y1="5.2" x2="10.8" y2="10.8"/><line x1="10.8" y1="5.2" x2="5.2" y2="10.8"/>',
  HORN_BUZZER:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><path d="M5 4h6v8H5z"/><path d="M5 5l-3-2v10l3-2"/>',
  BELL_SIREN:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><path d="M4 9a4 4 0 0 1 8 0z"/><rect x="6" y="9" width="4" height="3"/>',
  PLC_BLOCK:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="5.5" x2="13" y2="5.5"/><line x1="3" y1="10.5" x2="13" y2="10.5"/>',
};

export function buildMultiPolePins(pinCount: number, labels: string[]): SymbolPinPoint[] {
  if (pinCount === 1) {
    return [{ pinIndex: 1, defaultLabel: labels[0] || '1', xMm: 8, yMm: 0, direction: 'TOP' }];
  }
  if (pinCount === 3) {
    return [
      { pinIndex: 1, defaultLabel: labels[0] || '11', xMm: 8, yMm: 0, direction: 'TOP' },
      { pinIndex: 2, defaultLabel: labels[1] || '12', xMm: 4, yMm: 16, direction: 'BOTTOM' },
      { pinIndex: 3, defaultLabel: labels[2] || '14', xMm: 12, yMm: 16, direction: 'BOTTOM' },
    ];
  }
  if (pinCount === 4) {
    return [
      { pinIndex: 1, defaultLabel: labels[0] || '1', xMm: 4, yMm: 0, direction: 'TOP' },
      { pinIndex: 2, defaultLabel: labels[1] || '2', xMm: 4, yMm: 16, direction: 'BOTTOM' },
      { pinIndex: 3, defaultLabel: labels[2] || '3', xMm: 12, yMm: 0, direction: 'TOP' },
      { pinIndex: 4, defaultLabel: labels[3] || '4', xMm: 12, yMm: 16, direction: 'BOTTOM' },
    ];
  }
  return [
    { pinIndex: 1, defaultLabel: labels[0] || '1', xMm: 8, yMm: 0, direction: 'TOP' },
    { pinIndex: 2, defaultLabel: labels[1] || '2', xMm: 8, yMm: 16, direction: 'BOTTOM' },
  ];
}
