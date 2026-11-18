import type { SymbolPinPoint } from '@descriptio-forge/shared';

/**
 * Detaillierte, normgerechte IEC-60617-Grundgeometrien auf dem 4,0-mm-Raster (16x16 mm).
 * Alle Anschlusspunkte sitzen exakt auf den Fangpunkten (x=8,y=0 / x=8,y=16 bzw. x=4/12).
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
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><rect x="5.5" y="4" width="5" height="8" fill="currentColor"/><line x1="6.5" y1="4" x2="6.5" y2="12"/><line x1="8" y1="4" x2="8" y2="12"/><line x1="9.5" y1="4" x2="9.5" y2="12"/><line x1="3.5" y1="4" x2="3.5" y2="12"/>',

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
    '<line x1="8" y1="0" x2="8" y2="16"/><circle cx="8" cy="8" r="4"/><line x1="6.5" y1="7" x2="9.5" y2="9"/><line x1="6.5" y1="9" x2="9.5" y2="11"/>',
  CONVERTER_BOX:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="13" x2="13" y2="3"/>',
  BATTERY:
    '<line x1="8" y1="0" x2="8" y2="6.5"/><line x1="8" y1="9.5" x2="8" y2="16"/><line x1="4" y1="6.5" x2="12" y2="6.5"/><line x1="6" y1="9.5" x2="10" y2="9.5" stroke-width="2"/>',

  // --- Klemmen, Stecker, Sensoren & Messgeräte (Teil 02 / 03 / 08 / 10 / 11) ---
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

  // --- Erdung, Schirmung, Gehäuse & Leitungen (Teil 02 / Teil 03) ---
  EARTH_GENERAL:
    '<line x1="8" y1="0" x2="8" y2="9"/><line x1="3" y1="9" x2="13" y2="9"/><line x1="5" y1="11.5" x2="11" y2="11.5"/><line x1="6.8" y1="14" x2="9.2" y2="14"/>',
  EARTH_PE:
    '<line x1="8" y1="0" x2="8" y2="8.5"/><circle cx="8" cy="10" r="5"/><line x1="4.5" y1="8.5" x2="11.5" y2="8.5"/><line x1="5.8" y1="10.8" x2="10.2" y2="10.8"/><line x1="7" y1="13" x2="9" y2="13"/>',
  EARTH_FE:
    '<line x1="8" y1="0" x2="8" y2="8.5"/><path d="M3 10.5a5 5 0 0 1 10 0"/><line x1="4.5" y1="8.5" x2="11.5" y2="8.5"/><line x1="6" y1="10.8" x2="10" y2="10.8"/><line x1="7.2" y1="13" x2="8.8" y2="13"/>',
  EARTH_CHASSIS:
    '<line x1="8" y1="0" x2="8" y2="9"/><line x1="3.5" y1="9" x2="12.5" y2="9"/><line x1="5" y1="9" x2="3.5" y2="12.5"/><line x1="8.5" y1="9" x2="7" y2="12.5"/><line x1="12" y1="9" x2="10.5" y2="12.5"/>',
  EQUIPOTENTIAL:
    '<line x1="8" y1="0" x2="8" y2="6"/><line x1="8" y1="13" x2="8" y2="16"/><path d="M8 5.5L13 13H3Z"/><line x1="5.5" y1="10.5" x2="10.5" y2="10.5"/>',
  SHIELD_SCREEN:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><rect x="3.5" y="4" width="9" height="8" stroke-dasharray="1.5 1"/>',
  ENCLOSURE_BOX:
    '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/>',
  BUSBAR:
    '<line x1="2" y1="8" x2="14" y2="8" stroke-width="2"/><line x1="8" y1="0" x2="8" y2="16"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/>',
  CONDUCTOR_LINE:
    '<line x1="8" y1="0" x2="8" y2="16"/><line x1="6" y1="9" x2="10" y2="7"/>',
  COAX_CABLE:
    '<line x1="8" y1="0" x2="8" y2="16"/><circle cx="8" cy="8" r="3"/><line x1="8" y1="11" x2="12" y2="11"/>',
  TWISTED_PAIR:
    '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><path d="M6 4l4 4-4 4M10 4L6 8l4 4"/>',
  CABLE_SPLICE:
    '<line x1="8" y1="0" x2="8" y2="16"/><rect x="5.5" y="4.5" width="5" height="7"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/>',
  CABLE_TERMINATION:
    '<line x1="8" y1="0" x2="8" y2="7"/><path d="M5 7h6L8 12.5Z"/>',
};

/**
 * Passt eine IEC-60617-Grundform exakt an die Pol-/Pin-Anzahl (1, 2, 3 oder 4 Pins) an,
 * sodass jeder Pin aus `buildMultiPolePins` eine physische Anschlusslinie am Symbol besitzt
 * und keine offenen Leitungen ohne Pin verbleiben.
 */
