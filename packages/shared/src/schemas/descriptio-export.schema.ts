import { z } from 'zod';
import {
  ArchetypeCategorySchema,
  ConnectionTypeSchema,
  ContactTypeSchema,
  ElectricalRoleSchema,
  FieldOriginsMapSchema,
  FunctionGroupTypeSchema,
  MountingTypeSchema,
  OriginSourceSchema,
  PotentialPropagationSchema,
  QualityTierSchema,
  VoltageTypeSchema,
  WireEntryDirectionSchema,
} from './origins.schema.js';

/** Art einer Zubehoer-/Accessoire-Relation. */
export const AccessoryTypeSchema = z.enum([
  'AUXILIARY_CONTACT',
  'SURGE_PROTECTION',
  'MOUNTING',
  'END_STOP',
  'LINK',
  'LABEL',
  'TERMINAL',
  'OTHER',
]);
export type AccessoryType = z.infer<typeof AccessoryTypeSchema>;

/** Leitertyp einer Kabel-/Ader-Endbehandlung. */
export const ConductorClassSchema = z.enum(['SOLID', 'STRANDED', 'FLEXIBLE']);
export type ConductorClass = z.infer<typeof ConductorClassSchema>;

/** Relation eines Artikels zu einem benoetigten Zubehoerartikel. */
export const PartAccessoryRelationSchema = z.object({
  id: z.string().nullable().default(null),
  accessoryPartId: z.string(),
  accessoryManufacturer: z.string().nullable().default(null),
  accessoryArticleNr: z.string().nullable().default(null),
  accessoryType: AccessoryTypeSchema,
  requiredQuantity: z.number().positive().default(1),
  isMandatory: z.boolean().default(false),
  mountingPosition: z.string().nullable().default(null),
  notes: z.string().nullable().default(null),
});
export type PartAccessoryRelation = z.infer<typeof PartAccessoryRelationSchema>;

/** Empfohlene Kabel-/Adernspezifikation eines Artikels. */
export const CatalogCableSpecSchema = z.object({
  id: z.string().nullable().default(null),
  crossSectionMm2: z.number().nullable().default(null),
  minCrossSectionMm2: z.number().nullable().default(null),
  maxCrossSectionMm2: z.number().nullable().default(null),
  conductorCount: z.number().int().nullable().default(null),
  conductorClass: ConductorClassSchema.nullable().default(null),
  conductorMaterial: z.string().nullable().default(null),
  insulationMaterial: z.string().nullable().default(null),
  outerDiameterMm: z.number().nullable().default(null),
  minBendRadiusMm: z.number().nullable().default(null),
  color: z.string().nullable().default(null),
  fieldOrigins: FieldOriginsMapSchema.default({}),
});
export type CatalogCableSpec = z.infer<typeof CatalogCableSpecSchema>;

/** Ein einzelner kompilierter Anschluss (Pin) eines Artikels. */
export const CatalogPinSchema = z.object({
  id: z.string(),
  functionGroupId: z.string().nullable().default(null),
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
  physicalOffsetX: z.number().nullable().default(null),
  physicalOffsetY: z.number().nullable().default(null),
  physicalOffsetZ: z.number().nullable().default(null),
  wireEntryDirection: WireEntryDirectionSchema.nullable().default(null),
  isHeuristicGeometry: z.boolean().default(true),
  fieldOrigins: FieldOriginsMapSchema.default({}),
});
export type CatalogPin = z.infer<typeof CatalogPinSchema>;

/** Eine kompilierte Funktionsgruppe (Spule, Kontaktblock, Klemmen-Durchgang). */
export const CatalogFunctionGroupSchema = z.object({
  id: z.string(),
  groupKey: z.string(),
  functionType: FunctionGroupTypeSchema,
  label: z.string().nullable().default(null),
  bmkPrefix: z.string().nullable().default(null),
  symbolDefinitionId: z.string().nullable().default(null),
  potentialPropagation: PotentialPropagationSchema,
  isPositivelyDriven: z.boolean().default(false),
  originSource: OriginSourceSchema.default('ARC'),
  pins: z.array(CatalogPinSchema).default([]),
});
export type CatalogFunctionGroup = z.infer<typeof CatalogFunctionGroupSchema>;

/** Flach kompilierte Artikelversion - das Herzstueck des Exports. */
export const CatalogPartVersionSchema = z.object({
  id: z.string(),
  version: z.string().default('1.0'),
  name: z.string(),
  description: z.string().nullable().default(null),

  archetypeId: z.string().nullable().default(null),
  category: ArchetypeCategorySchema.nullable().default(null),
  mountingType: MountingTypeSchema.nullable().default(null),
  seriesName: z.string().nullable().default(null),

  width: z.number().nullable().default(null),
  height: z.number().nullable().default(null),
  depth: z.number().nullable().default(null),
  weight: z.number().nullable().default(null),
  dinRailMountOffsetY: z.number().nullable().default(null),

  powerLoss: z.number().nullable().default(null),
  mainCurrentAmps: z.number().nullable().default(null),
  coilNominalVoltage: z.number().nullable().default(null),
  coilVoltageType: VoltageTypeSchema.nullable().default(null),
  minCrossSec: z.number().nullable().default(null),
  maxCrossSec: z.number().nullable().default(null),
  torqueNm: z.number().nullable().default(null),
  strippingLengthMm: z.number().nullable().default(null),
  connectionType: ConnectionTypeSchema.nullable().default(null),
  terminalLevels: z.number().int().nullable().default(null),

  functionGroups: z.array(CatalogFunctionGroupSchema).default([]),
  cableSpec: CatalogCableSpecSchema.nullable().default(null),
  accessoryRelations: z.array(PartAccessoryRelationSchema).default([]),

  fieldOrigins: FieldOriginsMapSchema.default({}),
  isManuallyCurated: z.boolean().default(false),
  completenessPct: z.number().int().min(0).max(100).default(0),
  qualityTier: QualityTierSchema.nullable().default(null),
});
export type CatalogPartVersion = z.infer<typeof CatalogPartVersionSchema>;

/** Ein Katalogartikel mit einer oder mehreren Versionen. */
export const CatalogPartSchema = z.object({
  id: z.string(),
  manufacturer: z.string(),
  articleNr: z.string(),
  name: z.string(),
  type: z.string().nullable().default(null),
  seriesName: z.string().nullable().default(null),
  category: ArchetypeCategorySchema.nullable().default(null),
  archetypeId: z.string().nullable().default(null),
  versions: z.array(CatalogPartVersionSchema).min(1),
});
export type CatalogPart = z.infer<typeof CatalogPartSchema>;

/** Kopf eines kompletten, flach kompilierten Export-Pakets fuer Descriptio. */
export const DescriptioExportPackageSchema = z.object({
  schemaVersion: z.literal('1.0'),
  generatedAt: z.string(),
  appVersion: z.string(),
  importHash: z.string(),
  parts: z.array(CatalogPartSchema),
});
export type DescriptioExportPackage = z.infer<typeof DescriptioExportPackageSchema>;
