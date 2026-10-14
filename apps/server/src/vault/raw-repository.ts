import type { RawSourceType } from '@descriptio-forge/shared';
import type { GlobalVaultDb, RawDocumentRecord } from './global-db.js';

/** Eingabe zum Schreiben/Aktualisieren eines Rohdokuments. */
export interface RawDocumentInput {
  id: string;
  manufacturer: string;
  articleNr: string;
  sourceType: RawSourceType;
  sourceUrl: string | null;
  localFilePath: string | null;
  extractedMarkdown: string | null;
  fileHashSha256: string | null;
}

interface RawRow {
  id: string;
  manufacturer: string;
  article_nr: string;
  source_type: string;
  source_url: string | null;
  local_file_path: string | null;
  extracted_markdown: string | null;
}

/** Datenbankzugriff auf den globalen Rohdaten-Cache (`raw_documents`). */
export class RawDocumentRepository {
  constructor(private readonly globalDb: GlobalVaultDb) {}

  upsert(doc: RawDocumentInput): void {
    this.globalDb.db
      .prepare(
        `INSERT OR REPLACE INTO raw_documents
           (id, manufacturer, article_nr, source_type, source_url,
            local_file_path, extracted_markdown, file_hash_sha256, created_at)
         VALUES (@id, @manufacturer, @articleNr, @sourceType, @sourceUrl,
                 @localFilePath, @extractedMarkdown, @fileHash, @createdAt)`,
      )
      .run({ ...doc, fileHash: doc.fileHashSha256, createdAt: new Date().toISOString() });
  }

  list(): RawDocumentRecord[] {
    const rows = this.globalDb.db
      .prepare('SELECT * FROM raw_documents ORDER BY created_at DESC')
      .all() as RawRow[];
    return rows.map((row) => ({
      id: row.id,
      manufacturer: row.manufacturer,
      articleNr: row.article_nr,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      localFilePath: row.local_file_path,
      extractedMarkdown: row.extracted_markdown,
    }));
  }
}
