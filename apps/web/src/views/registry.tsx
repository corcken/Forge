import { Boxes, Cpu, GitBranch, PenTool, Table2, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AiVaultView } from './AiVaultView';
import { ArchetypeView } from './ArchetypeView';
import { HarvestGridView } from './HarvestGridView';
import { RunManagerView } from './RunManagerView';
import { SymbolStudioView } from './SymbolStudioView';

export interface AppView {
  id: string;
  label: string;
  icon: LucideIcon;
  element: ReactNode;
}

/** Feste Hauptnavigation gemaess MANIFEST Abschnitt 1. */
export const APP_VIEWS: AppView[] = [
  { id: 'harvest', label: 'Harvest & Compiler Grid', icon: Table2, element: <HarvestGridView /> },
  { id: 'archetypes', label: 'IEC-Archetypen & Serien', icon: Boxes, element: <ArchetypeView /> },
  { id: 'ai', label: 'KI-Provider & Modell-Tresor', icon: Cpu, element: <AiVaultView /> },
  { id: 'runs', label: 'Run-Manager & Diffing', icon: GitBranch, element: <RunManagerView /> },
  { id: 'symbols', label: 'Symbol Studio (IEC 60617)', icon: PenTool, element: <SymbolStudioView /> },
];
