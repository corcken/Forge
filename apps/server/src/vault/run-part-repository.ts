import type { CatalogFunctionGroup, CatalogPin } from '@descriptio-forge/shared';
import type { RunManager } from './run-manager.js';
import {
  toStagedPart,
  type CompiledSaveInput,
  type StagedPart,
  type StagedPartRow,
  type UpsertStagedPart,
} from './run-types.js';

/** Datenbankzugriff auf `staged_parts` und die kompilierten Gruppen/Pins. */
export class RunPartRepository {
  constructor(private readonly runManager: RunManager) {}

  listParts(runId: string): StagedPart[] {
    const rows = this.runManager
      .getRunDb(runId)
      .prepare('SELECT * FROM staged_parts ORDER BY updated_at DESC')
      .all() as StagedPartRow[];
    return rows.map(toStagedPart);
  }

  getPart(runId: string, partId: string): StagedPart | null {
    const row = this.runManager
      .getRunDb(runId)
      .prepare('SELECT * FROM staged_parts WHERE id = ?')
      .get(partId) as StagedPartRow | undefined;
    return row ? toStagedPart(row) : null;
  }

  /** Legt einen Staged-Part an oder aktualisiert die Stammdaten (Upsert). */
  upsertPart(runId: string, part: UpsertStagedPart): void {
    const now = new Date().toISOString();
    this.runManager
      .getRunDb(runId)
      .prepare(
        `INSERT INTO staged_parts
           (id, manufacturer, article_nr, series_id, archetype_id, pipeline_status,
            ai_raw_json, ai_model_used, ai_cost_usd, manual_overrides_json, updated_at)
         VALUES
           (@id, @manufacturer, @articleNr, @seriesId, @archetypeId, @pipelineStatus,
            @aiRawJson, @aiModelUsed, @aiCostUsd, @manualOverrides, @now)
         ON CONFLICT(id) DO UPDATE SET
           manufacturer = excluded.manufacturer,
           article_nr = excluded.article_nr,
           series_id = COALESCE(excluded.series_id, staged_parts.series_id),
           archetype_id = COALESCE(excluded.archetype_id, staged_parts.archetype_id),
           pipeline_status = excluded.pipeline_status,
           ai_raw_json = COALESCE(excluded.ai_raw_json, staged_parts.ai_raw_json),
           ai_model_used = COALESCE(excluded.ai_model_used, staged_parts.ai_model_used),
           ai_cost_usd = excluded.ai_cost_usd,
           manual_overrides_json = excluded.manual_overrides_json,
           updated_at = excluded.updated_at`,
      )
      .run({
        id: part.id,
        manufacturer: part.manufacturer,
        articleNr: part.articleNr,
        seriesId: part.seriesId ?? null,
        archetypeId: part.archetypeId ?? null,
        pipelineStatus: part.pipelineStatus ?? 'PENDING_INGEST',
        aiRawJson: part.aiRawJson ? JSON.stringify(part.aiRawJson) : null,
        aiModelUsed: part.aiModelUsed ?? null,
        aiCostUsd: part.aiCostUsd ?? 0,
        manualOverrides: JSON.stringify(part.manualOverrides ?? {}),
        now,
      });
  }

