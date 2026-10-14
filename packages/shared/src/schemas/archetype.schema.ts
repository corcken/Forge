import { z } from 'zod';
import {
  ArchetypeCategorySchema,
  ConnectionTypeSchema,
  ContactTypeSchema,
  ElectricalRoleSchema,
  FunctionGroupTypeSchema,
  MountingTypeSchema,
  PotentialPropagationSchema,
  VoltageTypeSchema,
  WireEntryDirectionSchema,
} from './origins.schema.js';
import { PartAccessoryRelationSchema } from './descriptio-export.schema.js';

/**
 * Vorlage fuer einen einzelnen Pin innerhalb eines Archetyp-Funktionsgruppen-
 * Templates. Der deterministische Compiler expantiert diese Schablone pro
 * Artikel zu konkreten `CatalogPin`-Eintraegen.
 */
export const PinTemplateSchema = z.object({
  pinName: z.string(),
  contactType: ContactTypeSchema,
  electricalRole: ElectricalRoleSchema,
  voltageType: VoltageTypeSchema,
  nominalVoltage: z.number().nullable().default(null),
  minVoltage: z.number().nullable().default(null),
  maxVoltage: z.number().nullable().default(null),
  maxCurrent: z.number().nullable().default(null),
  minCrossSec: z.number().nullable().default(null),
  maxCrossSec: z.number().nullable().default(null),
  maxCrossSecTwin: z.number().nullable().default(null),
  maxConnections: z.number().int().positive().default(1),
  connectionType: ConnectionTypeSchema.nullable().default(null),
  strippingLengthMm: z.number().nullable().default(null),
  torqueNm: z.number().nullable().default(null),
  wireEntryDirection: WireEntryDirectionSchema.nullable().default(null),
});
export type PinTemplate = z.infer<typeof PinTemplateSchema>;

/**
 * Vorlage fuer eine Funktionsgruppe (z. B. Spule A1/A2, Hauptkontakt 3P,
 * Hilfskontakt 1S). Traegt die E-CAD- und ERC-relevante Logik.
 */
export const FunctionGroupTemplateSchema = z.object({
  groupKey: z.string(),
  functionType: FunctionGroupTypeSchema,
  label: z.string().nullable().default(null),
  bmkPrefix: z.string().nullable().default(null),
  symbolDefinitionId: z.string().nullable().default(null),
  potentialPropagation: PotentialPropagationSchema,
  isPositivelyDriven: z.boolean().default(false),
  pins: z.array(PinTemplateSchema).default([]),
});
export type FunctionGroupTemplate = z.infer<typeof FunctionGroupTemplateSchema>;

/**
 * Ein globaler IEC-Archetyp (Schuetz, LS-Schalter, Klemme, Netzteil ...).
 * Enthaelt die Generierungsregeln fuer Funktionsgruppen und Pins sowie den
 * betriebsmittelkennzeichen-Praefix (defaultBmkPrefix).
 */
export const IecArchetypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: ArchetypeCategorySchema,
  defaultBmkPrefix: z.string(),
  mountingTypeDefault: MountingTypeSchema.nullable().default(null),
  functionGroupsTemplate: z.array(FunctionGroupTemplateSchema).default([]),
  description: z.string().nullable().default(null),
  updatedAt: z.string().nullable().default(null),
});
export type IecArchetype = z.infer<typeof IecArchetypeSchema>;

/**
 * Baureihen-Defaults (shared fields), die der Series-Merger fuer alle im
 * KI-Extrakt leer gebliebenen Felder heranzieht (Herkunft = SER).
 */
export const SeriesSharedFieldsSchema = z.object({
  torqueNm: z.number().nullable().default(null),
  strippingLengthMm: z.number().nullable().default(null),
  maxCrossSecTwin: z.number().nullable().default(null),
  dinRailMountOffsetY: z.number().nullable().default(null),
  connectionType: ConnectionTypeSchema.nullable().default(null),
  terminalLevels: z.number().int().nullable().default(null),
  voltageType: VoltageTypeSchema.nullable().default(null),
  minClearanceTopMm: z.number().nullable().default(null),
  minClearanceBottomMm: z.number().nullable().default(null),
  minClearanceSideMm: z.number().nullable().default(null),
  /** Zusaetzliche, baureihenspezifische Werte beliebiger Art. */
  customFields: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .default({}),
});
export type SeriesSharedFields = z.infer<typeof SeriesSharedFieldsSchema>;

/**
 * Baureihen-Vererbungsregel innerhalb eines Runs (CatalogSeries).
 * Verknuepft eine Herstellerbaureihe mit Default-Archetyp, geteilten Feldern
 * und erlaubten Zubehoer-Relationen fuer die gesamte Serie.
 */
export const SeriesOverrideSchema = z.object({
  id: z.string(),
  manufacturer: z.string(),
  seriesName: z.string(),
  defaultArchetypeId: z.string().nullable().default(null),
  sharedFields: SeriesSharedFieldsSchema,
  accessories: z.array(PartAccessoryRelationSchema).default([]),
  updatedAt: z.string().nullable().default(null),
});
export type SeriesOverride = z.infer<typeof SeriesOverrideSchema>;
