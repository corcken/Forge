/**
 * SQL-DDL fuer eine isolierte Run-Datenbank
 * `~/.descriptio-forge/runs/run_<id>_<name>.sqlite`.
 *
 * Jeder Durchlauf besitzt eine eigene Datei mit diesem Schema und kann per
 * Datei-/Backup-Kopie innerhalb von Millisekunden geklont werden (Fork).
 */
export const RUN_MIGRATIONS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS series_overrides (
     id TEXT PRIMARY KEY,
     manufacturer TEXT NOT NULL,
     series_name TEXT NOT NULL,
     default_archetype_id TEXT,
     shared_fields_json TEXT NOT NULL,
     accessories_json TEXT DEFAULT '[]',
     updated_at TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS staged_parts (
     id TEXT PRIMARY KEY,
     manufacturer TEXT NOT NULL,
     article_nr TEXT NOT NULL,
     series_id TEXT REFERENCES series_overrides(id),
     archetype_id TEXT,
     pipeline_status TEXT NOT NULL DEFAULT 'PENDING_INGEST',
     quality_tier TEXT DEFAULT 'BRONZE',
     completeness_pct INTEGER DEFAULT 0,
     ai_raw_json TEXT,
     ai_model_used TEXT,
     ai_cost_usd REAL DEFAULT 0.0,
     compiled_part_json TEXT,
     field_origins_json TEXT DEFAULT '{}',
     manual_overrides_json TEXT DEFAULT '{}',
     validation_errors_json TEXT DEFAULT '[]',
     updated_at TEXT NOT NULL
   )`,

  `CREATE INDEX IF NOT EXISTS idx_staged_parts_status
     ON staged_parts(pipeline_status)`,

  `CREATE INDEX IF NOT EXISTS idx_staged_parts_series
     ON staged_parts(manufacturer, series_id)`,

  `CREATE TABLE IF NOT EXISTS compiled_function_groups (
     id TEXT PRIMARY KEY,
     part_id TEXT NOT NULL REFERENCES staged_parts(id) ON DELETE CASCADE,
     group_key TEXT NOT NULL,
     function_type TEXT NOT NULL,
     symbol_definition_id TEXT,
     potential_propagation TEXT NOT NULL,
     is_positively_driven INTEGER DEFAULT 0,
     origin_source TEXT DEFAULT 'ARC'
   )`,

  `CREATE TABLE IF NOT EXISTS compiled_pins (
     id TEXT PRIMARY KEY,
     part_id TEXT NOT NULL REFERENCES staged_parts(id) ON DELETE CASCADE,
     function_group_id TEXT REFERENCES compiled_function_groups(id) ON DELETE CASCADE,
     pin_name TEXT NOT NULL,
     contact_type TEXT NOT NULL,
     electrical_role TEXT NOT NULL,
     voltage_type TEXT NOT NULL,
     nominal_voltage REAL,
     min_voltage REAL,
     max_voltage REAL,
     max_current REAL,
     min_cross_sec REAL,
     max_cross_sec REAL,
     max_cross_sec_twin REAL,
     max_connections INTEGER DEFAULT 1,
     connection_type TEXT,
     stripping_length_mm REAL,
     torque_nm REAL,
     physical_offset_x REAL,
     physical_offset_y REAL,
     physical_offset_z REAL,
     wire_entry_direction TEXT,
     is_heuristic_geometry INTEGER DEFAULT 1,
     field_origins_json TEXT DEFAULT '{}',
     manual_overrides_json TEXT DEFAULT '{}'
   )`,
];
