import fs from 'node:fs';
import path from 'node:path';
import {
  DescriptioExportPackageSchema,
  type CatalogPart,
} from '@descriptio-forge/shared';
import { sha256Hex } from '../pipeline/ingest-utils.js';
import type { RunPartRepository } from '../vault/run-part-repository.js';
import type { VaultPaths } from '../vault/paths.js';

export interface ExportResult {
  runId: string;
  filePath: string;
  importHash: string;
  partCount: number;
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
export function exportRun(runId: string, repo: RunPartRepository, paths: VaultPaths): ExportResult {
  const valid = repo
    .listParts(runId)
    .filter(
      (part) =>
        part.compiledPart !== null &&
        (part.pipelineStatus === 'VALIDATED' || part.pipelineStatus === 'EXPORT_READY'),
    );

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
    parts: catalogParts,
  });

  const stamp = generatedAt.replace(/[:.]/gu, '-');
  const filePath = path.join(paths.exportsDir, `${runId}_${stamp}.descriptio.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');

  return { runId, filePath, importHash, partCount: catalogParts.length };
}

/** Listet alle bereits exportierten `.descriptio.json`-Pakete auf. */
export function listExports(paths: VaultPaths): ExportFileInfo[] {
  if (!fs.existsSync(paths.exportsDir)) return [];
  return fs
    .readdirSync(paths.exportsDir)
    .filter((name) => name.endsWith('.descriptio.json'))
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
