import type Database from 'better-sqlite3';
import {
  CatalogCategoryNodeSchema,
  type CatalogCategoryNode,
  type CategoryFilter,
} from '@descriptio-forge/shared';
import type { GlobalVaultDb } from './global-db.js';

interface CategoryRow {
  id: string;
  slug: string;
  parent_slug: string | null;
  name: string;
  path_label: string;
  level: number;
  category_type: string;
  sort_order: number;
}

/** Repository fuer alle Knoten des hierarchischen Kategoriebaums. */
export class CategoryRepository {
  constructor(private readonly globalDb: GlobalVaultDb) {}

  /** Listet alle Kategorien gemaess optionalen Filtern (Suche, Ebene, Parent). */
  listCategories(filter?: CategoryFilter): CatalogCategoryNode[] {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter?.search) {
      conditions.push('(name LIKE ? OR slug LIKE ? OR path_label LIKE ?)');
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }
    if (filter?.level !== undefined) {
      conditions.push('level = ?');
      params.push(filter.level);
    }
    if (filter?.parentSlug !== undefined) {
      conditions.push('parent_slug = ?');
      params.push(filter.parentSlug);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM catalog_categories ${where} ORDER BY sort_order, slug`;
    const rows = this.globalDb.db.prepare(sql).all(...params) as CategoryRow[];
    return rows.map(fromCategoryRow);
  }

  /** Findet eine Kategorie anhand des Slugs. */
  getBySlug(slug: string): CatalogCategoryNode | null {
    const row = this.globalDb.db
      .prepare('SELECT * FROM catalog_categories WHERE slug = ?')
      .get(slug) as CategoryRow | undefined;
    return row ? fromCategoryRow(row) : null;
  }

  /** Findet eine Kategorie anhand der UUID. */
  getById(id: string): CatalogCategoryNode | null {
    const row = this.globalDb.db
      .prepare('SELECT * FROM catalog_categories WHERE id = ?')
      .get(id) as CategoryRow | undefined;
    return row ? fromCategoryRow(row) : null;
  }

  /** Legt eine Kategorie an oder aktualisiert sie. */
  upsertCategory(node: CatalogCategoryNode): void {
    const v = CatalogCategoryNodeSchema.parse(node);
    this.globalDb.db
      .prepare(
        `INSERT INTO catalog_categories
           (id, slug, parent_slug, name, path_label, level, category_type, sort_order, updated_at)
         VALUES
           (@id, @slug, @parent_slug, @name, @path_label, @level, @category_type, @sort_order, @updated_at)
         ON CONFLICT(slug) DO UPDATE SET
           name = excluded.name,
           path_label = excluded.path_label,
           level = excluded.level,
           category_type = excluded.category_type,
           sort_order = excluded.sort_order,
           updated_at = excluded.updated_at`,
      )
      .run({
        id: v.id,
        slug: v.slug,
        parent_slug: v.parentSlug,
        name: v.name,
        path_label: v.pathLabel,
        level: v.level,
        category_type: v.categoryType,
        sort_order: v.sortOrder,
        updated_at: new Date().toISOString(),
      });
  }

  /**
   * Zaehlt die verknuepften Artikel pro Kategorie in einer gegebenen Run-Datenbank.
   * Liest dazu das `compiled_part_json` der `VALIDATED`-Artikel aus.
   */
  countPartsByCategory(runDb: Database.Database): Record<string, number> {
    const rows = runDb
      .prepare(
        `SELECT json_extract(compiled_part_json, '$.categorySlug') AS slug, count(*) AS count
         FROM staged_parts
         WHERE pipeline_status = 'VALIDATED' AND compiled_part_json IS NOT NULL
         GROUP BY slug`,
      )
      .all() as { slug: string | null; count: number }[];

    const counts: Record<string, number> = {};
    for (const r of rows) {
      if (r.slug) counts[r.slug] = r.count;
    }
    return counts;
  }
}

function fromCategoryRow(row: CategoryRow): CatalogCategoryNode {
  return CatalogCategoryNodeSchema.parse({
    id: row.id,
    slug: row.slug,
    parentSlug: row.parent_slug,
    name: row.name,
    pathLabel: row.path_label,
    level: row.level,
    categoryType: row.category_type,
    sortOrder: row.sort_order,
  });
}
