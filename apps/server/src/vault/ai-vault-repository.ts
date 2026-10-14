import type {
  AiProviderAdapterType,
  AiProviderTestStatus,
  AiTaskType,
} from '@descriptio-forge/shared';
import { GlobalVaultDb } from './global-db.js';

/** Persistierter KI-Provider (der API-Key liegt ausschliesslich in credentials.json). */
export interface AiProviderRecord {
  id: string;
  displayName: string;
  baseUrl: string;
  adapterType: AiProviderAdapterType;
  isEnabled: boolean;
  lastTestStatus: AiProviderTestStatus;
  lastLatencyMs: number | null;
  lastErrorMsg: string | null;
  lastTestedAt: string | null;
}

/** Persistiertes, abgerufenes KI-Modell inkl. Task-Zuweisung und Preisen. */
export interface AiModelRecord {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  contextWindow: number;
  inputPricePer1m: number | null;
  outputPricePer1m: number | null;
  supportsVision: boolean;
  supportsJsonSchema: boolean;
  isActive: boolean;
  assignedTasks: AiTaskType[];
}

/** Eingabe fuer den Model-Upsert (strukturell kompatibel zu NormalizedAiModel). */
export interface ModelUpsertInput {
  modelId: string;
  displayName: string;
  contextWindow: number | null;
  supportsVision: boolean;
  supportsJsonSchema: boolean;
  inputPricePer1m: number | null;
  outputPricePer1m: number | null;
}

export interface ProviderSeed {
  id: string;
  displayName: string;
  baseUrl: string;
  adapterType: AiProviderAdapterType;
}

interface ProviderRow {
  id: string;
  display_name: string;
  base_url: string;
  adapter_type: string;
  is_enabled: number;
  last_test_status: string;
  last_latency_ms: number | null;
  last_error_msg: string | null;
  last_tested_at: string | null;
}

interface ModelRow {
  id: string;
  provider_id: string;
  model_id: string;
  display_name: string;
  context_window: number;
  input_price_per_1m: number | null;
  output_price_per_1m: number | null;
  supports_vision: number;
  supports_json_schema: number;
  is_active: number;
  assigned_tasks_json: string;
}

/** Datenbankzugriff fuer Provider-Status und abgerufene Modelle. */
export class AiVaultRepository {
  constructor(private readonly globalDb: GlobalVaultDb) {}

  /** Legt fehlende Standard-Provider an (idempotent, ueberschreibt nichts). */
  ensureProviders(providers: readonly ProviderSeed[]): void {
    const insert = this.globalDb.db.prepare(
      `INSERT OR IGNORE INTO ai_providers
         (id, display_name, base_url, adapter_type, is_enabled, last_test_status)
       VALUES (@id, @displayName, @baseUrl, @adapterType, 1, 'UNTESTED')`,
    );
    const tx = this.globalDb.db.transaction((items: readonly ProviderSeed[]) => {
      for (const item of items) insert.run(item);
    });
    tx(providers);
  }

  listProviders(): AiProviderRecord[] {
    const rows = this.globalDb.db
      .prepare('SELECT * FROM ai_providers ORDER BY id')
      .all() as ProviderRow[];
    return rows.map(toProviderRecord);
  }

  getProvider(id: string): AiProviderRecord | null {
    const row = this.globalDb.db.prepare('SELECT * FROM ai_providers WHERE id = ?').get(id) as
      | ProviderRow
      | undefined;
    return row ? toProviderRecord(row) : null;
  }

  /** Persistiert das Ergebnis eines Live-Verbindungstests. */
  saveProviderTestResult(
    id: string,
    status: AiProviderTestStatus,
    latencyMs: number | null,
    errorMsg: string | null,
  ): void {
    this.globalDb.db
      .prepare(
        `UPDATE ai_providers
            SET last_test_status = ?, last_latency_ms = ?, last_error_msg = ?,
                last_tested_at = ?, is_enabled = CASE WHEN ? = 'OK' THEN 1 ELSE is_enabled END
          WHERE id = ?`,
      )
      .run(status, latencyMs, errorMsg, new Date().toISOString(), status, id);
  }

  /** Aktualisiert die Basis-URL eines Providers. */
  updateProviderBaseUrl(id: string, baseUrl: string): void {
    this.globalDb.db.prepare('UPDATE ai_providers SET base_url = ? WHERE id = ?').run(baseUrl, id);
  }

