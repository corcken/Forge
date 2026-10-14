import fs from 'node:fs';
import Database from 'better-sqlite3';
import { RUN_MIGRATIONS } from './schemas/run.schema.js';
import { GlobalVaultDb } from './global-db.js';
import {
  buildRunFilename,
  buildRunId,
  resolveRunDbPath,
  type VaultPaths,
} from './paths.js';
import { toRegisteredRun, type RegisteredRun, type RegisteredRunRow } from './vault-types.js';

const ACTIVE_RUN_SETTING_KEY = 'active_run_id';

/**
 * Verwaltet alle Run-Datenbanken in `~/.descriptio-forge/runs/`:
 * Erstellen, Klonen (Fork), Sperren, Loeschen und Aktivieren von Durchlaeufen.
 */
export class RunManager {
  private readonly connections = new Map<string, Database.Database>();

  constructor(
    private readonly globalDb: GlobalVaultDb,
    private readonly paths: VaultPaths,
  ) {}

  /** Alle registrierten Runs, neueste zuerst. */
  listRuns(): RegisteredRun[] {
    const rows = this.globalDb.db
      .prepare('SELECT * FROM registered_runs ORDER BY created_at DESC')
      .all() as RegisteredRunRow[];
    return rows.map(toRegisteredRun);
  }

  /** Ein registrierter Run oder null. */
  getRun(runId: string): RegisteredRun | null {
    const row = this.globalDb.db
      .prepare('SELECT * FROM registered_runs WHERE id = ?')
      .get(runId) as RegisteredRunRow | undefined;
    return row ? toRegisteredRun(row) : null;
  }

  /** Erstellt eine neue Run-Datenbank mit vollem Run-Schema. */
  createRun(name: string): RegisteredRun {
    if (!name.trim()) throw new Error('Run-Name darf nicht leer sein.');
    const runId = this.nextRunId();
    const filename = buildRunFilename(runId, name);
    const dbPath = resolveRunDbPath(this.paths, filename);
    this.applyRunSchema(dbPath);
    const now = new Date().toISOString();
    this.globalDb.db
      .prepare(
        `INSERT INTO registered_runs
           (id, name, sqlite_filename, parent_run_id, is_locked,
            part_count, validated_count, created_at, updated_at)
         VALUES (@id, @name, @filename, NULL, 0, 0, 0, @now, @now)`,
      )
      .run({ id: runId, name: name.trim(), filename, now });
    const created = this.getRun(runId);
    if (!created) throw new Error(`Run ${runId} konnte nicht registriert werden.`);
    return created;
  }

  /** Klont einen bestehenden Run atomar per better-sqlite3-Backup-API. */
  async forkRun(sourceRunId: string, newName: string): Promise<RegisteredRun> {
    const source = this.getRun(sourceRunId);
    if (!source) throw new Error(`Quell-Run ${sourceRunId} existiert nicht.`);
    if (!newName.trim()) throw new Error('Run-Name darf nicht leer sein.');

    const runId = this.nextRunId();
    const filename = buildRunFilename(runId, newName);
    const sourcePath = resolveRunDbPath(this.paths, source.sqliteFilename);
    const targetPath = resolveRunDbPath(this.paths, filename);

    const sourceDb = new Database(sourcePath, { readonly: true, fileMustExist: true });
    try {
      await sourceDb.backup(targetPath);
    } finally {
      sourceDb.close();
    }
    this.applyRunSchema(targetPath);

    const now = new Date().toISOString();
    this.globalDb.db
      .prepare(
        `INSERT INTO registered_runs
           (id, name, sqlite_filename, parent_run_id, is_locked,
            part_count, validated_count, created_at, updated_at)
         VALUES (@id, @name, @filename, @parent, 0, @parts, @validated, @now, @now)`,
      )
      .run({
        id: runId,
        name: newName.trim(),
        filename,
        parent: source.id,
        parts: source.partCount,
        validated: source.validatedCount,
        now,
      });
    const forked = this.getRun(runId);
    if (!forked) throw new Error(`Fork ${runId} konnte nicht registriert werden.`);
    return forked;
  }

  /** Schaltet die Sperre (READ_ONLY) eines Runs um. */
  toggleLockRun(runId: string): RegisteredRun {
    const run = this.getRun(runId);
    if (!run) throw new Error(`Run ${runId} existiert nicht.`);
    const nextLocked = run.isLocked ? 0 : 1;
    this.globalDb.db
      .prepare('UPDATE registered_runs SET is_locked = ?, updated_at = ? WHERE id = ?')
      .run(nextLocked, new Date().toISOString(), runId);
    if (nextLocked === 1) this.closeConnection(runId);
    const updated = this.getRun(runId);
    if (!updated) throw new Error(`Run ${runId} konnte nicht aktualisiert werden.`);
    return updated;
  }

