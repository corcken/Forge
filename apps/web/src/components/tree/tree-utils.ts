import type { Row } from '@tanstack/react-table';

/**
 * Ermittelt fuer jede Ancestor-Ebene einer Zeile, ob der jeweilige Ancestor
 * das letzte Kind seiner Geschwisterliste ist. Wird fuer die L-Fuehrungslinien
 * benoetigt (`h-[12px]` statt `h-full` beim letzten Kind).
 */
export function getAncestorLastChildFlags<T>(row: Row<T>, rootRows: Row<T>[]): boolean[] {
  const chain: Row<T>[] = [];
  let parent = row.getParentRow();
  while (parent) {
    chain.unshift(parent);
    parent = parent.getParentRow();
  }
  return chain.map((ancestor) => {
    const parentOfAncestor = ancestor.getParentRow();
    const siblings = parentOfAncestor ? parentOfAncestor.subRows : rootRows;
    return siblings[siblings.length - 1]?.id === ancestor.id;
  });
}

/** Sammelt rekursiv die ID einer Zeile sowie aller untergeordneten Zeilen (auch eingeklappte). */
export function collectRowBranchIds<T>(row: Row<T>): string[] {
  const ids: string[] = [row.id];
  const visit = (children: Row<T>[]): void => {
    for (const child of children) {
      ids.push(child.id);
      if (child.subRows.length > 0) visit(child.subRows);
    }
  };
  if (row.subRows.length > 0) visit(row.subRows);
  return ids;
}

/** Sammelt alle Zeilen-IDs inklusive aller Unterknoten fuer eine Liste von Wurzelzeilen. */
export function collectAllBranchIds<T>(rootRows: Row<T>[]): string[] {
  const ids: string[] = [];
  for (const row of rootRows) {
    ids.push(...collectRowBranchIds(row));
  }
  return ids;
}

/** Berechnet Checkbox-Status (`checked` + `indeterminate`) inklusive Kinder-Status. */
export function getRowSelectionState<T>(
  row: Row<T>,
  selectedIds: Set<string>,
): { checked: boolean; indeterminate: boolean } {
  if (row.subRows.length === 0) {
    return { checked: selectedIds.has(row.id), indeterminate: false };
  }
  let total = 0;
  let selected = 0;
  const visit = (children: Row<T>[]): void => {
    for (const child of children) {
      total += 1;
      if (selectedIds.has(child.id)) selected += 1;
      if (child.subRows.length > 0) visit(child.subRows);
    }
  };
  visit(row.subRows);
  if (total > 0 && selected === total) {
    return { checked: true, indeterminate: false };
  }
  if (selected > 0) {
    return { checked: false, indeterminate: true };
  }
  return { checked: selectedIds.has(row.id), indeterminate: false };
}

/** Schaltet eine Zeile samt aller Nachfahren um und aktualisiert Eltern-Knoten. */
export function toggleRowBranchSelection<T>(
  row: Row<T>,
  prevSelected: Set<string>,
): Set<string> {
  const branchIds = collectRowBranchIds(row);
  const allSelected = branchIds.every((id) => prevSelected.has(id));
  const next = new Set(prevSelected);

  if (allSelected) {
    for (const id of branchIds) next.delete(id);
    let parent = row.getParentRow();
    while (parent) {
      next.delete(parent.id);
      parent = parent.getParentRow();
    }
  } else {
    for (const id of branchIds) next.add(id);
    let parent = row.getParentRow();
    while (parent) {
      const allChildrenSelected = parent.subRows.every((child) => next.has(child.id));
      if (allChildrenSelected) next.add(parent.id);
      else next.delete(parent.id);
      parent = parent.getParentRow();
    }
  }
  return next;
}
