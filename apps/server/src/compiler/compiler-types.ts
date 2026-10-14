import type {
  AiExtractionOutput,
  CatalogPartVersion,
  FieldOriginsMap,
  IecArchetype,
  QualityTier,
  SeriesOverride,
} from '@descriptio-forge/shared';

/** Eingabe fuer den reinen, deterministischen Compiler-Lauf (Stufe 3). */
export interface CompilePartInput {
  partId: string;
  manufacturer: string;
  articleNr: string;
  facts: AiExtractionOutput;
  archetype: IecArchetype;
  series: SeriesOverride | null;
  manualOverrides: Record<string, unknown>;
}

/** Ergebnis eines Compile-Laufs inkl. Validierungsstatus (Stufe 3 + 4). */
export interface CompileResult {
  part: CatalogPartVersion | null;
  fieldOrigins: FieldOriginsMap;
  validationErrors: string[];
  qualityTier: QualityTier;
  completenessPct: number;
  status: 'VALIDATED' | 'ERROR';
}

/** Kompakte Zusammenfassung fuer das UI (24px-Grid). */
export interface CompileSummary {
  runId: string;
  partId: string;
  status: 'VALIDATED' | 'ERROR';
  qualityTier: QualityTier;
  completenessPct: number;
  validationErrors: string[];
  durationMs: number;
  groupCount: number;
  pinCount: number;
  archetypeId: string;
}

/** Zusammenfassung eines Batch-Compiler-Laufs. */
export interface CompileBatchSummary {
  compiled: number;
  errors: number;
  totalDurationMs: number;
  results: CompileSummary[];
}
