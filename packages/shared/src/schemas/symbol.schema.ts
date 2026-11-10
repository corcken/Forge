import { z } from 'zod';

/** Richtung eines Anschlusspunktes im E-CAD Schaltplan. */
export const SymbolPinDirectionSchema = z.enum(['TOP', 'BOTTOM', 'LEFT', 'RIGHT']);
export type SymbolPinDirection = z.infer<typeof SymbolPinDirectionSchema>;

/** Ein einzelner Anschlusspunkt auf dem 4mm/8mm CAD-Raster. */
export const SymbolPinPointSchema = z.object({
  pinIndex: z.number().int().min(1),
  defaultLabel: z.string(),
  xMm: z.number(),
  yMm: z.number(),
  direction: SymbolPinDirectionSchema,
});
export type SymbolPinPoint = z.infer<typeof SymbolPinPointSchema>;

/** Herkunft des Symbols (Norm-Vorgabe, KI-gesammelt, manuell editiert). */
export const SymbolOriginTypeSchema = z.enum(['STANDARD', 'AI_GENERATED', 'MANUAL']);
export type SymbolOriginType = z.infer<typeof SymbolOriginTypeSchema>;

/** Vollstaendiges IEC 60617 E-CAD Symbol. */
export const SymbolDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  iec60617Ref: z.string().nullable().default(null),
  classicRef: z.string().nullable().default(null),
  partNumber: z.string().nullable().default(null),
  bmkPrefix: z.string().min(1),
  gridBaseMm: z.number().default(4.0),
  svgContent: z.string().min(1),
  pins: z.array(SymbolPinPointSchema),
  originType: SymbolOriginTypeSchema.default('STANDARD'),
  updatedAt: z.string(),
});
export type SymbolDefinition = z.infer<typeof SymbolDefinitionSchema>;

/** Filter- und Suchkriterien fuer die Symbol-Bibliothek. */
export const SymbolFilterSchema = z.object({
  search: z.string().optional(),
  bmkPrefix: z.string().optional(),
  originType: SymbolOriginTypeSchema.optional(),
  iecPart: z.string().optional(),
});
export type SymbolFilter = z.infer<typeof SymbolFilterSchema>;

/** Statistiken ueber die geladenen Symbole. */
export const SymbolStatsSchema = z.object({
  total: z.number(),
  standardCount: z.number(),
  aiGeneratedCount: z.number(),
  manualCount: z.number(),
  partCounts: z.record(z.string(), z.number()),
});
export type SymbolStats = z.infer<typeof SymbolStatsSchema>;