  /** Loescht einen Run samt Datenbankdatei und WAL-Resten. */
  deleteRun(runId: string): void {
    const run = this.getRun(runId);
    if (!run) throw new Error(`Run ${runId} existiert nicht.`);
    if (run.isLocked) throw new Error(`Run ${runId} ist gesperrt und kann nicht geloescht werden.`);
    this.closeConnection(runId);
    const dbPath = resolveRunDbPath(this.paths, run.sqliteFilename);
    for (const suffix of ['', '-wal', '-shm']) {
      const target = `${dbPath}${suffix}`;
      if (fs.existsSync(target)) fs.rmSync(target, { force: true });
    }
    this.globalDb.db.prepare('DELETE FROM registered_runs WHERE id = ?').run(runId);
    if (this.getActiveRunId() === runId) {
      this.globalDb.setSetting(ACTIVE_RUN_SETTING_KEY, null);
    }
  }

  /** ID des aktuell aktiven Runs oder null. */
  getActiveRunId(): string | null {
    return this.globalDb.getSetting(ACTIVE_RUN_SETTING_KEY);
  }

  /** Der aktuell aktive Run oder null. */
  getActiveRun(): RegisteredRun | null {
    const id = this.getActiveRunId();
    return id ? this.getRun(id) : null;
  }

  /** Wechselt die aktive Run-Verbindung im Server zur Laufzeit. */
  switchActiveRun(runId: string): RegisteredRun {
    const run = this.getRun(runId);
    if (!run) throw new Error(`Run ${runId} existiert nicht.`);
    this.globalDb.setSetting(ACTIVE_RUN_SETTING_KEY, runId);
    return run;
  }

  /** Aktualisiert die Artikel-Zaehler eines Runs. */
  updateCounters(runId: string, partCount: number, validatedCount: number): void {
    this.globalDb.db
      .prepare(
        `UPDATE registered_runs
            SET part_count = ?, validated_count = ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(partCount, validatedCount, new Date().toISOString(), runId);
  }

  /** Oeffnet (oder liefert) die Run-Datenbankverbindung. */
  getRunDb(runId: string): Database.Database {
    const run = this.getRun(runId);
    if (!run) throw new Error(`Run ${runId} existiert nicht.`);
    const cached = this.connections.get(runId);
    if (cached) return cached;
    const dbPath = resolveRunDbPath(this.paths, run.sqliteFilename);
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    for (const statement of RUN_MIGRATIONS) db.exec(statement);
    this.connections.set(runId, db);
    return db;
  }

  /** Wirft, wenn der Run nicht beschreibbar ist (gesperrter Snapshot). */
  assertWritable(runId: string): void {
    const run = this.getRun(runId);
    if (!run) throw new Error(`Run ${runId} existiert nicht.`);
    if (run.isLocked) throw new Error(`Run ${runId} ist gesperrt (READ_ONLY).`);
  }

  /** Schliesst alle offenen Run-Verbindungen sauber. */
  closeAll(): void {
    for (const [runId, db] of this.connections) {
      if (db.open) {
        db.pragma('wal_checkpoint(TRUNCATE)');
        db.close();
      }
      this.connections.delete(runId);
    }
  }

  private applyRunSchema(dbPath: string): void {
    const db = new Database(dbPath);
    try {
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      for (const statement of RUN_MIGRATIONS) db.exec(statement);
    } finally {
      db.close();
    }
  }

  private closeConnection(runId: string): void {
    const db = this.connections.get(runId);
    if (!db) return;
    if (db.open) {
      db.pragma('wal_checkpoint(TRUNCATE)');
      db.close();
    }
    this.connections.delete(runId);
  }

  private nextRunId(): string {
    const rows = this.globalDb.db.prepare('SELECT id FROM registered_runs').all() as {
      id: string;
    }[];
    let max = 0;
    for (const { id } of rows) {
      const match = /^run_(\d+)$/.exec(id);
      if (match && match[1]) max = Math.max(max, Number(match[1]));
    }
    return buildRunId(max + 1);
  }
}

/** Standardname des beim ersten Start automatisch angelegten Sandbox-Runs. */
export const DEFAULT_SANDBOX_RUN_NAME = 'Initial Sandbox';
