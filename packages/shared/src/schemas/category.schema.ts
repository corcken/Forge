import { z } from 'zod';

/** Verwendungsart der Kategorie (fuer Artikel, Symbole oder beides). */
export const CategoryUsageTypeSchema = z.enum(['PART,SYMBOL', 'PART', 'SYMBOL']);
export type CategoryUsageType = z.infer<typeof CategoryUsageTypeSchema>;

/** Ein einzelner Knoten im hierarchischen E-CAD Kategoriebaum. */
export const CatalogCategoryNodeSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  parentSlug: z.string().nullable().default(null),
  name: z.string().min(1),
  pathLabel: z.string(),
  level: z.number().int().min(0).max(4),
  categoryType: CategoryUsageTypeSchema.default('PART,SYMBOL'),
  sortOrder: z.number().int().default(0),
});
export type CatalogCategoryNode = z.infer<typeof CatalogCategoryNodeSchema>;

/** Filter- und Suchkriterien fuer Kategorien. */
export const CategoryFilterSchema = z.object({
  search: z.string().optional(),
  level: z.number().int().optional(),
  parentSlug: z.string().optional(),
});
export type CategoryFilter = z.infer<typeof CategoryFilterSchema>;
