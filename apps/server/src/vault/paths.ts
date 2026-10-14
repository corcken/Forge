import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Aufloesung aller Out-of-Repo-Pfade unter `~/.descriptio-forge/`.
 * Nichts hiervon darf jemals im Git-Repository landen (Zero-Git-Leak).
 */
export interface VaultPaths {
  root: string;
  credentialsFile: string;
  globalDbFile: string;
  rawCacheDir: string;
  runsDir: string;
  exportsDir: string;
}

export const VAULT_DIR_NAME = '.descriptio-forge';

/** Loest das Vault-Wurzelverzeichnis plattformunabhaengig auf. */
export function resolveVaultPaths(): VaultPaths {
  const root = path.join(os.homedir(), VAULT_DIR_NAME);
  return {
    root,
    credentialsFile: path.join(root, 'credentials.json'),
    globalDbFile: path.join(root, 'global-vault.sqlite'),
    rawCacheDir: path.join(root, 'raw-cache'),
    runsDir: path.join(root, 'runs'),
    exportsDir: path.join(root, 'exports'),
  };
}

/** Stellt sicher, dass Wurzel und alle Unterordner existieren (idempotent). */
export function ensureVaultDirectories(paths: VaultPaths): void {
  for (const dir of [paths.root, paths.rawCacheDir, paths.runsDir, paths.exportsDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Wandelt einen Run-Namen in ein dateisystem-sicheres Kurz-Slug um. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
    .replace(/_+$/g, '') || 'run';
}

/** Baut aus einer Sequenznummer eine stabile Run-ID, z. B. `run_001`. */
export function buildRunId(sequence: number): string {
  return `run_${String(sequence).padStart(3, '0')}`;
}

/** Baut den Dateinamen der Run-Datenbank, z. B. `run_001_initial_sandbox.sqlite`. */
export function buildRunFilename(runId: string, name: string): string {
  return `${runId}_${slugify(name)}.sqlite`;
}

/** Absoluter Pfad einer Run-Datenbank innerhalb des runs/-Ordners. */
export function resolveRunDbPath(paths: VaultPaths, filename: string): string {
  return path.join(paths.runsDir, filename);
}
