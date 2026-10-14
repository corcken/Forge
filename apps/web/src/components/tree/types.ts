import type { ReactNode } from 'react';
import type { Row } from '@tanstack/react-table';

/** Ausrichtung einer Datenspalte im 24px-Grid. */
export type GridAlign = 'left' | 'center' | 'right';

/** Definition einer Datenspalte (ohne Status-/Checkbox-/Hierarchiespalte). */
export interface TreeGridColumn<T> {
  id: string;
  header: string;
  /** Feste Pixelbreite; 0 bedeutet flexibel wachsen. */
  width: number;
  align?: GridAlign;
  /** Rechtsbuendige Ziffernflucht (tabular-nums font-mono). */
  numeric?: boolean;
  render: (row: T) => ReactNode;
}

/** Basisvertrag aller Grid-Zeilen. */
export interface TreeGridRowData {
  id: string;
}

/** Liefert die Tailwind-Klassen fuer Ausrichtung und Ziffernflucht. */
export function cellAlignClass(align: GridAlign = 'left', numeric = false): string {
  if (numeric) return 'text-right tabular-nums font-mono text-[13px] truncate';
  if (align === 'center') return 'text-center truncate text-[12px]';
  if (align === 'right') return 'text-right truncate text-[12px]';
  return 'text-left truncate text-[12px]';
}

/** Kontext, den jede Zeile zum Rendern der Hierarchie erhaelt. */
export interface TreeGridRowContext<T> {
  columns: TreeGridColumn<T>[];
  rootRows: Row<T>[];
  activeId: string | null;
  onActivate: (id: string) => void;
  getRowName: (row: T) => string;
  getRowStatus?: (row: T) => string;
  getRowIcon?: (row: T) => ReactNode;
  selectable?: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  renderHoverCard?: (row: T) => ReactNode;
}
