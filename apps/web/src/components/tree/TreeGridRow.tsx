import type { CSSProperties } from 'react';
import type { Row } from '@tanstack/react-table';
import { IndustrialHoverCard } from '../hover/IndustrialHoverCard';
import { HierarchyCell } from './cells/HierarchyCell';
import { StatusIconCell } from './cells/StatusIconCell';
import { getAncestorLastChildFlags } from './tree-utils';
import { cellAlignClass, type TreeGridRowContext } from './types';

export interface TreeGridRowProps<T> {
  row: Row<T>;
  context: TreeGridRowContext<T>;
  style: CSSProperties;
}

/** Einzelne 24px-Tabellenzeile (absolut positioniert durch die Virtualisierung). */
export function TreeGridRow<T>({ row, context, style }: TreeGridRowProps<T>) {
  const isActive = context.activeId === row.id;
  const isSelected = context.selectedIds.has(row.id);
  const status = context.getRowStatus?.(row.original) ?? 'PENDING_INGEST';
  const ancestorFlags = getAncestorLastChildFlags(row, context.rootRows);

  const content = (
    <div
      data-testid="tree-row"
      data-depth={row.depth}
      style={style}
      onClick={() => context.onActivate(row.id)}
      className={`flex h-[24px] min-h-[24px] max-h-[24px] ${
        isActive
          ? 'bg-blue-50/80 font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
          : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
      }`}
    >
      <StatusIconCell status={status} />
      {context.selectable ? (
        <div className="flex w-[28px] min-w-[28px] items-center justify-center border-r border-b border-slate-200 p-0 dark:border-slate-800">
          <input
            type="checkbox"
            checked={isSelected}
            aria-label={`Zeile ${row.id} auswaehlen`}
            onClick={(event) => event.stopPropagation()}
            onChange={() => context.onToggleSelect(row.id)}
            className="h-[14px] w-[14px] cursor-pointer accent-sky-600"
          />
        </div>
      ) : null}
      <HierarchyCell
        depth={row.depth}
        ancestorLastChild={ancestorFlags}
        canExpand={row.getCanExpand()}
        isExpanded={row.getIsExpanded()}
        onToggle={() => row.toggleExpanded()}
        name={context.getRowName(row.original)}
        icon={context.getRowIcon?.(row.original)}
      />
      {context.columns
        .filter((column) => column.width !== 0)
        .map((column) => (
          <div
            key={column.id}
            style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
            className={`flex items-center border-r border-b border-slate-200 px-2 py-0 dark:border-slate-800 ${cellAlignClass(
              column.align,
              column.numeric,
            )}`}
          >
            {column.render(row.original)}
          </div>
        ))}
    </div>
  );

  if (context.renderHoverCard) {
    const renderCard = context.renderHoverCard;
    return <IndustrialHoverCard content={() => renderCard(row.original)}>{content}</IndustrialHoverCard>;
  }
  return content;
}
