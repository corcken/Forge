import fs from 'node:fs';
import path from 'node:path';
import {
  DescriptioExportPackageSchema,
  type CatalogCategoryNode,
  type CatalogPart,
  type SymbolFilter,
} from '@descriptio-forge/shared';
import { sha256Hex } from '../pipeline/ingest-utils.js';
import type { CategoryRepository } from '../vault/category-repository.js';
import type { RunPartRepository } from '../vault/run-part-repository.js';
import type { SymbolRepository } from '../vault/symbol-repository.js';
import type { VaultPaths } from '../vault/paths.js';
import { buildIecSymbolCategories } from './descriptio-symbol-compiler.js';
import { compileSymbolForDescriptio } from './descriptio-symbol-state.js';

export interface ExportResult {
  runId: string;
  filePath: string;
  importHash: string;
  partCount: number;
}

export interface SymbolExportResult {
  filePath: string;
  categoriesFilePath: string;
  symbolCount: number;
  categoryCount: number;
}

export interface ExportFileInfo {
  fileName: string;
  filePath: string;
  sizeBytes: number;
  modifiedAt: string;
}

/**
 * Exportiert alle validierten Artikel eines Runs als flaches, vollstaendig
 * typisiertes `.descriptio.json`-Paket nach `~/.descriptio-forge/exports/`.
 */
export function exportRun(
  runId: string,
  repo: RunPartRepository,
  paths: VaultPaths,
  categoryRepo?: CategoryRepository,
): ExportResult {
  const valid = repo
    .listParts(runId)
    .filter(
      (part) =>
        part.compiledPart !== null &&
        (part.pipelineStatus === 'VALIDATED' || part.pipelineStatus === 'EXPORT_READY'),
    );

  const categories: CatalogCategoryNode[] = categoryRepo ? categoryRepo.listCategories() : [];

  const catalogParts: CatalogPart[] = valid.map((part) => {
    const version = part.compiledPart!;
    return {
      id: part.id,
      manufacturer: part.manufacturer,
      articleNr: part.articleNr,
      name: version.name,
      type: null,
      seriesName: version.seriesName,
      category: version.category,
      categoryId: version.categoryId ?? null,
      categorySlug: version.categorySlug ?? null,
      categoryPath: version.categoryPath ?? null,
      datasheetLink: version.datasheetLink ?? null,
      imageLink: version.imageLink ?? null,
      archetypeId: part.archetypeId,
      versions: [version],
    };
  });

  const generatedAt = new Date().toISOString();
  const importHash = sha256Hex(JSON.stringify(catalogParts));
  const pkg = DescriptioExportPackageSchema.parse({
    schemaVersion: '1.0',
    generatedAt,
    appVersion: '0.1.0',
    importHash,
    categories,
    parts: catalogParts,
  });

  const stamp = generatedAt.replace(/[:.]/gu, '-');
  const filePath = path.join(paths.exportsDir, `${runId}_${stamp}.descriptio.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  return { runId, filePath, importHash, partCount: catalogParts.length };
}

/**
 * Kompiliert alle (oder gefilterte) IEC-60617-Symbole aus dem Tresor in das
 * Descriptio-Importformat (`descriptio_symbols.json` + Kategorien) unter `~/.descriptio-forge/exports/`.
 */
export function exportSymbols(
  symbolRepo: SymbolRepository,
  paths: VaultPaths,
  filter?: SymbolFilter,
): SymbolExportResult {
  const symbols = symbolRepo.listSymbols(filter);
  const compiled = symbols.map((sym) =>
    compileSymbolForDescriptio({
      id: sym.id,
      name: sym.name,
      iec60617Ref: sym.iec60617Ref,
      bmkPrefix: sym.bmkPrefix,
      svgContent: sym.svgContent,
      originType: sym.originType,
      pins: sym.pins.map((p) => ({
        pinIndex: p.pinIndex,
        defaultLabel: p.defaultLabel,
        xMm: p.xMm,
        yMm: p.yMm,
        direction: p.direction,
      })),
    }),
  );

  const categories = buildIecSymbolCategories();
  const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
  if (!fs.existsSync(paths.exportsDir)) {
    fs.mkdirSync(paths.exportsDir, { recursive: true });
  }

  const filePath = path.join(paths.exportsDir, `descriptio_symbols_${stamp}.json`);
  const categoriesFilePath = path.join(paths.exportsDir, `descriptio_symbol_categories_${stamp}.json`);

  fs.writeFileSync(filePath, `${JSON.stringify(compiled, null, 2)}\n`, 'utf8');
  fs.writeFileSync(categoriesFilePath, `${JSON.stringify(categories, null, 2)}\n`, 'utf8');

  return {
    filePath,
    categoriesFilePath,
    symbolCount: compiled.length,
    categoryCount: categories.length,
  };
}

/** Listet alle bereits exportierten `.descriptio.json`-Pakete auf. */
export function listExports(paths: VaultPaths): ExportFileInfo[] {
  if (!fs.existsSync(paths.exportsDir)) return [];
  return fs
    .readdirSync(paths.exportsDir)
    .filter((name) => name.endsWith('.descriptio.json') || (name.startsWith('descriptio_symbols_') && name.endsWith('.json')))
    .map((fileName) => {
      const filePath = path.join(paths.exportsDir, fileName);
      const stat = fs.statSync(filePath);
      return {
        fileName,
        filePath,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
}
