import {
  CatalogPartVersionSchema,
  coerceAiExtractionOutput,
  type AiExtractionOutput,
  type CatalogPartVersion,
  type FieldOriginsMap,
  type PipelineStatus,
  type QualityTier,
} from '@descriptio-forge/shared';

/** Ein im Run gespeicherter Artikel (Staging + kompiliertes Ergebnis). */
export interface StagedPart {
  id: string;
  manufacturer: string;
  articleNr: string;
  seriesId: string | null;
  archetypeId: string | null;
  pipelineStatus: PipelineStatus;
  qualityTier: QualityTier;
  completenessPct: number;
  aiRawJson: AiExtractionOutput | null;
  aiModelUsed: string | null;
  aiCostUsd: number;
  compiledPart: CatalogPartVersion | null;
  fieldOrigins: FieldOriginsMap;
  manualOverrides: Record<string, unknown>;
  validationErrors: string[];
  updatedAt: string;
}

/** Eingabe fuer das Anlegen/Aktualisieren eines Staged-Parts. */
export interface UpsertStagedPart {
  id: string;
  manufacturer: string;
  articleNr: string;
  seriesId?: string | null;
  archetypeId?: string | null;
  pipelineStatus?: PipelineStatus;
  aiRawJson?: AiExtractionOutput | null;
  aiModelUsed?: string | null;
  aiCostUsd?: number;
  manualOverrides?: Record<string, unknown>;
}

/** Eingabe zum Speichern eines compiler-Ergebnisses. */
export interface CompiledSaveInput {
  compiledPart: CatalogPartVersion | null;
  fieldOrigins: FieldOriginsMap;
  validationErrors: string[];
  qualityTier: QualityTier;
  completenessPct: number;
  pipelineStatus: PipelineStatus;
  archetypeId: string;
}

export interface StagedPartRow {
  id: string;
  manufacturer: string;
  article_nr: string;
  series_id: string | null;
  archetype_id: string | null;
  pipeline_status: string;
  quality_tier: string;
  completeness_pct: number;
  ai_raw_json: string | null;
  ai_model_used: string | null;
  ai_cost_usd: number;
  compiled_part_json: string | null;
  field_origins_json: string | null;
  manual_overrides_json: string | null;
  validation_errors_json: string | null;
  updated_at: string;
}

/** Wandelt eine DB-Zeile in ein typisiertes StagedPart um (defensiv). */
export function toStagedPart(row: StagedPartRow): StagedPart {
  return {
    id: row.id,
    manufacturer: row.manufacturer,
    articleNr: row.article_nr,
    seriesId: row.series_id,
    archetypeId: row.archetype_id,
    pipelineStatus: row.pipeline_status as PipelineStatus,
    qualityTier: row.quality_tier as QualityTier,
    completenessPct: row.completeness_pct,
    aiRawJson: parseAiRaw(row.ai_raw_json),
    aiModelUsed: row.ai_model_used,
    aiCostUsd: row.ai_cost_usd,
    compiledPart: parseCompiled(row.compiled_part_json),
    fieldOrigins: parseObject<FieldOriginsMap>(row.field_origins_json, {} as FieldOriginsMap),
    manualOverrides: parseObject<Record<string, unknown>>(row.manual_overrides_json, {}),
    validationErrors: parseArray(row.validation_errors_json),
    updatedAt: row.updated_at,
  };
}

function parseAiRaw(json: string | null): AiExtractionOutput | null {
  if (!json) return null;
  try {
    return coerceAiExtractionOutput(JSON.parse(json));
  } catch {
    return null;
  }
}

function parseCompiled(json: string | null): CatalogPartVersion | null {
  if (!json) return null;
  try {
    const parsed = CatalogPartVersionSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function parseObject<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function parseArray(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}