export function renderIecBaseShape(shapeKey: string, pinCount: number): string {
  const key = shapeKey in IEC_BASE_SHAPES ? shapeKey : 'COIL';

  // --- 1-PIN GEOMETRIEN (Anschluss ausschliesslich oben bei x=8, y=0) ---
  if (pinCount === 1) {
    switch (key) {
      case 'EARTH_GENERAL':
      case 'EARTH_PE':
      case 'EARTH_FE':
      case 'EARTH_CHASSIS':
      case 'CABLE_TERMINATION':
        return IEC_BASE_SHAPES[key]!;
      case 'EARTHING_SWITCH':
        return '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="11.5" x2="4.5" y2="4"/><line x1="8" y1="11.5" x2="8" y2="13.5"/><path d="M5 13.5h6M6 14.8h4"/>';
      case 'EQUIPOTENTIAL':
        return '<line x1="8" y1="0" x2="8" y2="5.5"/><path d="M8 5.5L13 13H3Z"/><line x1="5.5" y1="10.5" x2="10.5" y2="10.5"/>';
      case 'SHIELD_SCREEN':
        return '<line x1="8" y1="0" x2="8" y2="4"/><rect x="3.5" y="4" width="9" height="8" stroke-dasharray="1.5 1"/>';
      case 'TERMINAL':
        return '<line x1="8" y1="0" x2="8" y2="5.5"/><circle cx="8" cy="8" r="2.5"/>';
      case 'PLUG_SOCKET':
        return '<line x1="8" y1="0" x2="8" y2="6"/><path d="M5.5 9.5a2.5 2.5 0 0 1 5 0"/><line x1="8" y1="6" x2="8" y2="8.5" stroke-width="2"/>';
      default: {
        // Entferne jede untere Anschlusslinie zu y=16
        return IEC_BASE_SHAPES[key]!
          .replace(/<line x1="8" y1="[0-9.]+" x2="8" y2="16"\/>/g, '')
          .replace(/<line x1="8" y1="16" x2="8" y2="[0-9.]+"\/>/g, '')
          .replace(/<line x1="8" y1="0" x2="8" y2="16"\/>/g, '<line x1="8" y1="0" x2="8" y2="12"/>');
      }
    }
  }

  // --- 3-PIN GEOMETRIEN (Anschluesse bei (8,0), (4,16) und (12,16)) ---
  if (pinCount === 3) {
    switch (key) {
      case 'CONTACT_CO':
      case 'CONTACT_TWO_WAY':
        return IEC_BASE_SHAPES[key]!;
      case 'CONTACT_NO_DOUBLE':
        return IEC_BASE_SHAPES.CONTACT_TWO_WAY!;
      case 'CONTACT_NO':
      case 'CONTACT_NC':
      case 'SWITCH_POLE':
      case 'DISCONNECTOR':
      case 'LOAD_SWITCH':
      case 'CB_POLE':
        return IEC_BASE_SHAPES.CONTACT_CO!;
      case 'POTENTIOMETER':
      case 'RESISTOR':
      case 'VARISTOR':
      case 'HEATER':
        return '<line x1="8" y1="0" x2="8" y2="3.5"/><rect x="5.5" y="3.5" width="5" height="8"/><line x1="8" y1="11.5" x2="4" y2="13.5"/><line x1="4" y1="13.5" x2="4" y2="16"/><line x1="10.5" y1="7.5" x2="12" y2="7.5"/><line x1="12" y1="7.5" x2="12" y2="16"/><path d="M12 7.5l-1.5-1v2z"/>';
      case 'CAPACITOR':
        return '<line x1="8" y1="0" x2="8" y2="6.5"/><line x1="3" y1="6.5" x2="13" y2="6.5"/><line x1="3" y1="9.5" x2="7" y2="9.5"/><line x1="9" y1="9.5" x2="13" y2="9.5"/><line x1="4" y1="9.5" x2="4" y2="16"/><line x1="12" y1="9.5" x2="12" y2="16"/>';
      case 'BATTERY':
        return '<line x1="8" y1="0" x2="8" y2="6.5"/><line x1="4" y1="6.5" x2="12" y2="6.5"/><line x1="5.5" y1="9.5" x2="10.5" y2="9.5" stroke-width="2"/><line x1="8" y1="9.5" x2="4" y2="13"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="10" y1="8" x2="12" y2="8"/>';
      case 'INDUCTOR':
      case 'CHOKE_CORE':
      case 'WINDING':
        return '<line x1="8" y1="0" x2="8" y2="3.5"/><circle cx="8" cy="6" r="2.5"/><circle cx="8" cy="10" r="2.5"/><line x1="8" y1="12.5" x2="4" y2="14"/><line x1="4" y1="14" x2="4" y2="16"/><line x1="10.5" y1="8" x2="12" y2="8"/><line x1="12" y1="8" x2="12" y2="16"/>';
      case 'TRANSISTOR':
        return '<line x1="8" y1="0" x2="8" y2="4.5"/><circle cx="8" cy="8" r="4.5"/><line x1="6" y1="5.5" x2="6" y2="10.5"/><line x1="6" y1="7" x2="8" y2="4.5"/><line x1="6" y1="9" x2="8" y2="11.5"/><line x1="8" y1="11.5" x2="4" y2="13.5"/><line x1="4" y1="13.5" x2="4" y2="16"/><line x1="6" y1="8" x2="12" y2="13.5"/><line x1="12" y1="13.5" x2="12" y2="16"/>';
      case 'THYRISTOR':
      case 'DIODE':
      case 'ZENER_DIODE':
        return '<line x1="8" y1="0" x2="8" y2="6"/><path d="M5 6h6L8 10.5z"/><line x1="5" y1="10.5" x2="11" y2="10.5"/><line x1="8" y1="10.5" x2="4" y2="13.5"/><line x1="4" y1="13.5" x2="4" y2="16"/><line x1="9.5" y1="10.5" x2="12" y2="13"/><line x1="12" y1="13" x2="12" y2="16"/>';
      case 'MOTOR':
      case 'METER_CIRCLE':
        return '<line x1="8" y1="0" x2="8" y2="3"/><circle cx="8" cy="8" r="5"/><line x1="4" y1="11" x2="4" y2="16"/><line x1="12" y1="11" x2="12" y2="16"/>';
      case 'PROTECTION_RELAY':
        return '<line x1="8" y1="0" x2="8" y2="2.5"/><rect x="2.5" y="2.5" width="11" height="11"/><line x1="2.5" y1="5.5" x2="13.5" y2="5.5"/><line x1="4" y1="13.5" x2="4" y2="16"/><line x1="12" y1="13.5" x2="12" y2="16"/>';
      case 'TERMINAL':
      case 'CONDUCTOR_LINE':
      case 'CABLE_SPLICE':
        return '<line x1="8" y1="0" x2="8" y2="5.5"/><circle cx="8" cy="8" r="2.5"/><line x1="6.2" y1="9.8" x2="4" y2="12.5"/><line x1="4" y1="12.5" x2="4" y2="16"/><line x1="9.8" y1="9.8" x2="12" y2="12.5"/><line x1="12" y1="12.5" x2="12" y2="16"/>';
      case 'PLUG_SOCKET':
        return '<line x1="8" y1="0" x2="8" y2="6"/><path d="M5.5 9a2.5 2.5 0 0 1 5 0"/><line x1="8" y1="6" x2="8" y2="8.5" stroke-width="2"/><line x1="8" y1="9" x2="4" y2="12.5"/><line x1="4" y1="12.5" x2="4" y2="16"/><line x1="8" y1="9" x2="12" y2="12.5"/><line x1="12" y1="12.5" x2="12" y2="16"/>';
      case 'SENSOR_BOX':
        return '<line x1="8" y1="0" x2="8" y2="3"/><rect x="3" y="3" width="10" height="10"/><path d="M8 3l5 5-5 5-5-5z"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="13" x2="12" y2="16"/>';
      case 'CONVERTER_BOX':
        return '<line x1="8" y1="0" x2="8" y2="3"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="13" x2="13" y2="3"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="13" x2="12" y2="16"/>';
      case 'PLC_BLOCK':
        return '<line x1="8" y1="0" x2="8" y2="3"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="5.5" x2="13" y2="5.5"/><line x1="3" y1="10.5" x2="13" y2="10.5"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="13" x2="12" y2="16"/>';
      case 'METER_BOX':
      default:
        return '<line x1="8" y1="0" x2="8" y2="3"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="6" x2="13" y2="6"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="13" x2="12" y2="16"/>';
    }
  }

  // --- 4-PIN GEOMETRIEN (Anschluesse bei (4,0), (4,16), (12,0), (12,16)) ---
  if (pinCount === 4) {
    switch (key) {
      case 'WINDING':
      case 'CURRENT_TRANSFORMER':
        return '<line x1="4" y1="0" x2="4" y2="3.5"/><line x1="4" y1="12.5" x2="4" y2="16"/><circle cx="4" cy="6" r="2.2"/><circle cx="4" cy="10" r="2.2"/><line x1="8" y1="3.5" x2="8" y2="12.5"/><line x1="12" y1="0" x2="12" y2="3.5"/><line x1="12" y1="12.5" x2="12" y2="16"/><circle cx="12" cy="6" r="2.2"/><circle cx="12" cy="10" r="2.2"/>';
      case 'INDUCTOR':
      case 'CHOKE_CORE':
        return '<line x1="4" y1="0" x2="4" y2="4"/><line x1="4" y1="12" x2="4" y2="16"/><rect x="2.5" y="4" width="3" height="8"/><line x1="8" y1="4" x2="8" y2="12" stroke-dasharray="1.5 1"/><line x1="12" y1="0" x2="12" y2="4"/><line x1="12" y1="12" x2="12" y2="16"/><rect x="10.5" y="4" width="3" height="8"/>';
      case 'OPTOCOUPLER':
        return '<rect x="2" y="3" width="12" height="10"/><line x1="4" y1="0" x2="4" y2="6"/><path d="M2.8 6h2.4L4 8.5z"/><line x1="2.8" y1="8.5" x2="5.2" y2="8.5"/><line x1="4" y1="8.5" x2="4" y2="16"/><path d="M6.2 6.5l2 1.2M6.2 8.8l2 1.2"/><line x1="12" y1="0" x2="12" y2="5.5"/><line x1="10" y1="6" x2="10" y2="10"/><line x1="10" y1="7" x2="12" y2="5.5"/><line x1="10" y1="9" x2="12" y2="10.5"/><line x1="12" y1="10.5" x2="12" y2="16"/>';
      case 'DIODE':
      case 'ZENER_DIODE':
      case 'THYRISTOR':
      case 'TRANSISTOR':
        return '<line x1="4" y1="0" x2="4" y2="7"/><line x1="4" y1="9" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="7"/><line x1="12" y1="9" x2="12" y2="16"/><path d="M8 3L13 8 8 13 3 8Z"/><path d="M6.8 6.8h2.4L8 9.2z"/><line x1="6.8" y1="9.2" x2="9.2" y2="9.2"/>';
      case 'CONTACT_NO_DOUBLE':
      case 'CONTACT_NO':
      case 'CONTACT_CO':
      case 'CONTACT_TWO_WAY':
        return '<line x1="4" y1="0" x2="4" y2="5"/><line x1="4" y1="16" x2="4" y2="12"/><line x1="4" y1="12" x2="1.8" y2="5"/><line x1="12" y1="0" x2="12" y2="5"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="12" x2="9.8" y2="5"/><line x1="2.8" y1="8.5" x2="10.8" y2="8.5" stroke-dasharray="1 1"/>';
      case 'CONTACT_NC':
        return '<line x1="4" y1="0" x2="4" y2="5"/><line x1="4" y1="16" x2="4" y2="12"/><line x1="4" y1="12" x2="2.2" y2="5"/><line x1="2.2" y1="5" x2="5" y2="5"/><line x1="12" y1="0" x2="12" y2="5"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="12" x2="10.2" y2="5"/><line x1="10.2" y1="5" x2="13" y2="5"/><line x1="3" y1="8.5" x2="11" y2="8.5" stroke-dasharray="1 1"/>';
      case 'CB_POLE':
      case 'SWITCH_POLE':
      case 'DISCONNECTOR':
      case 'LOAD_SWITCH':
        return '<line x1="4" y1="0" x2="4" y2="4"/><line x1="4" y1="16" x2="4" y2="12"/><line x1="4" y1="12" x2="1.8" y2="4"/><path d="M3 3l2 2m0-2l-2 2"/><line x1="12" y1="0" x2="12" y2="4"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="12" x2="9.8" y2="4"/><path d="M11 3l2 2m0-2l-2 2"/><line x1="2.8" y1="8" x2="10.8" y2="8" stroke-dasharray="1 1"/>';
      case 'FUSE':
      case 'FUSE_STRIKER':
        return '<line x1="4" y1="0" x2="4" y2="16"/><rect x="2.2" y="4" width="3.6" height="8"/><line x1="12" y1="0" x2="12" y2="16"/><rect x="10.2" y="4" width="3.6" height="8"/><line x1="5.8" y1="8" x2="10.2" y2="8" stroke-dasharray="1 1"/>';
      case 'COIL':
      case 'COIL_DOUBLE':
      case 'COIL_POLARIZED':
      case 'SOLENOID_VALVE':
        return '<line x1="4" y1="0" x2="4" y2="4"/><line x1="4" y1="12" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="4"/><line x1="12" y1="12" x2="12" y2="16"/><rect x="2.5" y="4" width="11" height="8"/><line x1="8" y1="4" x2="8" y2="12"/>';
      case 'PLUG_SOCKET':
        return '<line x1="4" y1="0" x2="4" y2="6"/><path d="M2 9a2 2 0 0 1 4 0"/><line x1="4" y1="9" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="6"/><path d="M10 9a2 2 0 0 1 4 0"/><line x1="12" y1="9" x2="12" y2="16"/>';
      case 'TERMINAL':
      case 'BUSBAR':
      case 'CONDUCTOR_LINE':
      case 'CABLE_SPLICE':
        return '<line x1="4" y1="0" x2="4" y2="6"/><circle cx="4" cy="8" r="2"/><line x1="4" y1="10" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="6"/><circle cx="12" cy="8" r="2"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="6" y1="8" x2="10" y2="8" stroke-dasharray="1 1"/>';
      case 'MOTOR':
      case 'METER_CIRCLE':
        return '<line x1="4" y1="0" x2="4" y2="4.2"/><line x1="4" y1="11.8" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="4.2"/><line x1="12" y1="11.8" x2="12" y2="16"/><circle cx="8" cy="8" r="5.5"/>';
      case 'SENSOR_BOX':
        return '<line x1="4" y1="0" x2="4" y2="3"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="3"/><line x1="12" y1="13" x2="12" y2="16"/><rect x="2.5" y="3" width="11" height="10"/><path d="M8 3l5 5-5 5-5-5z"/>';
      case 'CONVERTER_BOX':
        return '<line x1="4" y1="0" x2="4" y2="3"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="3"/><line x1="12" y1="13" x2="12" y2="16"/><rect x="2.5" y="3" width="11" height="10"/><line x1="2.5" y1="13" x2="13.5" y2="3"/>';
      case 'PLC_BLOCK':
        return '<line x1="4" y1="0" x2="4" y2="3"/><line x1="4" y1="13" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="3"/><line x1="12" y1="13" x2="12" y2="16"/><rect x="2.5" y="3" width="11" height="10"/><line x1="2.5" y1="5.5" x2="13.5" y2="5.5"/><line x1="2.5" y1="10.5" x2="13.5" y2="10.5"/>';
      case 'PROTECTION_RELAY':
      case 'METER_BOX':
      default:
        return '<line x1="4" y1="0" x2="4" y2="2.5"/><line x1="4" y1="13.5" x2="4" y2="16"/><line x1="12" y1="0" x2="12" y2="2.5"/><line x1="12" y1="13.5" x2="12" y2="16"/><rect x="2.5" y="2.5" width="11" height="11"/><line x1="2.5" y1="5.5" x2="13.5" y2="5.5"/>';
    }
  }

  // --- 2-PIN STANDARD-GEOMETRIEN (Anschluesse bei (8,0) und (8,16)) ---
  if (key === 'EARTHING_SWITCH') {
    return '<line x1="8" y1="0" x2="8" y2="4"/><line x1="8" y1="12" x2="4.5" y2="4"/><line x1="8" y1="12" x2="8" y2="16"/><path d="M5 13.5h6M6 14.8h4"/>';
  }
  return IEC_BASE_SHAPES[key]!;
}

