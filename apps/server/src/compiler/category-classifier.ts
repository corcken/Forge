import { deterministicCategoryUuid } from '../vault/seeds/category-builders.js';
import { STANDARD_CATALOG_CATEGORIES } from '../vault/seeds/category-seeds.js';

export interface CategoryClassificationInput {
  archetypeId: string | null;
  mainCurrentAmps?: number | null;
  rawMarkdown?: string | null;
  partName?: string | null;
  description?: string | null;
}

export interface CategoryClassificationResult {
  categoryId: string;
  categorySlug: string;
  categoryPath: string;
}

const CATEGORY_MAP = new Map(STANDARD_CATALOG_CATEGORIES.map((c) => [c.slug, c]));

/**
 * Deterministischer Klassifizierer fuer Industrie-Stammdaten:
 * Mappt einen Artikel anhand seines Archetyps, Nennstroms, Polzahl und
 * Hersteller-Katalogpfads auf den passenden 4-stufigen Kategoriebaum-Knoten.
 */
export function classifyPartCategory(input: CategoryClassificationInput): CategoryClassificationResult {
  const slug = resolveSlug(input);
  const node = CATEGORY_MAP.get(slug);

  if (node) {
    return {
      categoryId: node.id,
      categorySlug: node.slug,
      categoryPath: node.pathLabel,
    };
  }

  // Fallback, falls ein generierter Slug nicht exakt gefunden wurde
  const fallback = CATEGORY_MAP.get('08_gehaeuse_mechanik.zubehoer_mechanik.zubehoer_allgemein')!;
  return {
    categoryId: deterministicCategoryUuid(slug),
    categorySlug: slug,
    categoryPath: fallback.pathLabel,
  };
}

