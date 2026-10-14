import { CredentialsStore } from './credentials-store.js';
import { GlobalVaultDb } from './global-db.js';
import { DEFAULT_SANDBOX_RUN_NAME, RunManager } from './run-manager.js';
import { ensureVaultDirectories, resolveVaultPaths, type VaultPaths } from './paths.js';

/** Gebuendelte, an die tRPC-Routen durchgereichte Vault-Dienste. */
export interface VaultServices {
  paths: VaultPaths;
  credentials: CredentialsStore;
  globalDb: GlobalVaultDb;
  runManager: RunManager;
  shutdown: () => void;
}

/**
 * Bootstrapping des Out-of-Repo-Tresors (Ablauf 1):
 *  1. Pfade aufloesen + Ordnerstruktur sicherstellen
 *  2. credentials.json anlegen (chmod 600), falls nicht vorhanden
 *  3. global-vault.sqlite oeffnen, migrieren und Archetypen seeden
 *  4. Aktiven Run ermitteln - oder einen Sandbox-Run anlegen und mounten
 */
export function initializeVault(): VaultServices {
  const paths = resolveVaultPaths();
  ensureVaultDirectories(paths);

  const credentials = new CredentialsStore(paths.credentialsFile);
  credentials.ensureFile();

  const globalDb = new GlobalVaultDb(paths.globalDbFile);
  const runManager = new RunManager(globalDb, paths);

  if (!runManager.getActiveRun()) {
    const existingRuns = runManager.listRuns();
    const mountTarget =
      existingRuns.length > 0
        ? existingRuns[existingRuns.length - 1]
        : runManager.createRun(DEFAULT_SANDBOX_RUN_NAME);
    if (mountTarget) runManager.switchActiveRun(mountTarget.id);
  }

  const shutdown = (): void => {
    runManager.closeAll();
    globalDb.close();
  };

  return { paths, credentials, globalDb, runManager, shutdown };
}
