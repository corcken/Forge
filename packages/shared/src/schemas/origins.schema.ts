import { z } from 'zod';

/**
 * Datenherkunft eines einzelnen Feldes.
 * - AI  : direkt aus der KI-Datenblattanalyse (Stufe 2)
 * - SER : aus der Baureihen-Vorlage (CatalogSeries) geerbt
 * - ARC : aus dem IEC-Archetyp generiert (Pins, ERC, Funktionsgruppen)
 * - HEU : berechneter Heuristik-Fallback (z. B. 3D-Pin-Offset aus Gehaeusemass)
 * - MAN : manuell vom Nutzer uebersteuert und schreibgeschuetzt (Lock)
 * - NULL: kein Wert vorhanden
 */
export const FieldOriginSchema = z.enum(['AI', 'SER', 'ARC', 'HEU', 'MAN', 'NULL']);
export type FieldOrigin = z.infer<typeof FieldOriginSchema>;

/** Verteilung der Herkunft ueber alle Felder: { width: 'AI', torque: 'SER' }. */
export const FieldOriginsMapSchema = z.record(z.string(), FieldOriginSchema);
export type FieldOriginsMap = z.infer<typeof FieldOriginsMapSchema>;

/** Herkunft einer generierten Funktionsgruppe / eines Pins (ohne NULL). */
export const OriginSourceSchema = z.enum(['AI', 'SER', 'ARC', 'HEU', 'MAN']);
export type OriginSource = z.infer<typeof OriginSourceSchema>;

/** Pipeline-Status eines Artikels im aktiven Run. */
export const PipelineStatusSchema = z.enum([
  'PENDING_INGEST',
  'INGESTED',
  'AI_EXTRACTED',
  'COMPILED',
  'VALIDATED',
  'EXPORT_READY',
  'ERROR',
]);
export type PipelineStatus = z.infer<typeof PipelineStatusSchema>;

/** Qualitaetsstufe nach der Stufe-4-Validierung. */
export const QualityTierSchema = z.enum(['GOLD', 'SILVER', 'BRONZE']);
export type QualityTier = z.infer<typeof QualityTierSchema>;

/** Elektrische Rolle eines Pins (pinElectricalRole) fuer die ERC-Pruefung. */
export const ElectricalRoleSchema = z.enum([
  'SOURCE',
  'SINK',
  'PASSIVE',
  'REFERENCE',
  'BIDIRECTIONAL',
]);
export type ElectricalRole = z.infer<typeof ElectricalRoleSchema>;

/** Potenzialweitergabe (potentialPropagation) durch eine Funktionsgruppe. */
export const PotentialPropagationSchema = z.enum([
  'INTERNAL_BRIDGE',
  'SWITCHED_PASS_THROUGH',
  'POTENTIAL_SINK',
  'ISOLATED_TRANSFORM',
  'NONE',
]);
export type PotentialPropagation = z.infer<typeof PotentialPropagationSchema>;

/** Typ einer Funktionsgruppe (Kontakte, Spule, Durchgangsklemme, Ausgang). */
export const FunctionGroupTypeSchema = z.enum([
  'COIL',
  'NO_CONTACT',
  'NC_CONTACT',
  'CHANGEOVER_CONTACT',
  'TERMINAL_PASS',
  'POWER_OUT',
]);
export type FunctionGroupType = z.infer<typeof FunctionGroupTypeSchema>;

/** Kontaktart eines einzelnen Anschlusses / Pins. */
export const ContactTypeSchema = z.enum([
  'COIL',
  'NO_CONTACT',
  'NC_CONTACT',
  'CHANGEOVER_CONTACT',
  'TERMINAL_PASS',
  'POWER_OUT',
]);
export type ContactType = z.infer<typeof ContactTypeSchema>;

/** Spannungsart eines Pins. */
export const VoltageTypeSchema = z.enum(['AC', 'DC', 'AC_DC', 'ANY']);
export type VoltageType = z.infer<typeof VoltageTypeSchema>;

/** Anschlusstechnik. */
export const ConnectionTypeSchema = z.enum(['SCREW', 'PUSH_IN', 'SPRING', 'BOLT']);
export type ConnectionType = z.infer<typeof ConnectionTypeSchema>;

/** Einfuehrrichtung des Leiters fuer die 3D-Pin-Geometrie. */
export const WireEntryDirectionSchema = z.enum(['TOP', 'BOTTOM', 'FRONT']);
export type WireEntryDirection = z.infer<typeof WireEntryDirectionSchema>;

/** Befestigungsart des Bauteils. */
export const MountingTypeSchema = z.enum(['DIN_RAIL', 'MOUNTING_PLATE', 'DOOR']);
export type MountingType = z.infer<typeof MountingTypeSchema>;

/** Art eines zwischengespeicherten Rohdokuments. */
export const RawSourceTypeSchema = z.enum(['HTML_ETIM', 'PDF_DATASHEET', 'PDF_MANUAL']);
export type RawSourceType = z.infer<typeof RawSourceTypeSchema>;

/** Kategorie eines IEC-Archetyps. */
export const ArchetypeCategorySchema = z.enum([
  'SWITCHGEAR',
  'PROTECTION',
  'TERMINAL',
  'POWER_SUPPLY',
  'PLC',
  'CABLE',
]);
export type ArchetypeCategory = z.infer<typeof ArchetypeCategorySchema>;

/** Adapter-Typ eines KI-Providers. */
export const AiProviderAdapterTypeSchema = z.enum(['GEMINI', 'OPENAI_COMPAT', 'ANTHROPIC']);
export type AiProviderAdapterType = z.infer<typeof AiProviderAdapterTypeSchema>;

/** Status des Live-Verbindungstests eines KI-Providers. */
export const AiProviderTestStatusSchema = z.enum(['UNTESTED', 'OK', 'ERROR']);
export type AiProviderTestStatus = z.infer<typeof AiProviderTestStatusSchema>;

/** Aufgaben-Routing fuer KI-Modelle. */
export const AiTaskTypeSchema = z.enum([
  'TASK_HTML_EXTRACT',
  'TASK_PDF_VISION',
  'TASK_SYMBOL_SVG',
]);
export type AiTaskType = z.infer<typeof AiTaskTypeSchema>;
