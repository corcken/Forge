import { createHash } from 'node:crypto';
import {
  CatalogCategoryNodeSchema,
  type CatalogCategoryNode,
  type CategoryUsageType,
} from '@descriptio-forge/shared';

/**
 * Erzeugt eine deterministische, permanente UUID v5-aehnliche Zeichenkette
 * aus dem Kategorie-Slug. Dadurch erhalten gleiche Slugs auf allen Servern
 * und in allen Exporten immer exakt dieselbe UUID.
 */
export function deterministicCategoryUuid(slug: string): string {
  const hash = createHash('sha256').update(`descriptio:category:${slug}`).digest('hex');
  const p1 = hash.slice(0, 8);
  const p2 = hash.slice(8, 12);
  const p3 = `5${hash.slice(13, 16)}`; // Version 5
  const p4Nibble = (Number.parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8;
  const p4 = `${p4Nibble.toString(16)}${hash.slice(17, 20)}`; // RFC4122 Variant
  const p5 = hash.slice(20, 32);
  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

/** Hilfs-Builder fuer einen validierten Kategorieknoten. */
export function cat(
  slug: string,
  parentSlug: string | null,
  name: string,
  pathLabel: string,
  level: number,
  sortOrder: number,
  categoryType: CategoryUsageType = 'PART,SYMBOL',
): CatalogCategoryNode {
  return CatalogCategoryNodeSchema.parse({
    id: deterministicCategoryUuid(slug),
    slug,
    parentSlug,
    name,
    pathLabel,
    level,
    sortOrder,
    categoryType,
  });
}
