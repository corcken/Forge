import { MinusSquare, PlusSquare } from 'lucide-react';
import type { ReactNode } from 'react';
import { INDENT_PX } from '../../../lib/constants';

export interface HierarchyCellProps {
  depth: number;
  /** Fuer jede Ancestor-Ebene: war der Ancestor das letzte Kind? */
  ancestorLastChild: boolean[];
  canExpand: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  name: string;
  icon?: ReactNode;
}

/**
 * Spalte 2: Hierarchie-Zelle mit L-Fuehrungslinien (STEP-CAD/Explorer-Stil).
 * Vertikale Linien laufen `h-full`, ausser fuer letzte Kinder (`h-[12px]`).
 * Endknoten ohne Kinder erhalten statt eines Toggles einen waagerechten Strich.
 */
export function HierarchyCell({
  depth,
  ancestorLastChild,
  canExpand,
  isExpanded,
  onToggle,
  name,
  icon,
}: HierarchyCellProps) {
  return (
    <div
      data-testid="hierarchy-cell"
      className="relative flex h-[24px] min-w-[280px] flex-1 items-center truncate border-r border-b border-slate-200 px-2 py-0 dark:border-slate-800"
      style={{ paddingLeft: depth * INDENT_PX + 8 }}
    >
      {ancestorLastChild.map((isLast, level) => (
        <div
          key={level}
          data-guide="vertical"
          data-last={isLast ? 'true' : 'false'}
          className={`absolute top-0 w-px bg-slate-300 dark:bg-slate-700 ${
            isLast ? 'h-[12px]' : 'h-full'
          }`}
          style={{ left: level * INDENT_PX + 7 }}
        />
      ))}
      {depth > 0 ? (
        <div
          data-guide="horizontal"
          className="absolute top-[12px] h-px w-[8px] bg-slate-300 dark:bg-slate-700"
          style={{ left: (depth - 1) * INDENT_PX + 7 }}
        />
      ) : null}
      {canExpand ? (
        <button
          type="button"
          aria-label={isExpanded ? 'Zuklappen' : 'Aufklappen'}
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          className="mr-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          {isExpanded ? (
            <MinusSquare className="h-3.5 w-3.5" />
          ) : (
            <PlusSquare className="h-3.5 w-3.5" />
          )}
        </button>
      ) : (
        <span
          data-testid="end-node-mark"
          className="mr-1 h-px w-3.5 shrink-0 bg-slate-300 dark:bg-slate-700"
        />
      )}
      {icon ? (
        <span className="mr-1.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-slate-500">
          {icon}
        </span>
      ) : null}
      <span className="truncate text-[13px] tracking-tight">{name}</span>
    </div>
  );
}
