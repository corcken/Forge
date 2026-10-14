import type { FieldOrigin } from '@descriptio-forge/shared';

export type HarvestKind = 'series' | 'part' | 'group' | 'pin';

export interface HarvestNode {
  id: string;
  name: string;
  kind: HarvestKind;
  status: string;
  archetypeId?: string | null;
  qualityTier?: string;
  completeness?: number;
  origin?: FieldOrigin | null;
  partId?: string;
  subItems?: HarvestNode[];
}

export const KIND_LABEL: Record<HarvestKind, string> = {
  series: 'Serie',
  part: 'Artikel',
  group: 'Gruppe',
  pin: 'Pin',
};

interface RunTreePinInput {
  id: string;
  name: string;
  role: string;
  origin: FieldOrigin;
}
interface RunTreeGroupInput {
  id: string;
  name: string;
  functionType: string;
  pins: RunTreePinInput[];
}
interface RunTreePartInput {
  id: string;
  name: string;
  articleNr: string;
  status: string;
  qualityTier: string;
  completenessPct: number;
  archetypeId: string | null;
  functionGroups: RunTreeGroupInput[];
}
export interface RunTreeSeriesInput {
  id: string;
  name: string;
  parts: RunTreePartInput[];
}

export interface NodeLookupEntry {
  kind: HarvestKind;
  partId?: string;
}

/** Baut aus dem Server-Baum die Grid-Knoten (Serie -> Artikel -> Gruppe -> Pin). */
export function buildHarvestNodes(tree: RunTreeSeriesInput[]): {
  nodes: HarvestNode[];
  lookup: Map<string, NodeLookupEntry>;
} {
  const lookup = new Map<string, NodeLookupEntry>();
  const nodes: HarvestNode[] = tree.map((series) => ({
    id: `series:${series.id}`,
    name: series.name,
    kind: 'series',
    status: 'VALIDATED',
    subItems: series.parts.map((part) => {
      const partNodeId = `part:${part.id}`;
      lookup.set(partNodeId, { kind: 'part', partId: part.id });
      return {
        id: partNodeId,
        name: `${part.articleNr} — ${part.name}`,
        kind: 'part',
        status: part.status,
        archetypeId: part.archetypeId,
        qualityTier: part.qualityTier,
        completeness: part.completenessPct,
        partId: part.id,
        subItems: part.functionGroups.map((group) => {
          const groupNodeId = `group:${group.id}`;
          lookup.set(groupNodeId, { kind: 'group', partId: part.id });
          return {
            id: groupNodeId,
            name: group.name,
            kind: 'group',
            status: 'COMPILED',
            archetypeId: group.functionType,
            partId: part.id,
            subItems: group.pins.map((pin) => {
              const pinNodeId = `pin:${pin.id}`;
              lookup.set(pinNodeId, { kind: 'pin', partId: part.id });
              return {
                id: pinNodeId,
                name: `${pin.name} · ${pin.role}`,
                kind: 'pin',
                status: 'COMPILED',
                origin: pin.origin,
                partId: part.id,
              };
            }),
          };
        }),
      };
    }),
  }));
  return { nodes, lookup };
}
