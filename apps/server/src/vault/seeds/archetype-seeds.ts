import {
  ArchetypeCategorySchema,
  IecArchetypeSchema,
  type IecArchetype,
} from '@descriptio-forge/shared';
import { buildRelaysTerminalsAndAutomationArchetypes } from './archetype-relays-terminals.js';
import { buildSwitchgearAndProtectionArchetypes } from './archetype-switchgear.js';

/** Komplette parametrische IEC-Archetypen-Bibliothek (~590 Vorlagen). */
export const STANDARD_IEC_ARCHETYPES: readonly IecArchetype[] = [
  ...buildSwitchgearAndProtectionArchetypes(),
  ...buildRelaysTerminalsAndAutomationArchetypes(),
];

/** Wirft beim Import, falls ein Seed-Archetyp die Zod-Validierung verletzt. */
export function assertArchetypeSeeds(): void {
  for (const seed of STANDARD_IEC_ARCHETYPES) {
    IecArchetypeSchema.parse(seed);
    ArchetypeCategorySchema.parse(seed.category);
  }
}

/**
 * Normalisiert eine von der KI gelieferte Archetyp-ID (z. B. `MSS_3P_1S_1OE`
 * oder `DISCONNECTOR_3P`) auf die kanonische ID in `global-vault.sqlite`.
 */
export function resolveCanonicalArchetypeId(
  rawId: string | null,
  validIds: ReadonlySet<string>,
): string | null {
  if (!rawId) return null;
  const trimmed = rawId.trim().toUpperCase();
  if (validIds.has(trimmed)) return trimmed;

  const normalized = trimmed
    .replace(/^DISCONNECTOR_/u, 'MAIN_SWITCH_')
    .replace(/^SWITCH_DISCONNECTOR_/u, 'MAIN_SWITCH_')
    .replace(/_(\d+)S(?=_|$)/gu, '_$1NO')
    .replace(/_(\d+)OE(?=_|$)/gu, '_$1NC')
    .replace(/_(\d+)W(?=_|$)/gu, '_$1CO')
    .replace(/_0NO/gu, '')
    .replace(/_0NC/gu, '')
    .replace(/_0CO/gu, '');

  if (validIds.has(normalized)) return normalized;
  return trimmed;
}

const TYPE_FALLBACK_RULES: readonly { pattern: RegExp; archetypeId: string }[] = [
  { pattern: /steuertransformator|trenntransformator|single-phase.*transformer|transformator/iu, archetypeId: 'TRANSFORMER_1P' },
  { pattern: /bedienpanel|touchpanel|multi-touch|display|hmi/iu, archetypeId: 'HMI_PANEL_24DC' },
  { pattern: /sicherheitspositionsschalter|positionsschalter|endschalter|grenztaster|limit switch/iu, archetypeId: 'POSITION_SWITCH_1NO_1NC' },
  { pattern: /induktiver sensor|kapazitiver sensor|optischer sensor|näherungsschalter|naeherungsschalter|proximity switch/iu, archetypeId: 'SENSOR_3WIRE_PNP_NO' },
  { pattern: /kompakt-sps|kleinsteuerung|compact plc/iu, archetypeId: 'PLC_COMPACT_24DC' },
  { pattern: /kommunikationsmodul|feldbusmodul|gateway|measuring.*module|mess-.*modul|interface-modul|ausgangserweiterung/iu, archetypeId: 'PLC_COMM_MODULE' },
  { pattern: /basismodul|xi\/on.*basis|base module/iu, archetypeId: 'PLC_BASE_MODULE' },
  { pattern: /arbeitsstromauslöser|arbeitsstromausloeser|ersatzspule|einschaltmagnet|shunt release|spare coil/iu, archetypeId: 'RELEASE_COIL_SHUNT' },
  { pattern: /unterspannungsauslöser|unterspannungsausloeser|erdschlussauslöser|erdschlussausloeser|undervoltage/iu, archetypeId: 'RELEASE_COIL_UV' },
  { pattern: /motorantrieb|fernantrieb|remote operator|motor operator/iu, archetypeId: 'MOTOR_OPERATOR_2PIN' },
  { pattern: /sicherungspatrone|sicherungseinsatz|fuse cartridge|fuse link|schmelzeinsatz/iu, archetypeId: 'FUSE_LINK_1P' },
  { pattern: /glasfaser|flachkabel|programmierkabel|kabelanschluss|verbindungsleitung|patchkabel|leitungsadapter|fiber optic/iu, archetypeId: 'DATA_CABLE' },
  { pattern: /gehäuse|gehaeuse|enclosure|verteiler|schaltschrank/iu, archetypeId: 'ENCLOSURE_EMPTY' },
  { pattern: /leuchtwahltaste|leuchtdrucktaste|leuchtmelder|led-element/iu, archetypeId: 'PILOT_ACTUATOR_LED' },
  { pattern: /schlüsseltaster|schluesseltaster|wahlschalter|drucktaster|not-halt|not-aus|knebelgriff|tastenkopf|aktor|actuator|betätiger|betaetiger/iu, archetypeId: 'PILOT_ACTUATOR_ONLY' },
  { pattern: /sammelschienenklemme|anschlussklemme|einspeiseklemme|sammelschienenadapter|klemmenblock|klemmenplatte|verbindungsklemme|anschlussblock/iu, archetypeId: 'BUSBAR_TERMINAL_1P' },
  { pattern: /sammelschiene|phasenschiene|kupfer-sammelschiene|kupferband|sammelschienenträger|busbar/iu, archetypeId: 'BUSBAR_3P' },
  { pattern: /druckwächter|druckwaechter|pressure switch/iu, archetypeId: 'PRESSURE_SWITCH_3P' },
  { pattern: /varistor|schutzbeschaltung|entstör|rc-glied|suppressor/iu, archetypeId: 'SURGE_SUPPRESSOR_2PIN' },
  { pattern: /hauptschalter|lasttrennschalter|nockenschalter|ein-aus-schalter|umschalter|stufenschalter/iu, archetypeId: 'MAIN_SWITCH_3P' },
  { pattern: /hilfsschalter|hilfskontakt/iu, archetypeId: 'AUX_BLOCK_1NO_1NC' },
  { pattern: /montage|flansch|tülle|tuelle|schild|platte|profil|winkel|schiene|abdeckung|schlüssel|key|mutter|verschraubung|zubehör|accessory|tasche|blende|halter|kappe|brücke|bruecke/iu, archetypeId: 'MECHANICAL_ACCESSORY' },
];

/**
 * Fallback-Ableitung fuer den Compiler, falls die KI `archetypeId: null`
 * geliefert hat, aber `type` oder `name` den Bauteiltyp klar benennt.
 */
export function inferArchetypeFromType(
  typeStr: string | null | undefined,
  nameStr?: string | null,
): string | null {
  const combined = `${typeStr ?? ''} ${nameStr ?? ''}`.trim();
  if (!combined) return null;
  for (const rule of TYPE_FALLBACK_RULES) {
    if (rule.pattern.test(combined)) return rule.archetypeId;
  }
  return 'MECHANICAL_ACCESSORY';
}
