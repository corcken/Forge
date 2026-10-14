/**
 * Gemeinsame Datentypen der Vault-Schicht (bewusst frei von better-sqlite3,
 * damit Frontend-naher Code sie nutzen kann).
 */

/** Ein im globalen Register eingetragener Durchlauf. */
export interface RegisteredRun {
  id: string;
  name: string;
  sqliteFilename: string;
  parentRunId: string | null;
  isLocked: boolean;
  partCount: number;
  validatedCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Rohzeile der Tabelle `registered_runs` (snake_case). */
export interface RegisteredRunRow {
  id: string;
  name: string;
  sqlite_filename: string;
  parent_run_id: string | null;
  is_locked: number;
  part_count: number;
  validated_count: number;
  created_at: string;
  updated_at: string;
}

/** An das Frontend ausgelieferte, maskierte Provider-Key-Info (nie der Key!). */
export interface MaskedCredentialStatus {
  providerId: string;
  hasKey: boolean;
  maskedPreview: string | null;
  baseUrl: string | null;
}

export const toRegisteredRun = (row: RegisteredRunRow): RegisteredRun => ({
  id: row.id,
  name: row.name,
  sqliteFilename: row.sqlite_filename,
  parentRunId: row.parent_run_id,
  isLocked: row.is_locked === 1,
  partCount: row.part_count,
  validatedCount: row.validated_count,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
