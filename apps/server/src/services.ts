import { AiGateway } from './ai-gateway/gateway.js';
import { CompileService } from './compiler/compile-service.js';
import { ExtractionService } from './pipeline/extraction-service.js';
import { AiVaultRepository } from './vault/ai-vault-repository.js';
import { RunPartRepository } from './vault/run-part-repository.js';
import { RunSeriesRepository } from './vault/run-series-repository.js';
import { initializeVault, type VaultServices } from './vault/vault-initializer.js';

/** Alle beim Serverstart initialisierten Dienste inkl. KI-Gateway + Compiler. */
export interface AppServices extends VaultServices {
  aiVault: AiVaultRepository;
  aiGateway: AiGateway;
  runParts: RunPartRepository;
  runSeries: RunSeriesRepository;
  compileService: CompileService;
  extractionService: ExtractionService;
}

/**
 * Bootstrapping der gesamten Anwendung: Vault (Out-of-Repo), KI-Gateway,
 * deterministischer Regel-Compiler und Extraktions-Pipeline.
 * Standard-Provider werden idempotent angelegt.
 */
export function initializeServices(): AppServices {
  const vault = initializeVault();

  const aiVault = new AiVaultRepository(vault.globalDb);
  const aiGateway = new AiGateway(vault.credentials, aiVault);
  aiGateway.ensureProvidersSeeded();

  const runParts = new RunPartRepository(vault.runManager);
  const runSeries = new RunSeriesRepository(vault.runManager);
  const compileService = new CompileService(
    vault.globalDb,
    vault.runManager,
    runParts,
    runSeries,
  );
  const extractionService = new ExtractionService(
    vault.globalDb,
    runParts,
    aiVault,
    aiGateway,
  );

  return {
    ...vault,
    aiVault,
    aiGateway,
    runParts,
    runSeries,
    compileService,
    extractionService,
  };
}
