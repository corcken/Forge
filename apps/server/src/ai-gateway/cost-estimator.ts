import type { AiModelRecord } from '../vault/ai-vault-repository.js';

/** Eingabeparameter fuer die Kosten-Schaetzung eines Batch-Laufs. */
export interface CostEstimateInput {
  model: Pick<AiModelRecord, 'inputPricePer1m' | 'outputPricePer1m'>;
  itemCount: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

/** Ergebnis der Token- und Kostenrechnung. */
export interface CostEstimate {
  itemCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
}

/** Rechnet Tokenvolumen und Kosten anhand der Modellpreise (USD pro 1M Token). */
export function estimateBatchCost(input: CostEstimateInput): CostEstimate {
  const itemCount = Math.max(0, Math.trunc(input.itemCount));
  const totalInputTokens = Math.max(0, Math.trunc(input.avgInputTokens)) * itemCount;
  const totalOutputTokens = Math.max(0, Math.trunc(input.avgOutputTokens)) * itemCount;
  const inputPrice = input.model.inputPricePer1m ?? 0;
  const outputPrice = input.model.outputPricePer1m ?? 0;
  const inputCostUsd = roundCost((totalInputTokens / 1_000_000) * inputPrice);
  const outputCostUsd = roundCost((totalOutputTokens / 1_000_000) * outputPrice);
  return {
    itemCount,
    totalInputTokens,
    totalOutputTokens,
    inputCostUsd,
    outputCostUsd,
    totalCostUsd: roundCost(inputCostUsd + outputCostUsd),
  };
}

/** Prueft, ob die Schaetzung ein konfiguriertes Hard-Stop-Budget ueberschreitet. */
export function exceedsBudget(estimate: CostEstimate, budgetUsd: number | null): boolean {
  if (budgetUsd === null) return false;
  return estimate.totalCostUsd > budgetUsd;
}

/** Rundet auf 6 Nachkommastellen, um Fliesskomma-Rauschen zu vermeiden. */
export function roundCost(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
