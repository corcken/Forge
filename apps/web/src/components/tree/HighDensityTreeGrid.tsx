import {
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ROW_HEIGHT_PX } from '../../lib/constants';
import { TreeGridHeader } from './TreeGridHeader';
import { TreeGridRow } from './TreeGridRow';
import { TreeGridToolbar } from './TreeGridToolbar';
import type { TreeGridColumn, TreeGridRowContext, TreeGridRowData } from './types';
import { useGridState } from './useGridState';

const VIS_PREFIX = 'descriptio_forge_cols_';

export interface HighDensityTreeGridProps<T extends TreeGridRowData> {
  data: T[];
  columns: TreeGridColumn<T>[];
  getSubRows: (row: T) => T[] | undefined;
  getRowName: (row: T) => string;
  getRowStatus?: (row: T) => string;
  getRowIcon?: (row: T) => ReactNode;
  storageKey: string;
  title?: string;
  defaultExpanded?: boolean;
  selectable?: boolean;
  renderHoverCard?: (row: T) => ReactNode;
  toolbarRight?: ReactNode;
  footerRight?: ReactNode;
}

/**
 * Wiederverwendbares, virtualisiertes 24px-TreeGrid auf Basis von
 * `@tanstack/react-table` (Expansion/Filter) und `@tanstack/react-virtual`.
 * Spalte 0 = Status (28px), optional Spalte 1 = Checkbox (28px),
 * Spalte 2 = Hierarchie (L-Fuehrungslinien), danach die Datenspalten.
 */
export function HighDensityTreeGrid<T extends TreeGridRowData>({
  data,
  columns,
  getSubRows,
  getRowName,
  getRowStatus,
  getRowIcon,
  storageKey,
  title,
  defaultExpanded = false,
  selectable = false,
  renderHoverCard,
  toolbarRight,
  footerRight,
}: HighDensityTreeGridProps<T>) {
  const grid = useGridState(storageKey, defaultExpanded);
  const [search, setSearch] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    () => readVisibility(storageKey),
  );
  useEffect(() => writeVisibility(storageKey, columnVisibility), [storageKey, columnVisibility]);

  const tableColumns = useMemo<ColumnDef<T>[]>(
    () => columns.map((column) => ({ id: column.id, header: column.header, accessorFn: () => null })),
    [columns],
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { expanded: grid.expanded, globalFilter: search },
    onExpandedChange: grid.setExpanded,
    onGlobalFilterChange: setSearch,
    getSubRows,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    filterFromLeafRows: true,
    globalFilterFn: (row, _columnId, value) =>
      getRowName(row.original).toLowerCase().includes(String(value).toLowerCase()),
  });

  useEffect(() => {
    if (search.trim().length > 0) grid.setExpanded(true);
  }, [search, grid]);

  const rows = table.getRowModel().rows;
  const rootRows = table.getFilteredRowModel().rows;
  const visibleIds = rows.map((row) => row.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => grid.selectedIds.has(id));
  const someSelected = grid.selectedIds.size > 0 && !allSelected;

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT_PX,
    overscan: 24,
  });

  const activeIndex = rows.findIndex((row) => row.id === grid.activeId);
  useEffect(() => {
    if (activeIndex >= 0) virtualizer.scrollToIndex(activeIndex, { align: 'auto' });
  }, [activeIndex, virtualizer]);

  const visibleColumns = columns.filter((column) => columnVisibility[column.id] !== false);
  const rowContext: TreeGridRowContext<T> = {
    columns: visibleColumns,
    rootRows,
    activeId: grid.activeId,
    onActivate: (id) => {
      grid.setActiveId(id);
      containerRef.current?.focus();
    },
    getRowName,
    getRowStatus,
    getRowIcon,
    selectable,
    selectedIds: grid.selectedIds,
    onToggleSelect: grid.toggleSelect,
    renderHoverCard,
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (rows.length === 0) return;
    const index = rows.findIndex((row) => row.id === grid.activeId);
    const current = index >= 0 ? rows[index] : undefined;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        grid.setActiveId((rows[index + 1] ?? rows[rows.length - 1])?.id ?? null);
        break;
      case 'ArrowUp':
        event.preventDefault();
        grid.setActiveId((rows[index - 1] ?? rows[0])?.id ?? null);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (!current) {
          grid.setActiveId(rows[0]?.id ?? null);
        } else if (current.getCanExpand() && !current.getIsExpanded()) {
          current.toggleExpanded();
        } else {
          const child = current.subRows[0];
          if (child) grid.setActiveId(child.id);
        }
        break;
      case 'ArrowLeft': {
        event.preventDefault();
        if (!current) break;
        if (current.getCanExpand() && current.getIsExpanded()) current.toggleExpanded();
        else {
          const parent = current.getParentRow();
          if (parent) grid.setActiveId(parent.id);
        }
        break;
      }
      case ' ':
        event.preventDefault();
        if (current) grid.toggleSelect(current.id);
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          grid.setSelectedIds(allSelected ? new Set<string>() : new Set<string>(visibleIds));
        }
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={onKeyDown} className="flex h-full min-h-0 flex-col outline-none">
      <TreeGridToolbar
        columns={columns}
        columnVisibility={columnVisibility}
        onToggleColumn={(id) =>
          setColumnVisibility((prev) => ({ ...prev, [id]: prev[id] === false }))
        }
        search={search}
        onSearch={setSearch}
        onExpandAll={() => grid.setExpanded(true)}
        onCollapseAll={() => grid.setExpanded({})}
        title={title}
        right={toolbarRight}
      />
      <TreeGridHeader
        columns={visibleColumns}
        selectable={selectable}
        allSelected={allSelected}
        someSelected={someSelected}
        onToggleAll={() =>
          grid.setSelectedIds(allSelected ? new Set<string>() : new Set<string>(visibleIds))
        }
      />
      <div ref={scrollRef} data-testid="grid-scroll" className="relative min-h-0 flex-1 overflow-auto">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((item) => {
            const row = rows[item.index];
            if (!row) return null;
            return (
              <TreeGridRow
                key={row.id}
                row={row}
                context={rowContext}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: ROW_HEIGHT_PX,
                  transform: `translateY(${item.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
      <div className="flex h-[24px] min-h-[24px] items-center justify-between border-t border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <span data-testid="grid-footer-left">
          Zeilen: {rows.length} | Ausgewaehlt: {grid.selectedIds.size}
        </span>
        <span>{footerRight}</span>
      </div>
    </div>
  );
}

function readVisibility(storageKey: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`${VIS_PREFIX}${storageKey}`);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeVisibility(storageKey: string, value: Record<string, boolean>): void {
  try {
    localStorage.setItem(`${VIS_PREFIX}${storageKey}`, JSON.stringify(value));
  } catch {
    /* localStorage optional */
  }
}
