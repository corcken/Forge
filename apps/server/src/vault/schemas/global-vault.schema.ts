/**
 * SQL-DDL fuer den globalen Tresor `~/.descriptio-forge/global-vault.sqlite`.
 *
 * Dieses Schema ueberlebt ALLE Runs und wird niemals zurueckgesetzt:
 * Rohdaten-Cache, KI-Provider/-Modelle, IEC-Archetypen, Symbolbibliothek
 * sowie das Run-Register.
 */
export const GLOBAL_VAULT_MIGRATIONS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS ai_providers (
     id TEXT PRIMARY KEY,
     display_name TEXT NOT NULL,
     base_url TEXT NOT NULL,
     adapter_type TEXT NOT NULL,
     is_enabled INTEGER DEFAULT 1,
     last_test_status TEXT DEFAULT 'UNTESTED',
     last_latency_ms INTEGER,
     last_error_msg TEXT,
     last_tested_at TEXT
   )`,

  `CREATE TABLE IF NOT EXISTS ai_models (
     id TEXT PRIMARY KEY,
     provider_id TEXT NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
     model_id TEXT NOT NULL,
     display_name TEXT NOT NULL,
     context_window INTEGER DEFAULT 128000,
     input_price_per_1m REAL DEFAULT 0.0,
     output_price_per_1m REAL DEFAULT 0.0,
     supports_vision INTEGER DEFAULT 0,
     supports_json_schema INTEGER DEFAULT 1,
     is_active INTEGER DEFAULT 1,
     assigned_tasks_json TEXT DEFAULT '[]'
   )`,

  `CREATE TABLE IF NOT EXISTS raw_documents (
     id TEXT PRIMARY KEY,
     manufacturer TEXT NOT NULL,
     article_nr TEXT NOT NULL,
     source_type TEXT NOT NULL,
     source_url TEXT,
     local_file_path TEXT,
     extracted_markdown TEXT,
     file_hash_sha256 TEXT,
     created_at TEXT NOT NULL
   )`,

  `CREATE INDEX IF NOT EXISTS idx_raw_docs_lookup
     ON raw_documents(manufacturer, article_nr)`,

  `CREATE TABLE IF NOT EXISTS iec_archetypes (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     category TEXT NOT NULL,
     default_bmk_prefix TEXT NOT NULL,
     mounting_type_default TEXT,
     function_groups_template_json TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS symbol_library (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     iec_60617_ref TEXT,
     bmk_prefix TEXT NOT NULL,
     grid_base_mm REAL DEFAULT 4.0,
     svg_content TEXT NOT NULL,
     pins_json TEXT NOT NULL,
     origin_type TEXT DEFAULT 'STANDARD',
     updated_at TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS registered_runs (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     sqlite_filename TEXT NOT NULL,
     parent_run_id TEXT,
     is_locked INTEGER DEFAULT 0,
     part_count INTEGER DEFAULT 0,
     validated_count INTEGER DEFAULT 0,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,

  `CREATE TABLE IF NOT EXISTS global_settings (
     key TEXT PRIMARY KEY,
     value TEXT,
     updated_at TEXT NOT NULL
   )`,
];
