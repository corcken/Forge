import Database from 'better-sqlite3';
import { IecArchetypeSchema, type IecArchetype } from '@descriptio-forge/shared';
import { GLOBAL_VAULT_MIGRATIONS } from './schemas/global-vault.schema.js';
import { STANDARD_IEC_ARCHETYPES } from './seeds/archetype-seeds.js';

interface ArchetypeRow {
  id: string;
  name: string;
  category: string;
  default_bmk_prefix: string;
  mounting_type_default: string | null;
  function_groups_template_json: string;
  updated_at: string;
}

/** Ein im globalen Rohdaten-Cache liegendes Dokument. */
export interface RawDocumentRecord {
  id: string;
  manufacturer: string;
  articleNr: string;
  sourceType: string;
  sourceUrl: string | null;
  localFilePath: string | null;
  extractedMarkdown: string | null;
}

interface RawDocumentRow {
  id: string;
  manufacturer: string;
  article_nr: string;
  source_type: string;
  source_url: string | null;
  local_file_path: string | null;
  extracted_markdown: string | null;
}

/**
 * Verbindungs-Singleton fuer den globalen Tresor `global-vault.sqlite`.
 * Oeffnet die Datenbank im WAL-Modus, fuehrt alle Migrationen aus und seedet
 * beim ersten Start die Standard-IEC-Archetypen.
 */
export class GlobalVaultDb {
  readonly db: Database.Database;

  constructor(readonly filePath: string) {
    this.db = new Database(filePath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
    this.seedArchetypes();
  }

  private migrate(): void {
    for (const statement of GLOBAL_VAULT_MIGRATIONS) {
      this.db.exec(statement);
    }
  }

  private seedArchetypes(): void {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM iec_archetypes').get() as {
      count: number;
    };
    if (row.count > 0) return;
    const insert = this.db.prepare(
      `INSERT OR REPLACE INTO iec_archetypes
         (id, name, category, default_bmk_prefix, mounting_type_default,
          function_groups_template_json, updated_at)
       VALUES
         (@id, @name, @category, @default_bmk_prefix, @mounting_type_default,
          @function_groups_template_json, @updated_at)`,
    );
    const insertMany = this.db.transaction((archetypes: readonly IecArchetype[]) => {
      for (const archetype of archetypes) {
        insert.run(toArchetypeParams(archetype));
      }
    });
    insertMany(STANDARD_IEC_ARCHETYPES);
  }

  /** Legt einen Archetyp an oder aktualisiert ihn (Upsert). */
  upsertArchetype(archetype: IecArchetype): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO iec_archetypes
           (id, name, category, default_bmk_prefix, mounting_type_default,
            function_groups_template_json, updated_at)
         VALUES
           (@id, @name, @category, @default_bmk_prefix, @mounting_type_default,
            @function_groups_template_json, @updated_at)`,
      )
      .run(toArchetypeParams(archetype));
  }

  /** Alle Archetypen, vollstaendig validiert als IecArchetype. */
  listArchetypes(): IecArchetype[] {
    const rows = this.db
      .prepare('SELECT * FROM iec_archetypes ORDER BY category, id')
      .all() as ArchetypeRow[];
    return rows.map(fromArchetypeRow);
  }

  /** Einzelner Archetyp oder null. */
  getArchetype(id: string): IecArchetype | null {
    const row = this.db.prepare('SELECT * FROM iec_archetypes WHERE id = ?').get(id) as
      | ArchetypeRow
      | undefined;
    return row ? fromArchetypeRow(row) : null;
  }

  /** Sucht im globalen Rohdaten-Cache (nie doppelt scrapen). */
  findRawDocument(manufacturer: string, articleNr: string): RawDocumentRecord | null {
    const row = this.db
      .prepare(
        `SELECT * FROM raw_documents
          WHERE manufacturer = ? AND article_nr = ?
          ORDER BY created_at DESC LIMIT 1`,
      )
      .get(manufacturer, articleNr) as RawDocumentRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      manufacturer: row.manufacturer,
      articleNr: row.article_nr,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      localFilePath: row.local_file_path,
      extractedMarkdown: row.extracted_markdown,
    };
  }

  /** Liest einen globalen Setting-Wert (z. B. aktiver Run). */
  getSetting(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM global_settings WHERE key = ?').get(key) as
      | { value: string | null }
      | undefined;
    return row?.value ?? null;
  }

  /** Schreibt einen globalen Setting-Wert (Upsert). */
  setSetting(key: string, value: string | null): void {
    this.db
      .prepare(
        `INSERT INTO global_settings (key, value, updated_at)
         VALUES (@key, @value, @updated_at)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .run({ key, value, updated_at: new Date().toISOString() });
  }

  /** Schliesst die Verbindung sauber (inkl. WAL-Checkpoint). */
  close(): void {
    if (this.db.open) {
      this.db.pragma('wal_checkpoint(TRUNCATE)');
      this.db.close();
    }
  }
}

function toArchetypeParams(archetype: IecArchetype): Record<string, unknown> {
  const validated = IecArchetypeSchema.parse(archetype);
  return {
    id: validated.id,
    name: validated.name,
    category: validated.category,
    default_bmk_prefix: validated.defaultBmkPrefix,
    mounting_type_default: validated.mountingTypeDefault,
    function_groups_template_json: JSON.stringify(validated.functionGroupsTemplate),
    updated_at: new Date().toISOString(),
  };
}

function fromArchetypeRow(row: ArchetypeRow): IecArchetype {
  return IecArchetypeSchema.parse({
    id: row.id,
    name: row.name,
    category: row.category,
    defaultBmkPrefix: row.default_bmk_prefix,
    mountingTypeDefault: row.mounting_type_default,
    functionGroupsTemplate: JSON.parse(row.function_groups_template_json) as unknown,
    updatedAt: row.updated_at,
  });
}
