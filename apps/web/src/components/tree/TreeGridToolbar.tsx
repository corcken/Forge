import { MinusSquare, PlusSquare, Search, SlidersHorizontal } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { TreeGridColumn } from './types';

export interface TreeGridToolbarProps<T> {
  columns: TreeGridColumn<T>[];
  columnVisibility: Record<string, boolean>;
  onToggleColumn: (id: string) => void;
  search: string;
  onSearch: (value: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  title?: string;
  right?: ReactNode;
}

/** 32px Toolbar ueber dem Grid: Suche, Expand/Collapse und Spaltenauswahl. */
export function TreeGridToolbar<T>({
  columns,
  columnVisibility,
  onToggleColumn,
  search,
  onSearch,
  onExpandAll,
  onCollapseAll,
  title,
  right,
}: TreeGridToolbarProps<T>) {
  const [columnsOpen, setColumnsOpen] = useState(false);

  return (
    <div className="relative flex h-[32px] min-h-[32px] items-center gap-2 border-b border-slate-200 bg-slate-50 px-2 dark:border-slate-800 dark:bg-slate-900">
      {title ? (
        <span className="font-semibold text-slate-700 dark:text-slate-200">{title}</span>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          placeholder="Suchen..."
          onChange={(event) => onSearch(event.target.value)}
          className="h-[22px] w-[200px] rounded border border-slate-200 bg-white pl-7 pr-2 text-[12px] text-slate-800 outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onExpandAll}
          title="Alles aufklappen"
          className="flex h-[22px] items-center gap-1 rounded border border-slate-200 px-1.5 text-[11px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <PlusSquare className="h-3.5 w-3.5" /> Auf
        </button>
        <button
          type="button"
          onClick={onCollapseAll}
          title="Alles zuklappen"
          className="flex h-[22px] items-center gap-1 rounded border border-slate-200 px-1.5 text-[11px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <MinusSquare className="h-3.5 w-3.5" /> Zu
        </button>
      </div>

      <div className="flex-1" />
      {right}

      <div className="relative">
        <button
          type="button"
          onClick={() => setColumnsOpen((prev) => !prev)}
          title="Spalten"
          className="flex h-[22px] items-center gap-1 rounded border border-slate-200 px-1.5 text-[11px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Spalten
        </button>
        {columnsOpen ? (
          <div className="absolute right-0 top-[26px] z-40 min-w-[180px] rounded border border-slate-200 bg-white py-1 text-[12px] shadow-md dark:border-slate-700 dark:bg-slate-900">
            {columns.map((column) => (
              <label
                key={column.id}
                className="flex h-[24px] cursor-pointer items-center gap-2 px-2.5 text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-blue-950/50"
              >
                <input
                  type="checkbox"
                  checked={columnVisibility[column.id] !== false}
                  onChange={() => onToggleColumn(column.id)}
                  className="h-[14px] w-[14px] accent-sky-600"
                />
                <span className="truncate">{column.header}</span>
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
