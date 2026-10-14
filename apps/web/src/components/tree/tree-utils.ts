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
