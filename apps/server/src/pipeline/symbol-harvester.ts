import type { SymbolDefinition } from '@descriptio-forge/shared';
import type { AiGateway } from '../ai-gateway/gateway.js';
import type { ActivityLogService } from './activity-log.js';
import type { SymbolRepository } from '../vault/symbol-repository.js';
import { composeIecPrimitiveSvg } from '../vault/seeds/symbol-svg-composer.js';
import { buildMultiPolePins, normalizeIec81346BmkPrefix } from '../vault/seeds/symbol-svg-shapes.js';
import { normalizePinLabels } from '../exporter/descriptio-symbol-state.js';
import { IEC_SECTIONS, type IecSection } from './iec-sections-catalog.js';

export { IEC_SECTIONS, type IecSection };

interface RawSymbolResponse {
  id?: string;
  name?: string;
  iec60617Ref?: string;
  bmkPrefix?: string;
  pinCount?: number;
  defaultLabels?: string[];
  baseShape?: string;
  actuator?: string;
  qualifier?: string;
}

const BASE_SHAPE_LIST =
  'CONTACT_NO|CONTACT_NC|CONTACT_CO|CONTACT_NO_DOUBLE|CONTACT_TWO_WAY|' +
  'SWITCH_POLE|DISCONNECTOR|LOAD_SWITCH|CB_POLE|EARTHING_SWITCH|' +
  'COIL|COIL_DOUBLE|COIL_POLARIZED|PROTECTION_RELAY|SOLENOID_VALVE|' +
  'FUSE|FUSE_STRIKER|SPD_ARRESTER|SPARK_GAP|' +
  'RESISTOR|POTENTIOMETER|VARISTOR|HEATER|CAPACITOR|INDUCTOR|CHOKE_CORE|' +
  'DIODE|ZENER_DIODE|THYRISTOR|TRANSISTOR|OPTOCOUPLER|' +
  'MOTOR|WINDING|CURRENT_TRANSFORMER|CONVERTER_BOX|BATTERY|' +
  'TERMINAL|PLUG_SOCKET|SENSOR_BOX|METER_CIRCLE|METER_BOX|LAMP_CROSS|HORN_BUZZER|BELL_SIREN|PLC_BLOCK';

const ACTUATOR_LIST =
  'NONE|PUSHBUTTON|PULL|MUSHROOM|KEY|ROTARY|TOGGLE_LEVER|FOOT_PEDAL|ROLLER|CAM|' +
  'SPRING_RETURN|LATCH_DETENT|POSITIVE_OPENING|THERMAL|MAGNETIC|THERMAL_MAGNETIC|' +
  'DELAY_ON|DELAY_OFF|DELAY_BOTH|EARLY_MAKE|LATE_BREAK|PRESSURE|TEMPERATURE|' +
  'LEVEL|FLOW|SPEED_RPM|COUNT_IMPULSE|OPTICAL|LIGHT_EMITTING|PROXIMITY|CAPACITIVE|ULTRASONIC|SEMICONDUCTOR';

/** Dienst zum kapitelweisen KI-Sammeln von IEC 60617 Symbolnummern + Primitiv-Rezept. */
export class SymbolHarvester {
  constructor(
    private readonly symbolRepo: SymbolRepository,
    private readonly aiGateway: AiGateway,
    private readonly activityLog: ActivityLogService,
  ) {}

