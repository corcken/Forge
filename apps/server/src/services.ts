import { AiGateway } from './ai-gateway/gateway.js';
import { CategoryBatchService } from './compiler/category-batch-service.js';
import { CompileService } from './compiler/compile-service.js';
import { ActivityLogService } from './pipeline/activity-log.js';
import { BatchQueue } from './pipeline/batch-queue.js';
import { EdzIngestor } from './pipeline/edz-ingestor.js';
import { ExtractionService } from './pipeline/extraction-service.js';
import { RawIngestor } from './pipeline/raw-ingestor.js';
import { SymbolHarvester } from './pipeline/symbol-harvester.js';
import { AiVaultRepository } from './vault/ai-vault-repository.js';
import { CategoryRepository } from './vault/category-repository.js';
import { RawDocumentRepository } from './vault/raw-repository.js';
import { RunPartRepository } from './vault/run-part-repository.js';
import { RunSeriesRepository } from './vault/run-series-repository.js';
import { SymbolRepository } from './vault/symbol-repository.js';
import { initializeVault, type VaultServices } from './vault/vault-initializer.js';

/** Alle beim Serverstart initialisierten Dienste. */
export interface AppServices extends VaultServices {
  activityLog: ActivityLogService;
  aiVault: AiVaultRepository;
  aiGateway: AiGateway;
  runParts: RunPartRepository;
  runSeries: RunSeriesRepository;
  compileService: CompileService;
  extractionService: ExtractionService;
  rawRepo: RawDocumentRepository;
  rawIngestor: RawIngestor;
  edzIngestor: EdzIngestor;
  batchQueue: BatchQueue;
  symbolRepo: SymbolRepository;
  symbolHarvester: SymbolHarvester;
  categoryRepo: CategoryRepository;
  categoryBatch: CategoryBatchService;
}

/**
 * Bootstrapping der gesamten Anwendung: Vault (Out-of-Repo), KI-Gateway,
 * deterministischer Regel-Compiler und Extraktions-Pipeline.
 * Standard-Provider werden idempotent angelegt.
 */
export function initializeServices(): AppServices {
  const vault = initializeVault();
  const activityLog = new ActivityLogService(1000);

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
    activityLog,
  );
  const extractionService = new ExtractionService(
    vault.globalDb,
    runParts,
    aiVault,
    aiGateway,
    activityLog,
  );
  const rawRepo = new RawDocumentRepository(vault.globalDb);
  const rawIngestor = new RawIngestor(vault.paths, rawRepo, activityLog);
  const edzIngestor = new EdzIngestor(vault.globalDb, vault.runManager, runParts, activityLog);
  const batchQueue = new BatchQueue({ concurrency: 5, logger: activityLog });
  const symbolRepo = new SymbolRepository(vault.globalDb);
  const symbolHarvester = new SymbolHarvester(symbolRepo, aiGateway, activityLog);
  const categoryRepo = new CategoryRepository(vault.globalDb);
  const categoryBatch = new CategoryBatchService(vault.runManager, vault.globalDb, activityLog);

  const activeRun = vault.runManager.getActiveRun();
  const archetypesCount = vault.globalDb.listArchetypes().length;
  const symbolStats = symbolRepo.getStats();
  activityLog.info(
    'SYSTEM',
    `Vault bereit (${archetypesCount} IEC-Archetypen, ${symbolStats.total} IEC 60617 Symbole) · Aktiver Run: ${activeRun ? `${activeRun.name} (${activeRun.partCount} Artikel, ${activeRun.validatedCount} validiert)` : 'keiner'}`,
  );

  return {
    ...vault,
    activityLog,
    aiVault,
    aiGateway,
    runParts,
    runSeries,
    compileService,
    extractionService,
    rawRepo,
    rawIngestor,
    edzIngestor,
    batchQueue,
    symbolRepo,
    symbolHarvester,
    categoryRepo,
    categoryBatch,
  };
}
