import { useCallback, useEffect, useState } from 'react';
import type { ExpandedState, OnChangeFn } from '@tanstack/react-table';

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage optional */
  }
}

/** Persistierter Grid-Zustand (Expansion, aktive Zeile, Batch-Auswahl). */
export function useGridState(storageKey: string, defaultExpanded = false) {
  const key = `df_expand_${storageKey}`;
  const [expanded, setExpandedState] = useState<ExpandedState>(() => {
    const persisted = readStorage<ExpandedState | null>(key, null);
    return persisted ?? (defaultExpanded ? true : {});
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set<string>());

  useEffect(() => {
    writeStorage(key, expanded);
  }, [key, expanded]);

  const setExpanded: OnChangeFn<ExpandedState> = useCallback((updater) => {
    setExpandedState((prev) => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set<string>()), []);

  return {
    expanded,
    setExpanded,
    activeId,
    setActiveId,
    selectedIds,
    setSelectedIds,
    toggleSelect,
    clearSelection,
  };
}