const VALID_IEC_81346_PREFIXES = new Set([
  'A', 'B', 'C', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
]);

const BMK_SYNONYM_MAP: Record<string, string> = {
  BT: 'B', BP: 'B', BF: 'B', BL: 'B', BS: 'B', BG: 'B', PI: 'B', TI: 'B',
  KT: 'K', KM: 'K', KF: 'K', KI: 'K', KP: 'K', KA: 'K', KU: 'K',
  SB: 'S', SH: 'S', ST: 'S', SE: 'S',
  CT: 'T', VT: 'T', TR: 'T', AT: 'T',
  HA: 'H', HL: 'H',
  XS: 'X', XB: 'X', XE: 'X', XF: 'X', XP: 'X', PE: 'X', EQ: 'X', CH: 'X', CE: 'X', FE: 'X', NE: 'X', SG: 'X', FR: 'X', N: 'X',
  DL: 'E', EH: 'E', ER: 'E',
  MA: 'M', MT: 'M',
  KE: 'W', VM: 'W', AM: 'W',
  FB: 'F', FS: 'F',
  QE: 'Q',
  PZ: 'P', PM: 'P', PF: 'P', HZ: 'P', CO: 'P',
  RP: 'R', RT: 'R', RV: 'R', RL: 'R', RM: 'R', RN: 'R', 'RΘ': 'R',
  VA: 'V', VD: 'V', D: 'V',
  AC: 'G', DC: 'G', CV: 'G',
  FC: 'L',
  AK: 'A', TD: 'U',
};

