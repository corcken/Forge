import { cellAlignClass, type TreeGridColumn } from './types';

export interface TreeGridHeaderProps<T> {
  columns: TreeGridColumn<T>[];
  selectable: boolean;
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
}

/** 24px Tabellenkopf mit Status-/Checkbox-Spalte und Datenspalten. */
export function TreeGridHeader<T>({
  columns,
  selectable,
  allSelected,
  someSelected,
  onToggleAll,
}: TreeGridHeaderProps<T>) {
  return (
    <div className="flex h-[24px] min-h-[24px] shrink-0 border-b-2 border-slate-300 bg-slate-100 text-[12px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
      <div className="w-[28px] min-w-[28px] border-r border-slate-200 dark:border-slate-800" />
      {selectable ? (
        <div className="flex w-[28px] min-w-[28px] items-center justify-center border-r border-slate-200 p-0 dark:border-slate-800">
          <input
            type="checkbox"
            checked={allSelected}
            aria-label="Alle auswaehlen"
            onChange={onToggleAll}
            ref={(element) => {
              if (element) element.indeterminate = !allSelected && someSelected;
            }}
            className="h-[14px] w-[14px] cursor-pointer accent-sky-600"
          />
        </div>
      ) : null}
      <div className="flex min-w-[280px] flex-1 items-center border-r border-slate-200 px-2 dark:border-slate-800">
        Kennzeichnung
      </div>
      {columns.map((column) => (
        <div
          key={column.id}
          style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
          className={`flex items-center border-r border-slate-200 px-2 dark:border-slate-800 ${cellAlignClass(
            column.align,
            column.numeric,
          )}`}
        >
          {column.header}
        </div>
      ))}
    </div>
  );
}