  /**
   * Persistiert das Compiler-Ergebnis inkl. flach kompiliertem Artikel, der
   * Feldherkunft, der Roh-Funktionsgruppen und -Pins (atomar in einer Tx).
   */
  saveCompiledResult(runId: string, partId: string, result: CompiledSaveInput): void {
    const db = this.runManager.getRunDb(runId);
    const update = db.prepare(
      `UPDATE staged_parts SET
         compiled_part_json = @compiledPart,
         field_origins_json = @fieldOrigins,
         validation_errors_json = @validationErrors,
         quality_tier = @qualityTier,
         completeness_pct = @completenessPct,
         pipeline_status = @pipelineStatus,
         archetype_id = @archetypeId,
         updated_at = @now
       WHERE id = @partId`,
    );
    const clearGroups = db.prepare('DELETE FROM compiled_function_groups WHERE part_id = ?');
    const insertGroup = db.prepare(
      `INSERT INTO compiled_function_groups
         (id, part_id, group_key, function_type, symbol_definition_id,
          potential_propagation, is_positively_driven, origin_source)
       VALUES (@id, @partId, @groupKey, @functionType, @symbolDefinitionId,
               @potentialPropagation, @isPositivelyDriven, @originSource)`,
    );
    const insertPin = db.prepare(
      `INSERT INTO compiled_pins
         (id, part_id, function_group_id, pin_name, contact_type, electrical_role,
          voltage_type, nominal_voltage, min_voltage, max_voltage, max_current,
          min_cross_sec, max_cross_sec, max_cross_sec_twin, max_connections,
          connection_type, stripping_length_mm, torque_nm, physical_offset_x,
          physical_offset_y, physical_offset_z, wire_entry_direction,
          is_heuristic_geometry, field_origins_json)
       VALUES
         (@id, @partId, @functionGroupId, @pinName, @contactType, @electricalRole,
          @voltageType, @nominalVoltage, @minVoltage, @maxVoltage, @maxCurrent,
          @minCrossSec, @maxCrossSec, @maxCrossSecTwin, @maxConnections,
          @connectionType, @strippingLengthMm, @torqueNm, @physicalOffsetX,
          @physicalOffsetY, @physicalOffsetZ, @wireEntryDirection,
          @isHeuristicGeometry, @fieldOrigins)`,
    );
    const groups = result.compiledPart?.functionGroups ?? [];
    const tx = db.transaction(() => {
      update.run({
        compiledPart: result.compiledPart ? JSON.stringify(result.compiledPart) : null,
        fieldOrigins: JSON.stringify(result.fieldOrigins),
        validationErrors: JSON.stringify(result.validationErrors),
        qualityTier: result.qualityTier,
        completenessPct: result.completenessPct,
        pipelineStatus: result.pipelineStatus,
        archetypeId: result.archetypeId,
        now: new Date().toISOString(),
        partId,
      });
      clearGroups.run(partId);
      for (const group of groups) {
        insertGroup.run(toGroupParams(partId, group));
        for (const pin of group.pins) insertPin.run(toPinParams(partId, pin));
      }
    });
    tx();
  }

  /** Anzahl der Pins/Funktionsgruppen-Zaehler je Run. */
  countParts(runId: string): { total: number; validated: number } {
    const row = this.runManager
      .getRunDb(runId)
      .prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN pipeline_status = 'VALIDATED' THEN 1 ELSE 0 END) AS validated
           FROM staged_parts`,
      )
      .get() as { total: number; validated: number | null };
    return { total: row.total, validated: row.validated ?? 0 };
  }
}

function toGroupParams(partId: string, group: CatalogFunctionGroup): Record<string, unknown> {
  return {
    id: group.id,
    partId,
    groupKey: group.groupKey,
    functionType: group.functionType,
    symbolDefinitionId: group.symbolDefinitionId,
    potentialPropagation: group.potentialPropagation,
    isPositivelyDriven: group.isPositivelyDriven ? 1 : 0,
    originSource: group.originSource,
  };
}

function toPinParams(partId: string, pin: CatalogPin): Record<string, unknown> {
  return {
    id: pin.id,
    partId,
    functionGroupId: pin.functionGroupId,
    pinName: pin.pinName,
    contactType: pin.contactType,
    electricalRole: pin.electricalRole,
    voltageType: pin.voltageType,
    nominalVoltage: pin.nominalVoltage,
    minVoltage: pin.minVoltage,
    maxVoltage: pin.maxVoltage,
    maxCurrent: pin.maxCurrent,
    minCrossSec: pin.minCrossSec,
    maxCrossSec: pin.maxCrossSec,
    maxCrossSecTwin: pin.maxCrossSecTwin,
    maxConnections: pin.maxConnections,
    connectionType: pin.connectionType,
    strippingLengthMm: pin.strippingLengthMm,
    torqueNm: pin.torqueNm,
    physicalOffsetX: pin.physicalOffsetX,
    physicalOffsetY: pin.physicalOffsetY,
    physicalOffsetZ: pin.physicalOffsetZ,
    wireEntryDirection: pin.wireEntryDirection,
    isHeuristicGeometry: pin.isHeuristicGeometry ? 1 : 0,
    fieldOrigins: JSON.stringify(pin.fieldOrigins),
  };
}
