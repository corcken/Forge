import {
  PartAccessoryRelationSchema,
  SeriesSharedFieldsSchema,
  type PartAccessoryRelation,
  type SeriesOverride,
  type SeriesSharedFields,
} from '@descriptio-forge/shared';
import type { RunManager } from './run-manager.js';

interface SeriesRow {
  id: string;
  manufacturer: string;
  series_name: string;
  default_archetype_id: string | null;
  shared_fields_json: string;
  accessories_json: string | null;
  updated_at: string;
}

/** Datenbankzugriff auf die Baureihen-Vererbungsregeln eines Runs. */
export class RunSeriesRepository {
  constructor(private readonly runManager: RunManager) {}

  listSeries(runId: string): SeriesOverride[] {
    const rows = this.runManager
      .getRunDb(runId)
      .prepare('SELECT * FROM series_overrides ORDER BY manufacturer, series_name')
      .all() as SeriesRow[];
    return rows.map(toSeriesOverride);
  }

  getSeries(runId: string, seriesId: string): SeriesOverride | null {
    const row = this.runManager
      .getRunDb(runId)
      .prepare('SELECT * FROM series_overrides WHERE id = ?')
      .get(seriesId) as SeriesRow | undefined;
    return row ? toSeriesOverride(row) : null;
  }

  /** Sucht eine Baureihe anhand Hersteller + Serienname (case-insensitive). */
  findSeriesByName(
    runId: string,
    manufacturer: string,
    seriesName: string,
  ): SeriesOverride | null {
    const row = this.runManager
      .getRunDb(runId)
      .prepare(
        `SELECT * FROM series_overrides
          WHERE lower(manufacturer) = lower(?) AND lower(series_name) = lower(?)`,
      )
      .get(manufacturer, seriesName) as SeriesRow | undefined;
    return row ? toSeriesOverride(row) : null;
  }

  /** Legt eine Baureihe an oder aktualisiert sie (Upsert). */
  upsertSeries(runId: string, series: SeriesOverride): void {
    this.runManager
      .getRunDb(runId)
      .prepare(
        `INSERT INTO series_overrides
           (id, manufacturer, series_name, default_archetype_id,
            shared_fields_json, accessories_json, updated_at)
         VALUES
           (@id, @manufacturer, @seriesName, @defaultArchetypeId,
            @sharedFields, @accessories, @now)
         ON CONFLICT(id) DO UPDATE SET
           manufacturer = excluded.manufacturer,
           series_name = excluded.series_name,
           default_archetype_id = excluded.default_archetype_id,
           shared_fields_json = excluded.shared_fields_json,
           accessories_json = excluded.accessories_json,
           updated_at = excluded.updated_at`,
      )
      .run({
        id: series.id,
        manufacturer: series.manufacturer,
        seriesName: series.seriesName,
        defaultArchetypeId: series.defaultArchetypeId,
        sharedFields: JSON.stringify(series.sharedFields),
        accessories: JSON.stringify(series.accessories),
        now: new Date().toISOString(),
      });
  }

  deleteSeries(runId: string, seriesId: string): void {
    this.runManager.getRunDb(runId).prepare('DELETE FROM series_overrides WHERE id = ?').run(seriesId);
  }
}

function toSeriesOverride(row: SeriesRow): SeriesOverride {
  return {
    id: row.id,
    manufacturer: row.manufacturer,
    seriesName: row.series_name,
    defaultArchetypeId: row.default_archetype_id,
    sharedFields: parseSharedFields(row.shared_fields_json),
    accessories: parseAccessories(row.accessories_json),
    updatedAt: row.updated_at,
  };
}

function parseSharedFields(json: string): SeriesSharedFields {
  try {
    const parsed = SeriesSharedFieldsSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : SeriesSharedFieldsSchema.parse({});
  } catch {
    return SeriesSharedFieldsSchema.parse({});
  }
}

function parseAccessories(json: string | null): PartAccessoryRelation[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => PartAccessoryRelationSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    return [];
  }
}