  /** Durchlaeuft alle 60 Unterkapitel der IEC 60617 und sammelt/zeichnet Symbole. */
  async harvestCatalog(options: {
    providerId: string;
    modelId: string;
    partFilter?: string;
  }): Promise<{ scannedSections: number; symbolsAdded: number; symbolsUpdated: number; totalNow: number }> {
    const sections = options.partFilter
      ? IEC_SECTIONS.filter((s) => s.part.includes(options.partFilter!) || s.code.startsWith(options.partFilter!))
      : IEC_SECTIONS;

    this.activityLog.info(
      'AI',
      `[IEC 60617 Harvester] Starte Tiefen-Sammlung ueber ${sections.length} Unterkapitel mit ${options.modelId}`,
    );

    let symbolsAdded = 0;
    let symbolsUpdated = 0;
    const batchSize = 5;
    for (let i = 0; i < sections.length; i += batchSize) {
      const batch = sections.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (section) => {
          try {
            return await this.harvestSection(section, options.providerId, options.modelId);
          } catch (err) {
            this.activityLog.warn(
              'AI',
              `[IEC 60617 Harvester] Fehler in Abschnitt ${section.code}: ${(err as Error).message}`,
            );
            return { added: 0, updated: 0 };
          }
        }),
      );
      for (const r of results) {
        symbolsAdded += r.added;
        symbolsUpdated += r.updated;
      }
    }

    const stats = this.symbolRepo.getStats();
    this.activityLog.info(
      'AI',
      `[IEC 60617 Harvester] Fertig: +${symbolsAdded} neu, ${symbolsUpdated} aktualisiert. Gesamtbestand: ${stats.total}`,
    );
    return { scannedSections: sections.length, symbolsAdded, symbolsUpdated, totalNow: stats.total };
  }

  private async harvestSection(
    section: IecSection,
    providerId: string,
    modelId: string,
  ): Promise<{ added: number; updated: number }> {
    const systemPrompt =
      'Du bist ein DIN EN 60617 / IEC 60617 E-CAD Normexperte. Antworte ausschliesslich mit einem validen JSON-Array (15 bis 20 verschiedene Symbole) ohne Markdown-Codeblocks.\n' +
      'Jedes Objekt im Array hat exakt diese Felder:\n' +
      '{"id": "SYM_IEC_<CODE>", "name": string, "iec60617Ref": "S00xxx | XX-YY-ZZ | Teil XX", ' +
      '"bmkPrefix": string, "pinCount": 1|2|3|4, "defaultLabels": string[], ' +
      `"baseShape": "${BASE_SHAPE_LIST}", ` +
      `"actuator": "${ACTUATOR_LIST}", ` +
      '"qualifier": string (optional, max 5 Zeichen, z.B. "I>", "U<", "3~", "M", "G", "kWh", "Pt100", "cosφ", "ΔI", "Hz", "Ω", "°C", "")}';

    const userPrompt =
      `Liste 15 bis 20 verschiedene, genormte Schaltzeichen der DIN EN 60617 / IEC 60617 fuer das Fachgebiet "${section.code}: ${section.name}" (${section.part}) auf. ` +
      `Waehle fuer jedes Symbol die praeziseste Kombination aus baseShape, actuator und qualifier, damit das gezeichnete E-CAD-Symbol die Normfunktion exakt darstellt.`;

    const rawResponse = await this.aiGateway.queryChat(providerId, {
      modelId,
      systemPrompt,
      userPrompt,
      timeoutMs: 45000,
    });

    const parsed = parseJsonArray(rawResponse);
    let added = 0;
    let updated = 0;

    for (const item of parsed) {
      if (!item.name || !item.bmkPrefix) continue;
      const refSlug = item.iec60617Ref?.split('|')[0]?.trim().replace(/[^a-zA-Z0-9]/gu, '_');
      const rawId = item.id || (refSlug ? `SYM_IEC_${refSlug}` : `SYM_IEC_${section.code.replace('-', '_')}`);
      const safeId = rawId.toUpperCase().replace(/[^A-Z0-9_]/gu, '_').replace(/^SYM_SYM_/, 'SYM_');

      const existing = this.symbolRepo.getSymbolById(safeId);
      if (existing && existing.originType === 'STANDARD') continue;

      const refText = item.iec60617Ref?.includes('Teil')
        ? item.iec60617Ref
        : `${item.iec60617Ref || `${section.code}-xx`} | ${section.part}`;

      const isEarthingSwitch =
        item.baseShape?.toUpperCase() === 'EARTHING_SWITCH' ||
        item.name.toLowerCase().includes('erdungsschalter');
      const pinCount = isEarthingSwitch ? 1 : Math.max(1, Math.min(4, item.pinCount ?? 2));
      const rawLabels = item.defaultLabels ?? (pinCount === 2 ? ['1', '2'] : ['1', '2', '3']);
      const tempPins = buildMultiPolePins(pinCount, rawLabels);
      const cleanLabels = normalizePinLabels(tempPins, refText, item.name);
      const pins = buildMultiPolePins(pinCount, cleanLabels);
      const bmk = normalizeIec81346BmkPrefix(item.bmkPrefix, refText, item.name);
      const svg = composeIecPrimitiveSvg(
        item.baseShape,
        item.actuator,
        bmk,
        pinCount,
        item.qualifier,
        refText,
        item.name,
      );

      const symbol: SymbolDefinition = {
        id: safeId,
        name: item.name.trim(),
        iec60617Ref: refText,
        classicRef: null,
        partNumber: null,
        bmkPrefix: bmk,
        gridBaseMm: 4.0,
        svgContent: svg,
        pins,
        originType: 'AI_GENERATED',
        updatedAt: new Date().toISOString(),
      };

      this.symbolRepo.upsertSymbol(symbol);
      if (existing) updated += 1;
      else added += 1;
    }

    if (added > 0 || updated > 0) {
      this.activityLog.info(
        'AI',
        `[IEC 60617 Harvester] ${section.code} (${section.name}): +${added} neu, ${updated} aktualisiert`,
      );
    }
    return { added, updated };
  }
}

function parseJsonArray(text: string): RawSymbolResponse[] {
  try {
    const cleaned = text.replace(/```json/giu, '').replace(/```/gu, '').trim();
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket === -1 || lastBracket === -1) return [];
    return JSON.parse(cleaned.slice(firstBracket, lastBracket + 1)) as RawSymbolResponse[];
  } catch {
    return [];
  }
}
