import {
  SymbolDefinitionSchema,
  type SymbolDefinition,
  type SymbolFilter,
  type SymbolStats,
} from '@descriptio-forge/shared';
import type { GlobalVaultDb } from './global-db.js';

interface SymbolRow {
  id: string;
  name: string;
  iec_60617_ref: string | null;
  bmk_prefix: string;
  grid_base_mm: number | null;
  svg_content: string;
  pins_json: string;
  origin_type: string | null;
  updated_at: string;
}

/** Repository fuer alle IEC 60617 Schaltsymbole im globalen Tresor. */
export class SymbolRepository {
  constructor(private readonly globalDb: GlobalVaultDb) {}

  /** Listet Symbole anhand optionaler Filter (Suche, BMK, Teil, Herkunft). */
  listSymbols(filter?: SymbolFilter): SymbolDefinition[] {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filter?.search) {
      conditions.push('(id LIKE ? OR name LIKE ? OR iec_60617_ref LIKE ?)');
      const s = `%${filter.search}%`;
      params.push(s, s, s);
    }
    if (filter?.bmkPrefix) {
      conditions.push('bmk_prefix = ?');
      params.push(filter.bmkPrefix);
    }
    if (filter?.originType) {
      conditions.push('origin_type = ?');
      params.push(filter.originType);
    }
    if (filter?.iecPart) {
      conditions.push('iec_60617_ref LIKE ?');
      params.push(`%${filter.iecPart}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM symbol_library ${where} ORDER BY bmk_prefix, id`;
    const rows = this.globalDb.db.prepare(sql).all(...params) as SymbolRow[];
    return rows.map(fromSymbolRow);
  }

  /** Liest ein einzelnes Symbol anhand der ID. */
  getSymbolById(id: string): SymbolDefinition | null {
    const row = this.globalDb.db
      .prepare('SELECT * FROM symbol_library WHERE id = ?')
      .get(id) as SymbolRow | undefined;
    return row ? fromSymbolRow(row) : null;
  }

  /** Speichert oder aktualisiert ein Symbol. */
  upsertSymbol(symbol: SymbolDefinition): void {
    const validated = SymbolDefinitionSchema.parse(symbol);
    this.globalDb.db
      .prepare(
        `INSERT INTO symbol_library
           (id, name, iec_60617_ref, bmk_prefix, grid_base_mm, svg_content, pins_json, origin_type, updated_at)
         VALUES
           (@id, @name, @iec_60617_ref, @bmk_prefix, @grid_base_mm, @svg_content, @pins_json, @origin_type, @updated_at)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           iec_60617_ref = excluded.iec_60617_ref,
           bmk_prefix = excluded.bmk_prefix,
           grid_base_mm = excluded.grid_base_mm,
           svg_content = excluded.svg_content,
           pins_json = excluded.pins_json,
           origin_type = excluded.origin_type,
           updated_at = excluded.updated_at`,
      )
      .run({
        id: validated.id,
        name: validated.name,
        iec_60617_ref: validated.iec60617Ref,
        bmk_prefix: validated.bmkPrefix,
        grid_base_mm: validated.gridBaseMm,
        svg_content: validated.svgContent,
        pins_json: JSON.stringify(validated.pins),
        origin_type: validated.originType,
        updated_at: new Date().toISOString(),
      });
  }

  /** Loescht ein Symbol anhand seiner ID. */
  deleteSymbol(id: string): boolean {
    const res = this.globalDb.db.prepare('DELETE FROM symbol_library WHERE id = ?').run(id);
    return res.changes > 0;
  }

  /** Ermittelt Kennzahlen zur Symbolbibliothek (Gesamt, Herkunft, IEC-Teile). */
  getStats(): SymbolStats {
    const rows = this.globalDb.db
      .prepare('SELECT origin_type, iec_60617_ref FROM symbol_library')
      .all() as { origin_type: string | null; iec_60617_ref: string | null }[];

    let standardCount = 0;
    let aiGeneratedCount = 0;
    let manualCount = 0;
    const partCounts: Record<string, number> = {};

    for (const r of rows) {
      if (r.origin_type === 'AI_GENERATED') aiGeneratedCount += 1;
      else if (r.origin_type === 'MANUAL') manualCount += 1;
      else standardCount += 1;

      const partMatch = r.iec_60617_ref?.match(/Teil\s*(\d{2})/i);
      const partKey = partMatch ? `Teil ${partMatch[1]}` : 'Sonstige';
      partCounts[partKey] = (partCounts[partKey] ?? 0) + 1;
    }

    return {
      total: rows.length,
      standardCount,
      aiGeneratedCount,
      manualCount,
      partCounts,
    };
  }
}

function fromSymbolRow(row: SymbolRow): SymbolDefinition {
  return SymbolDefinitionSchema.parse({
    id: row.id,
    name: row.name,
    iec60617Ref: row.iec_60617_ref,
    classicRef: null,
    partNumber: null,
    bmkPrefix: row.bmk_prefix,
    gridBaseMm: row.grid_base_mm ?? 4.0,
    svgContent: row.svg_content,
    pins: JSON.parse(row.pins_json) as unknown,
    originType: row.origin_type ?? 'STANDARD',
    updatedAt: row.updated_at,
  });
}
