const VIS_PREFIX = 'descriptio_forge_cols_';

/** Liest die persistierte Spaltensichtbarkeit eines Grids. */
export function readVisibility(storageKey: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${VIS_PREFIX}${storageKey}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/** Persistiert die Spaltensichtbarkeit eines Grids. */
export function writeVisibility(storageKey: string, value: Record<string, boolean>): void {
  try {
    localStorage.setItem(`${VIS_PREFIX}${storageKey}`, JSON.stringify(value));
  } catch {
    /* localStorage optional */
  }
}
