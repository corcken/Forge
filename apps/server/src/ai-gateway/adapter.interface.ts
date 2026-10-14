import type { AiExtractionOutput, AiProviderAdapterType } from '@descriptio-forge/shared';

/** Ein auf ein einheitliches internes Format normalisiertes KI-Modell. */
export interface NormalizedAiModel {
  modelId: string;
  displayName: string;
  contextWindow: number | null;
  supportsVision: boolean;
  supportsJsonSchema: boolean;
  inputPricePer1m: number | null;
  outputPricePer1m: number | null;
}

/** Ergebnis eines Live-Verbindungstests inkl. gemessener Latenz. */
export interface TestConnectionResult {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface TestConnectionParams {
  apiKey: string | null;
  baseUrl: string;
  timeoutMs?: number;
}

export interface FetchModelsParams {
  apiKey: string | null;
  baseUrl: string;
  timeoutMs?: number;
}

/** Eingabe fuer die Faktorenextraktion (Text und/oder natives PDF). */
export interface ExtractPartFactsParams {
  apiKey: string | null;
  baseUrl: string;
  modelId: string;
  systemPrompt: string;
  userText?: string | null;
  pdf?: { base64: string; mimeType: string } | null;
  allowedArchetypeIds: string[];
  timeoutMs?: number;
}

/** Ergebnis der Faktorenextraktion inkl. Token-Verbrauch. */
export interface ExtractPartFactsResult {
  data: AiExtractionOutput;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Einheitliches Interface aller KI-Provider-Adapter. Jeder Anbieter
 * (Gemini, OpenAI-kompatibel, Anthropic) implementiert exakt diese drei
 * Faehigkeiten: Verbindung testen, Modelle abrufen, Artikel-Fakten extrahieren.
 */
export interface IAiProviderAdapter {
  readonly adapterType: AiProviderAdapterType;
  testConnection(params: TestConnectionParams): Promise<TestConnectionResult>;
  fetchAvailableModels(params: FetchModelsParams): Promise<NormalizedAiModel[]>;
  extractPartFacts(params: ExtractPartFactsParams): Promise<ExtractPartFactsResult>;
}
