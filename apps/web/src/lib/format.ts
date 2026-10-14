/** Zahlformatierung mit Ziffernflucht-Unterstuetzung (tabular-nums). */
export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** USD-Betrag kompakt (Kosten-Waechter). */
export function formatUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  return `$${value.toFixed(4)}`;
}

/** Kuerzt einen String auf n Zeichen (Kompaktformat der 24px-Zeile). */
export function truncate(value: string, length: number): string {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

/** Formatiert einen Latenzwert in Millisekunden. */
export function formatLatency(ms: number | null | undefined): string {
  return ms === null || ms === undefined ? '–' : `${ms} ms`;
}