function resolveSlug(input: CategoryClassificationInput): string {
  const arc = (input.archetypeId ?? '').toUpperCase();
  const amps = input.mainCurrentAmps ?? null;
  const text = `${input.partName ?? ''} ${input.description ?? ''} ${input.rawMarkdown ?? ''}`.toLowerCase();

  // 1. Leitungsschutzschalter (MCB)
  if (arc.startsWith('MCB_')) {
    const pole = arc.includes('1P_N') ? '1p_n' : arc.includes('3P_N') ? '3p_n' : arc.includes('1P') ? '1p' : arc.includes('2P') ? '2p' : arc.includes('3P') ? '3p' : '4p';
    const step = amps !== null ? (amps <= 6 ? 'bis_6a' : amps <= 16 ? '10_16a' : amps <= 32 ? '20_32a' : 'ab_40a') : '10_16a';
    return `02_schutzgeraete.mcb.${pole}.${step}`;
  }

  // 2. Kompaktleistungsschalter (MCCB)
  if (arc.startsWith('MCCB_')) {
    if (arc.includes('4P')) {
      const step = amps !== null && amps > 250 ? 'ab_400a' : 'bis_250a';
      return `02_schutzgeraete.mccb.4p.${step}`;
    }
    const step = amps !== null ? (amps <= 160 ? 'bis_160a' : amps <= 250 ? '250a' : amps <= 630 ? '400_630a' : 'ab_800a') : 'bis_160a';
    return `02_schutzgeraete.mccb.3p.${step}`;
  }

  // 3. Leistungsschuetze & Installationsschuetze
  if (arc.startsWith('CONTACTOR_')) {
    if (text.includes('installation contactor') || text.includes('installationsschütz') || text.includes('esb') || text.includes('z-sch')) {
      return '03_schaltgeraete_antriebe.leistungsschuetze.installationsschuetze';
    }
    if (arc.includes('4P')) return '03_schaltgeraete_antriebe.leistungsschuetze.4p_schuetze';
    if (amps !== null) {
      if (amps <= 12) return '03_schaltgeraete_antriebe.leistungsschuetze.kleinschuetze_bis_12a';
      if (amps <= 38) return '03_schaltgeraete_antriebe.leistungsschuetze.standard_9_38a';
      if (amps <= 95) return '03_schaltgeraete_antriebe.leistungsschuetze.mittel_40_95a';
      return '03_schaltgeraete_antriebe.leistungsschuetze.gross_ab_115a';
    }
    return '03_schaltgeraete_antriebe.leistungsschuetze.standard_9_38a';
  }

  // 4. Zubehoer & Mechanik (Differenzierung nach Ziel-Geraet)
  if (arc === 'MECHANICAL_ACCESSORY') {
    if (text.includes('circuit breaker') || text.includes('leistungsschalter') || text.includes('nzm') || text.includes('tmax') || text.includes('sace') || text.includes('mccb')) {
      return '08_gehaeuse_mechanik.zubehoer_mechanik.zubehoer_leistungsschalter';
    }
    if (text.includes('contactor') || text.includes('schütz') || text.includes('motor') || text.includes('dilm') || text.includes('pkz')) {
      return '08_gehaeuse_mechanik.zubehoer_mechanik.zubehoer_schuetze_motorschutz';
    }
    if (text.includes('pilot') || text.includes('befehls') || text.includes('rmq') || text.includes('m22') || text.includes('pushbutton') || text.includes('taster')) {
      return '08_gehaeuse_mechanik.zubehoer_mechanik.zubehoer_befehlsgeraete';
    }
    if (text.includes('enclosure') || text.includes('schrank') || text.includes('verteiler') || text.includes('gehäuse') || text.includes('xenergy') || text.includes('montage')) {
      return '08_gehaeuse_mechanik.zubehoer_mechanik.zubehoer_schaltschrank_montage';
    }
    return '08_gehaeuse_mechanik.zubehoer_mechanik.zubehoer_allgemein';
  }

  // 5. RCBO & RCD
  if (arc.startsWith('RCBO_')) {
    if (arc.includes('1P_N')) return amps !== null && amps > 16 ? '02_schutzgeraete.rcbo.1p_n_ab_20a' : '02_schutzgeraete.rcbo.1p_n_bis_16a';
    if (arc.includes('2P')) return '02_schutzgeraete.rcbo.2p';
    if (arc.includes('3P_N')) return '02_schutzgeraete.rcbo.3p_n';
    return '02_schutzgeraete.rcbo.4p';
  }
  if (arc.startsWith('RCD_')) {
    const is2P = arc.includes('2P');
    const isHighAmp = amps !== null && amps > 40;
    return is2P ? (isHighAmp ? '02_schutzgeraete.rcd.2p_ab_63a' : '02_schutzgeraete.rcd.2p_bis_40a') : (isHighAmp ? '02_schutzgeraete.rcd.4p_ab_63a' : '02_schutzgeraete.rcd.4p_bis_40a');
  }

  // 6. Motorschutz & Ueberlastrelais
  if (arc.startsWith('MSS_')) {
    if (amps !== null && amps <= 4) return '02_schutzgeraete.motorschutz.mss_bis_4a';
    if (amps !== null && amps > 16) return '02_schutzgeraete.motorschutz.mss_ab_16a';
    return '02_schutzgeraete.motorschutz.mss_4_16a';
  }
  if (arc.startsWith('OVERLOAD_RELAY_')) {
    return text.includes('electronic') || text.includes('elektronisch') ? '02_schutzgeraete.motorschutz.ueberlastrelais_elektronisch' : '02_schutzgeraete.motorschutz.ueberlastrelais_thermisch';
  }

  // 7. Hauptschalter, Lasttrenner, Nockenschalter
  if (arc.startsWith('MAIN_SWITCH_')) {
    if (text.includes('nocken') || text.includes('cam switch') || text.includes('t0') || text.includes('t3') || text.includes('p1')) {
      return '01_einspeisung_hauptschalter.nockenschalter.haupt_not_aus';
    }
    if (arc.includes('4P') || arc.includes('6P')) return amps !== null && amps > 63 ? '01_einspeisung_hauptschalter.lasttrennschalter.4p_ab_80a' : '01_einspeisung_hauptschalter.lasttrennschalter.4p_bis_63a';
    return amps !== null && amps > 63 ? '01_einspeisung_hauptschalter.lasttrennschalter.3p_ab_80a' : '01_einspeisung_hauptschalter.lasttrennschalter.3p_bis_63a';
  }

  // 8. Befehls- & Meldegeraete
  if (arc.startsWith('PILOT_ACTUATOR_')) return text.includes('wahl') || text.includes('selector') ? '05_befehls_meldegeraete.frontelemente.wahlschalter_frontelemente' : '05_befehls_meldegeraete.frontelemente.taster_frontelemente';
  if (arc === 'PILOT_LED_ONLY') return '05_befehls_meldegeraete.frontelemente.leuchtmelder_frontelemente';
  if (arc.startsWith('PILOT')) return text.includes('wahl') || text.includes('selector') ? '05_befehls_meldegeraete.drucktaster_schalter.wahlschalter_schluesselschalter' : '05_befehls_meldegeraete.drucktaster_schalter.drucktaster_komplett';

  // 9. Hilfsschuetze, Relais & Antriebe
  if (arc.startsWith('AUX_CONTACTOR')) return '03_schaltgeraete_antriebe.hilfsschuetze_bloecke.hilfsschuetze';
  if (arc.startsWith('AUX_BLOCK')) return '03_schaltgeraete_antriebe.hilfsschuetze_bloecke.hilfsschalterbloecke';
  if (arc.startsWith('SURGE_SUPPRESSOR')) return '03_schaltgeraete_antriebe.hilfsschuetze_bloecke.schutzbeschaltung_varistor';
  if (arc.startsWith('VFD_')) return arc.includes('1AC') ? '03_schaltgeraete_antriebe.antriebstechnik.frequenzumrichter_1ac' : '03_schaltgeraete_antriebe.antriebstechnik.frequenzumrichter_3ac';
  if (arc.startsWith('SOFT_STARTER_')) return '03_schaltgeraete_antriebe.antriebstechnik.sanftstarter';
  if (arc.startsWith('TIME_RELAY')) return '03_schaltgeraete_antriebe.relais.zeitrelais';
  if (arc.startsWith('MONITOR_RELAY')) return '03_schaltgeraete_antriebe.relais.ueberwachungsrelais';
  if (arc.startsWith('SAFETY_RELAY')) return '03_schaltgeraete_antriebe.relais.sicherheitsrelais';
  if (arc.startsWith('RELAY_COIL')) return '03_schaltgeraete_antriebe.relais.koppelrelais';

  // 10. Ausloeser, Sicherungen, SPD & Netzteile
  if (arc.startsWith('RELEASE_COIL_SHUNT')) return '02_schutzgeraete.ausloeser_antriebe.arbeitsstromausloeser';
  if (arc.startsWith('RELEASE_COIL_UV')) return '02_schutzgeraete.ausloeser_antriebe.unterspannungsausloeser';
  if (arc.startsWith('MOTOR_OPERATOR')) return '02_schutzgeraete.ausloeser_antriebe.motorantriebe';
  if (arc.startsWith('FUSE_HOLDER')) return '02_schutzgeraete.sicherungen_spd.sicherungshalter';
  if (arc.startsWith('FUSE_LINK')) return '02_schutzgeraete.sicherungen_spd.schmelzeinsaetze';
  if (arc.startsWith('SPD_')) return '02_schutzgeraete.sicherungen_spd.ueberspannungsableiter_spd';
  if (arc.startsWith('CB_ELECTRONIC')) return '02_schutzgeraete.sicherungen_spd.elektronische_schutzschalter_24v';
  if (arc.startsWith('PSU_')) return arc.includes('3AC') ? '04_stromversorgung_trafos.schaltnetzteile.24vdc_3ac' : '04_stromversorgung_trafos.schaltnetzteile.24vdc_1ac';
  if (arc.startsWith('TRANSFORMER_')) return arc.includes('3P') ? '04_stromversorgung_trafos.transformatoren.drehstromtrafos_3p' : '04_stromversorgung_trafos.transformatoren.steuertrafos_1p';

  // 11. Schienen, Klemmen & Verkabelung
  if (arc.startsWith('BUSBAR_TERMINAL')) return '01_einspeisung_hauptschalter.sammelschienen.einspeiseklemmen_adapter';
  if (arc.startsWith('BUSBAR_')) return '01_einspeisung_hauptschalter.sammelschienen.phasenschienen_mcb';
  if (arc.startsWith('TERMINAL_PE')) return '07_klemmen_verbindung.reihenklemmen.schutzleiterklemmen_pe';
  if (arc.startsWith('TERMINAL_DISCONNECT')) return '07_klemmen_verbindung.reihenklemmen.neutralleiter_trennklemmen';
  if (arc.startsWith('TERMINAL_FUSE')) return '07_klemmen_verbindung.reihenklemmen.sicherungsklemmen';
  if (arc.startsWith('TERMINAL_DIST')) return '07_klemmen_verbindung.reihenklemmen.potenzialverteiler';
  if (arc.startsWith('TERMINAL_THROUGH') || arc.startsWith('TERMINAL_')) return '07_klemmen_verbindung.reihenklemmen.durchgangsklemmen';
  if (arc.startsWith('PLUG_')) return '07_klemmen_verbindung.steckverbinder_kabel.industriesteckverbinder';
  if (arc === 'DATA_CABLE') return '07_klemmen_verbindung.steckverbinder_kabel.feldbus_datenleitungen';

  // 12. SPS, HMI, Sensoren & Gehaeuse
  if (arc.startsWith('PLC_DI_')) return '06_sps_sensorik.sps_plc.digitale_eingaenge_di';
  if (arc.startsWith('PLC_DO_')) return '06_sps_sensorik.sps_plc.digitale_ausgaenge_do';
  if (arc.startsWith('PLC_AI_') || arc.startsWith('PLC_AO_')) return '06_sps_sensorik.sps_plc.analoge_ea_ai_ao';
  if (arc.startsWith('PLC_COMM_')) return '06_sps_sensorik.sps_plc.kommunikation_feldbus';
  if (arc.startsWith('PLC_BASE_')) return '06_sps_sensorik.sps_plc.basismodule_zubehoer';
  if (arc.startsWith('PLC_COMPACT')) return '06_sps_sensorik.sps_plc.kompakt_sps_steuerrelais';
  if (arc.startsWith('HMI_PANEL')) return '06_sps_sensorik.hmi.touchpanels_displays';
  if (arc.startsWith('POSITION_SWITCH')) return '06_sps_sensorik.sensoren_schalter.positionsschalter_endschalter';
  if (arc.startsWith('PRESSURE_SWITCH')) return '06_sps_sensorik.sensoren_schalter.druckwaechter';
  if (arc.startsWith('SENSOR_')) {
    if (text.includes('optisch') || text.includes('photo') || text.includes('licht')) return '06_sps_sensorik.sensoren_schalter.optische_sensoren';
    if (text.includes('kapazitiv') || text.includes('capacitive')) return '06_sps_sensorik.sensoren_schalter.kapazitive_sensoren';
    return '06_sps_sensorik.sensoren_schalter.induktive_sensoren';
  }
  if (arc.startsWith('ENCLOSURE_')) {
    return text.includes('wand') || text.includes('wall') ? '08_gehaeuse_mechanik.schaltschraenke_gehaeuse.wandschraenke' : '08_gehaeuse_mechanik.schaltschraenke_gehaeuse.standschraenke';
  }

  return '08_gehaeuse_mechanik.zubehoer_mechanik.zubehoer_allgemein';
}