/**
 * Normalisiert beliebige BMK-Praefixe auf gueltige 1-Buchstaben-Kennbuchstaben nach IEC 81346.
 */
export function normalizeIec81346BmkPrefix(
  rawBmk: string | null | undefined,
  iec60617Ref?: string | null,
  name?: string,
): string {
  const cleaned = (rawBmk || '').trim().replace(/^[-+]/, '').toUpperCase();
  if (VALID_IEC_81346_PREFIXES.has(cleaned)) return cleaned;
  if (BMK_SYNONYM_MAP[cleaned]) return BMK_SYNONYM_MAP[cleaned]!;
  if (cleaned.length > 0 && VALID_IEC_81346_PREFIXES.has(cleaned[0]!)) return cleaned[0]!;

  const sec = (iec60617Ref || '').match(/\b(\d{2}-\d{2})/)?.[1] ?? '';
  if (sec.startsWith('03-')) return sec === '03-01' ? 'W' : 'X';
  if (sec === '04-01') return 'R';
  if (sec === '04-02') return 'C';
  if (sec === '04-03' || sec === '04-04') return 'L';
  if (sec.startsWith('05-')) return 'V';
  if (sec.startsWith('06-09') || sec.startsWith('06-10')) return 'T';
  if (sec.startsWith('06-14') || sec.startsWith('06-15')) return 'G';
  if (sec.startsWith('06-')) return 'M';
  if (sec.startsWith('08-10')) return 'H';
  if (sec.startsWith('08-')) return 'P';
  if (sec.startsWith('09-')) return 'Z';
  if (sec.startsWith('10-')) return 'K';
  const lower = (name || '').toLowerCase();
  if (lower.includes('erde') || lower.includes('klemme') || lower.includes('stecker')) return 'X';
  if (lower.includes('mess') || lower.includes('zähler') || lower.includes('leistung')) return 'P';
  return 'K';
}

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