  /**
   * UPSERT aller abgerufenen Modelle. Bestehende Task-Zuweisungen,
   * Aktiv-Status und Preise bleiben erhalten (nur leere Preise werden gefuellt).
   */
  upsertModels(providerId: string, models: readonly ModelUpsertInput[]): number {
    const statement = this.globalDb.db.prepare(
      `INSERT INTO ai_models
         (id, provider_id, model_id, display_name, context_window,
          input_price_per_1m, output_price_per_1m, supports_vision,
          supports_json_schema, is_active, assigned_tasks_json)
       VALUES
         (@id, @providerId, @modelId, @displayName, @contextWindow,
          @inputPrice, @outputPrice, @supportsVision,
          @supportsJsonSchema, 1, '[]')
       ON CONFLICT(id) DO UPDATE SET
         display_name = excluded.display_name,
         context_window = excluded.context_window,
         supports_vision = excluded.supports_vision,
         supports_json_schema = excluded.supports_json_schema,
         input_price_per_1m = COALESCE(excluded.input_price_per_1m, ai_models.input_price_per_1m),
         output_price_per_1m = COALESCE(excluded.output_price_per_1m, ai_models.output_price_per_1m)`,
    );
    const tx = this.globalDb.db.transaction((items: readonly ModelUpsertInput[]) => {
      for (const model of items) {
        statement.run({
          id: `${providerId}:${model.modelId}`,
          providerId,
          modelId: model.modelId,
          displayName: model.displayName,
          contextWindow: model.contextWindow ?? 0,
          inputPrice: model.inputPricePer1m,
          outputPrice: model.outputPricePer1m,
          supportsVision: model.supportsVision ? 1 : 0,
          supportsJsonSchema: model.supportsJsonSchema ? 1 : 0,
        });
      }
    });
    tx(models);
    return models.length;
  }

  listModels(providerId?: string): AiModelRecord[] {
    const rows = providerId
      ? (this.globalDb.db
          .prepare('SELECT * FROM ai_models WHERE provider_id = ? ORDER BY model_id')
          .all(providerId) as ModelRow[])
      : (this.globalDb.db.prepare('SELECT * FROM ai_models ORDER BY provider_id, model_id').all() as ModelRow[]);
    return rows.map(toModelRecord);
  }

  getModel(id: string): AiModelRecord | null {
    const row = this.globalDb.db.prepare('SELECT * FROM ai_models WHERE id = ?').get(id) as
      | ModelRow
      | undefined;
    return row ? toModelRecord(row) : null;
  }

  setModelActive(id: string, active: boolean): void {
    this.globalDb.db.prepare('UPDATE ai_models SET is_active = ? WHERE id = ?').run(active ? 1 : 0, id);
  }

  updateModelPricing(id: string, inputPricePer1m: number | null, outputPricePer1m: number | null): void {
    this.globalDb.db
      .prepare('UPDATE ai_models SET input_price_per_1m = ?, output_price_per_1m = ? WHERE id = ?')
      .run(inputPricePer1m, outputPricePer1m, id);
  }

  assignTasks(id: string, tasks: readonly AiTaskType[]): void {
    this.globalDb.db
      .prepare('UPDATE ai_models SET assigned_tasks_json = ? WHERE id = ?')
      .run(JSON.stringify(tasks), id);
  }
}

function toProviderRecord(row: ProviderRow): AiProviderRecord {
  return {
    id: row.id,
    displayName: row.display_name,
    baseUrl: row.base_url,
    adapterType: row.adapter_type as AiProviderAdapterType,
    isEnabled: row.is_enabled === 1,
    lastTestStatus: row.last_test_status as AiProviderTestStatus,
    lastLatencyMs: row.last_latency_ms,
    lastErrorMsg: row.last_error_msg,
    lastTestedAt: row.last_tested_at,
  };
}

function toModelRecord(row: ModelRow): AiModelRecord {
  return {
    id: row.id,
    providerId: row.provider_id,
    modelId: row.model_id,
    displayName: row.display_name,
    contextWindow: row.context_window,
    inputPricePer1m: row.input_price_per_1m,
    outputPricePer1m: row.output_price_per_1m,
    supportsVision: row.supports_vision === 1,
    supportsJsonSchema: row.supports_json_schema === 1,
    isActive: row.is_active === 1,
    assignedTasks: parseTasks(row.assigned_tasks_json),
  };
}

function parseTasks(json: string): AiTaskType[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? (parsed.filter((item) => typeof item === 'string') as AiTaskType[]) : [];
  } catch {
    return [];
  }
}
