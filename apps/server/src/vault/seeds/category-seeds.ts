import type { CatalogCategoryNode } from '@descriptio-forge/shared';
import { buildPowerCategories } from './category-seeds-power.js';
import { buildAutomationCategories } from './category-seeds-automation.js';

/**
 * Gesamtheit aller Standard-Kategorien im 4-stufigen E-CAD Kategoriebaum
 * nach ECLASS 27 / ETIM Vorbild. Diese werden beim Serverstart idempotent
 * in `global-vault.sqlite` (`catalog_categories`) hinterlegt.
 */
export const STANDARD_CATALOG_CATEGORIES: readonly CatalogCategoryNode[] = [
  ...buildPowerCategories(),
  ...buildAutomationCategories(),
];
