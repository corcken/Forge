import type { CatalogCategoryNode } from '@descriptio-forge/shared';
import { cat } from './category-builders.js';

export function buildAutomationCategories(): CatalogCategoryNode[] {
  const nodes: CatalogCategoryNode[] = [];
  let ord = 500;

  // 05. Befehls- & Meldegeraete
  const r5 = '05_befehls_meldegeraete';
  nodes.push(cat(r5, null, 'Befehls- & Meldegeräte', 'Befehls- & Meldegeräte', 0, ord++));

  nodes.push(cat(`${r5}.drucktaster_schalter`, r5, 'Komplettgeräte & Taster', 'Befehlsmelder » Taster', 1, ord++));
  nodes.push(cat(`${r5}.drucktaster_schalter.drucktaster_komplett`, `${r5}.drucktaster_schalter`, 'Drucktaster (Komplettgerät)', 'Taster » Komplett', 2, ord++));
  nodes.push(cat(`${r5}.drucktaster_schalter.leuchtdrucktaster`, `${r5}.drucktaster_schalter`, 'Leuchtdrucktaster', 'Taster » Leuchtend', 2, ord++));
  nodes.push(cat(`${r5}.drucktaster_schalter.wahlschalter_schluesselschalter`, `${r5}.drucktaster_schalter`, 'Wahlschalter & Schlüsselschalter', 'Taster » Wahlschalter', 2, ord++));
  nodes.push(cat(`${r5}.drucktaster_schalter.not_halt_pilztaster`, `${r5}.drucktaster_schalter`, 'Not-Halt-Taster / Pilztaster', 'Taster » Not-Halt', 2, ord++));

  nodes.push(cat(`${r5}.frontelemente`, r5, 'Frontelemente & Betätiger', 'Befehlsmelder » Frontelemente', 1, ord++));
  nodes.push(cat(`${r5}.frontelemente.taster_frontelemente`, `${r5}.frontelemente`, 'Drucktasten-Vorsätze', 'Frontelemente » Taster', 2, ord++));
  nodes.push(cat(`${r5}.frontelemente.wahlschalter_frontelemente`, `${r5}.frontelemente`, 'Wahltasten-Vorsätze', 'Frontelemente » Wahlschalter', 2, ord++));
  nodes.push(cat(`${r5}.frontelemente.leuchtmelder_frontelemente`, `${r5}.frontelemente`, 'Leuchtmelder-Vorsätze', 'Frontelemente » Leuchtmelder', 2, ord++));

  nodes.push(cat(`${r5}.kontakte_leuchtbloecke`, r5, 'Kontaktblöcke & Signalisierung', 'Befehlsmelder » Bausteine', 1, ord++));
  nodes.push(cat(`${r5}.kontakte_leuchtbloecke.kontaktelemente`, `${r5}.kontakte_leuchtbloecke`, 'Schaltelemente / Hilfskontakte', 'Bausteine » Kontakte', 2, ord++));
  nodes.push(cat(`${r5}.kontakte_leuchtbloecke.led_leuchtelemente`, `${r5}.kontakte_leuchtbloecke`, 'LED-Leuchtelemente', 'Bausteine » LED', 2, ord++));
  nodes.push(cat(`${r5}.kontakte_leuchtbloecke.akustische_melder`, `${r5}.kontakte_leuchtbloecke`, 'Akustische Signalgeber / Summer', 'Bausteine » Akustik', 2, ord++));

  // 06. SPS, Steuerungstechnik & Sensorik
  const r6 = '06_sps_sensorik';
  nodes.push(cat(r6, null, 'SPS, Steuerungstechnik & Sensorik', 'SPS & Sensorik', 0, ord++));

  nodes.push(cat(`${r6}.sps_plc`, r6, 'Speicherprogrammierbare Steuerungen (SPS)', 'SPS & Steuerung', 1, ord++));
  nodes.push(cat(`${r6}.sps_plc.kompakt_sps_steuerrelais`, `${r6}.sps_plc`, 'Kompakt-SPS & Steuerrelais', 'SPS » Kompakt', 2, ord++));
  nodes.push(cat(`${r6}.sps_plc.digitale_eingaenge_di`, `${r6}.sps_plc`, 'Digitale Eingangsbaugruppen (DI)', 'SPS » DI', 2, ord++));
  nodes.push(cat(`${r6}.sps_plc.digitale_ausgaenge_do`, `${r6}.sps_plc`, 'Digitale Ausgangsbaugruppen (DO)', 'SPS » DO', 2, ord++));
  nodes.push(cat(`${r6}.sps_plc.analoge_ea_ai_ao`, `${r6}.sps_plc`, 'Analoge Baugruppen (AI / AO)', 'SPS » Analog AI/AO', 2, ord++));
  nodes.push(cat(`${r6}.sps_plc.kommunikation_feldbus`, `${r6}.sps_plc`, 'Kommunikations- & Feldbusmodule', 'SPS » Feldbus', 2, ord++));
  nodes.push(cat(`${r6}.sps_plc.basismodule_zubehoer`, `${r6}.sps_plc`, 'SPS-Basisträger & Schnittstellen', 'SPS » Basisträger', 2, ord++));

  nodes.push(cat(`${r6}.hmi`, r6, 'Bedienpanels & Touchpanels', 'HMI & Visualisierung', 1, ord++));
  nodes.push(cat(`${r6}.hmi.touchpanels_displays`, `${r6}.hmi`, 'HMI-Touchpanels & Textdisplays', 'HMI » Touchdisplays', 2, ord++));

  nodes.push(cat(`${r6}.sensoren_schalter`, r6, 'Sensoren & Endschalter', 'Sensorik', 1, ord++));
  nodes.push(cat(`${r6}.sensoren_schalter.induktive_sensoren`, `${r6}.sensoren_schalter`, 'Induktive Näherungsschalter', 'Sensoren » Induktiv', 2, ord++));
  nodes.push(cat(`${r6}.sensoren_schalter.optische_sensoren`, `${r6}.sensoren_schalter`, 'Optische Sensoren / Lichtschranken', 'Sensoren » Optisch', 2, ord++));
  nodes.push(cat(`${r6}.sensoren_schalter.kapazitive_sensoren`, `${r6}.sensoren_schalter`, 'Kapazitive Sensoren', 'Sensoren » Kapazitiv', 2, ord++));
  nodes.push(cat(`${r6}.sensoren_schalter.positionsschalter_endschalter`, `${r6}.sensoren_schalter`, 'Positionsschalter & Grenztaster', 'Sensoren » Positionsschalter', 2, ord++));
  nodes.push(cat(`${r6}.sensoren_schalter.druckwaechter`, `${r6}.sensoren_schalter`, 'Druckwächter & Drucksensoren', 'Sensoren » Druckwächter', 2, ord++));

  // 07. Klemmen, Stecker & Verkabelung
  const r7 = '07_klemmen_verbindung';
  nodes.push(cat(r7, null, 'Klemmen, Stecker & Verkabelung', 'Klemmen & Verbindung', 0, ord++));

  nodes.push(cat(`${r7}.reihenklemmen`, r7, 'Reihenklemmen', 'Klemmen » Reihenklemmen', 1, ord++));
  nodes.push(cat(`${r7}.reihenklemmen.durchgangsklemmen`, `${r7}.reihenklemmen`, 'Durchgangsklemmen', 'Reihenklemmen » Durchgang', 2, ord++));
  nodes.push(cat(`${r7}.reihenklemmen.schutzleiterklemmen_pe`, `${r7}.reihenklemmen`, 'Schutzleiterklemmen (PE)', 'Reihenklemmen » PE', 2, ord++));
  nodes.push(cat(`${r7}.reihenklemmen.neutralleiter_trennklemmen`, `${r7}.reihenklemmen`, 'Neutralleiter- & Trennklemmen', 'Reihenklemmen » Trennklemmen', 2, ord++));
  nodes.push(cat(`${r7}.reihenklemmen.sicherungsklemmen`, `${r7}.reihenklemmen`, 'Sicherungsklemmen', 'Reihenklemmen » Sicherungsklemmen', 2, ord++));
  nodes.push(cat(`${r7}.reihenklemmen.mehrstock_initiatorenklemmen`, `${r7}.reihenklemmen`, 'Mehrstock- & Initiatorenklemmen', 'Reihenklemmen » Mehrstock', 2, ord++));
  nodes.push(cat(`${r7}.reihenklemmen.potenzialverteiler`, `${r7}.reihenklemmen`, 'Potenzialverteilerklemmen', 'Reihenklemmen » Potenzialverteiler', 2, ord++));

  nodes.push(cat(`${r7}.steckverbinder_kabel`, r7, 'Steckverbinder & Leitungen', 'Klemmen » Stecker/Kabel', 1, ord++));
  nodes.push(cat(`${r7}.steckverbinder_kabel.industriesteckverbinder`, `${r7}.steckverbinder_kabel`, 'Industriesteckverbinder (Rund/Rechteck)', 'Stecker » Industriesteckverbinder', 2, ord++));
  nodes.push(cat(`${r7}.steckverbinder_kabel.sensor_aktor_leitungen`, `${r7}.steckverbinder_kabel`, 'Sensor-/Aktorleitungen (M8/M12)', 'Kabel » Sensor/Aktor', 2, ord++));
  nodes.push(cat(`${r7}.steckverbinder_kabel.feldbus_datenleitungen`, `${r7}.steckverbinder_kabel`, 'Feldbus- & Netzwerkleitungen', 'Kabel » Feldbus', 2, ord++));

  // 08. Schaltschraenke, Gehaeuse & Zubehoer
  const r8 = '08_gehaeuse_mechanik';
  nodes.push(cat(r8, null, 'Schaltschränke, Gehäuse & Zubehör', 'Gehäuse & Mechanik', 0, ord++));

  nodes.push(cat(`${r8}.schaltschraenke_gehaeuse`, r8, 'Schaltschränke & Gehäuse', 'Gehäuse » Schaltschränke', 1, ord++));
  nodes.push(cat(`${r8}.schaltschraenke_gehaeuse.wandschraenke`, `${r8}.schaltschraenke_gehaeuse`, 'Wandgehäuse / Kompaktschränke', 'Gehäuse » Wandschränke', 2, ord++));
  nodes.push(cat(`${r8}.schaltschraenke_gehaeuse.standschraenke`, `${r8}.schaltschraenke_gehaeuse`, 'Standschränke / Anreihsysteme', 'Gehäuse » Standschränke', 2, ord++));
  nodes.push(cat(`${r8}.schaltschraenke_gehaeuse.kleingehaeuse_verteiler`, `${r8}.schaltschraenke_gehaeuse`, 'Kleingehäuse & Kleinverteiler', 'Gehäuse » Kleingehäuse', 2, ord++));

  nodes.push(cat(`${r8}.zubehoer_mechanik`, r8, 'Mechanisches Zubehör', 'Gehäuse » Zubehör', 1, ord++));
  nodes.push(cat(`${r8}.zubehoer_mechanik.zubehoer_leistungsschalter`, `${r8}.zubehoer_mechanik`, 'Zubehör Leistungsschalter (NZM/Tmax)', 'Zubehör » Leistungsschalter', 2, ord++));
  nodes.push(cat(`${r8}.zubehoer_mechanik.zubehoer_schuetze_motorschutz`, `${r8}.zubehoer_mechanik`, 'Zubehör Schütze & Motorschutz', 'Zubehör » Schütze/Motorschutz', 2, ord++));
  nodes.push(cat(`${r8}.zubehoer_mechanik.zubehoer_befehlsgeraete`, `${r8}.zubehoer_mechanik`, 'Zubehör Befehlsgeräte (Schilder/Adapter)', 'Zubehör » Befehlsgeräte', 2, ord++));
  nodes.push(cat(`${r8}.zubehoer_mechanik.zubehoer_schaltschrank_montage`, `${r8}.zubehoer_mechanik`, 'Schaltschrank-Ausbau & Montagezubehör', 'Zubehör » Schaltschrankausbau', 2, ord++));
  nodes.push(cat(`${r8}.zubehoer_mechanik.zubehoer_allgemein`, `${r8}.zubehoer_mechanik`, 'Allgemeines Montagezubehör', 'Zubehör » Allgemein', 2, ord++));

  return nodes;
}
