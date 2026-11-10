import type { CatalogCategoryNode } from '@descriptio-forge/shared';
import { cat } from './category-builders.js';

export function buildPowerCategories(): CatalogCategoryNode[] {
  const nodes: CatalogCategoryNode[] = [];
  let ord = 100;

  // 01. Einspeisung, Hauptschalter & Energieverteilung
  const r1 = '01_einspeisung_hauptschalter';
  nodes.push(cat(r1, null, 'Einspeisung, Hauptschalter & Energieverteilung', 'Einspeisung & Hauptschalter', 0, ord++));
  nodes.push(cat(`${r1}.lasttrennschalter`, r1, 'Lasttrennschalter', 'Einspeisung » Lasttrennschalter', 1, ord++));
  nodes.push(cat(`${r1}.lasttrennschalter.3p_bis_63a`, `${r1}.lasttrennschalter`, '3-polig bis 63 A', 'Einspeisung » Lasttrennschalter » 3P bis 63 A', 2, ord++));
  nodes.push(cat(`${r1}.lasttrennschalter.3p_ab_80a`, `${r1}.lasttrennschalter`, '3-polig ab 80 A', 'Einspeisung » Lasttrennschalter » 3P ab 80 A', 2, ord++));
  nodes.push(cat(`${r1}.lasttrennschalter.4p_bis_63a`, `${r1}.lasttrennschalter`, '4-polig bis 63 A', 'Einspeisung » Lasttrennschalter » 4P bis 63 A', 2, ord++));
  nodes.push(cat(`${r1}.lasttrennschalter.4p_ab_80a`, `${r1}.lasttrennschalter`, '4-polig ab 80 A', 'Einspeisung » Lasttrennschalter » 4P ab 80 A', 2, ord++));
  nodes.push(cat(`${r1}.lasttrennschalter.sicherungslasttrenner`, `${r1}.lasttrennschalter`, 'Sicherungslasttrennschalter', 'Einspeisung » Sicherungslasttrennschalter', 2, ord++));

  nodes.push(cat(`${r1}.nockenschalter`, r1, 'Nockenschalter', 'Einspeisung » Nockenschalter', 1, ord++));
  nodes.push(cat(`${r1}.nockenschalter.haupt_not_aus`, `${r1}.nockenschalter`, 'Haupt-/Not-Aus-Schalter', 'Einspeisung » Nockenschalter » Not-Aus', 2, ord++));
  nodes.push(cat(`${r1}.nockenschalter.umschalter`, `${r1}.nockenschalter`, 'Umschalter & Stufenschalter', 'Einspeisung » Nockenschalter » Umschalter', 2, ord++));
  nodes.push(cat(`${r1}.nockenschalter.ein_aus`, `${r1}.nockenschalter`, 'Ein-/Ausschalter', 'Einspeisung » Nockenschalter » Ein/Aus', 2, ord++));

  nodes.push(cat(`${r1}.sammelschienen`, r1, 'Sammelschienen & Phasenschienen', 'Einspeisung » Schienensysteme', 1, ord++));
  nodes.push(cat(`${r1}.sammelschienen.phasenschienen_mcb`, `${r1}.sammelschienen`, 'Phasenschienen (MCB/RCD)', 'Einspeisung » Phasenschienen', 2, ord++));
  nodes.push(cat(`${r1}.sammelschienen.sammelschienen_systeme`, `${r1}.sammelschienen`, 'Sammelschienensysteme', 'Einspeisung » Sammelschienen', 2, ord++));
  nodes.push(cat(`${r1}.sammelschienen.einspeiseklemmen_adapter`, `${r1}.sammelschienen`, 'Einspeiseklemmen & Adapter', 'Einspeisung » Einspeiseklemmen', 2, ord++));

  // 02. Schutzgeraete & Sicherungen
  const r2 = '02_schutzgeraete';
  nodes.push(cat(r2, null, 'Schutzgeräte & Sicherungen', 'Schutzgeräte', 0, ord++));

  // MCB 1P bis 4P inkl. Stromstufen L3
  nodes.push(cat(`${r2}.mcb`, r2, 'Leitungsschutzschalter (MCB)', 'Schutzgeräte » MCB', 1, ord++));
  const mcbPoles = [
    { p: '1p', l: '1-polig (1P)' },
    { p: '1p_n', l: '1-polig + N (1P+N)' },
    { p: '2p', l: '2-polig (2P)' },
    { p: '3p', l: '3-polig (3P)' },
    { p: '3p_n', l: '3-polig + N (3P+N)' },
    { p: '4p', l: '4-polig (4P)' },
  ];
  const ampSteps = [
    { a: 'bis_6a', l: 'bis 6 A' },
    { a: '10_16a', l: '10 A – 16 A' },
    { a: '20_32a', l: '20 A – 32 A' },
    { a: 'ab_40a', l: 'ab 40 A' },
  ];
  for (const pole of mcbPoles) {
    const pSlug = `${r2}.mcb.${pole.p}`;
    nodes.push(cat(pSlug, `${r2}.mcb`, pole.l, `MCB » ${pole.l}`, 2, ord++));
    for (const step of ampSteps) {
      nodes.push(cat(`${pSlug}.${step.a}`, pSlug, step.l, `MCB » ${pole.l} » ${step.l}`, 3, ord++));
    }
  }

  // MCCB
  nodes.push(cat(`${r2}.mccb`, r2, 'Kompaktleistungsschalter (MCCB)', 'Schutzgeräte » MCCB', 1, ord++));
  nodes.push(cat(`${r2}.mccb.3p`, `${r2}.mccb`, '3-polig (3P)', 'MCCB » 3-polig', 2, ord++));
  nodes.push(cat(`${r2}.mccb.3p.bis_160a`, `${r2}.mccb.3p`, 'bis 160 A', 'MCCB » 3P » bis 160 A', 3, ord++));
  nodes.push(cat(`${r2}.mccb.3p.250a`, `${r2}.mccb.3p`, '200 A – 250 A', 'MCCB » 3P » 250 A', 3, ord++));
  nodes.push(cat(`${r2}.mccb.3p.400_630a`, `${r2}.mccb.3p`, '400 A – 630 A', 'MCCB » 3P » 400-630 A', 3, ord++));
  nodes.push(cat(`${r2}.mccb.3p.ab_800a`, `${r2}.mccb.3p`, 'ab 800 A', 'MCCB » 3P » ab 800 A', 3, ord++));
  nodes.push(cat(`${r2}.mccb.4p`, `${r2}.mccb`, '4-polig (4P)', 'MCCB » 4-polig', 2, ord++));
  nodes.push(cat(`${r2}.mccb.4p.bis_250a`, `${r2}.mccb.4p`, 'bis 250 A', 'MCCB » 4P » bis 250 A', 3, ord++));
  nodes.push(cat(`${r2}.mccb.4p.ab_400a`, `${r2}.mccb.4p`, 'ab 400 A', 'MCCB » 4P » ab 400 A', 3, ord++));

  // RCD & RCBO
  nodes.push(cat(`${r2}.rcd`, r2, 'FI-Schutzschalter (RCD)', 'Schutzgeräte » RCD', 1, ord++));
  nodes.push(cat(`${r2}.rcd.2p_bis_40a`, `${r2}.rcd`, '2-polig bis 40 A', 'RCD » 2P bis 40 A', 2, ord++));
  nodes.push(cat(`${r2}.rcd.2p_ab_63a`, `${r2}.rcd`, '2-polig ab 63 A', 'RCD » 2P ab 63 A', 2, ord++));
  nodes.push(cat(`${r2}.rcd.4p_bis_40a`, `${r2}.rcd`, '4-polig bis 40 A', 'RCD » 4P bis 40 A', 2, ord++));
  nodes.push(cat(`${r2}.rcd.4p_ab_63a`, `${r2}.rcd`, '4-polig ab 63 A', 'RCD » 4P ab 63 A', 2, ord++));

  nodes.push(cat(`${r2}.rcbo`, r2, 'FI/LS-Schalter (RCBO)', 'Schutzgeräte » RCBO', 1, ord++));
  nodes.push(cat(`${r2}.rcbo.1p_n_bis_16a`, `${r2}.rcbo`, '1P+N bis 16 A', 'RCBO » 1P+N bis 16 A', 2, ord++));
  nodes.push(cat(`${r2}.rcbo.1p_n_ab_20a`, `${r2}.rcbo`, '1P+N ab 20 A', 'RCBO » 1P+N ab 20 A', 2, ord++));
  nodes.push(cat(`${r2}.rcbo.2p`, `${r2}.rcbo`, '2-polig (2P)', 'RCBO » 2P', 2, ord++));
  nodes.push(cat(`${r2}.rcbo.3p_n`, `${r2}.rcbo`, '3-polig + N (3P+N)', 'RCBO » 3P+N', 2, ord++));
  nodes.push(cat(`${r2}.rcbo.4p`, `${r2}.rcbo`, '4-polig (4P)', 'RCBO » 4P', 2, ord++));

  // Motorschutz & Ueberlast
  nodes.push(cat(`${r2}.motorschutz`, r2, 'Motorschutz & Überlastrelais', 'Schutzgeräte » Motorschutz', 1, ord++));
  nodes.push(cat(`${r2}.motorschutz.mss_bis_4a`, `${r2}.motorschutz`, 'Motorschutzschalter bis 4 A', 'MSS » bis 4 A', 2, ord++));
  nodes.push(cat(`${r2}.motorschutz.mss_4_16a`, `${r2}.motorschutz`, 'Motorschutzschalter 4 A – 16 A', 'MSS » 4-16 A', 2, ord++));
  nodes.push(cat(`${r2}.motorschutz.mss_ab_16a`, `${r2}.motorschutz`, 'Motorschutzschalter ab 16 A', 'MSS » ab 16 A', 2, ord++));
  nodes.push(cat(`${r2}.motorschutz.ueberlastrelais_thermisch`, `${r2}.motorschutz`, 'Thermisches Überlastrelais', 'Überlast » Thermisch', 2, ord++));
  nodes.push(cat(`${r2}.motorschutz.ueberlastrelais_elektronisch`, `${r2}.motorschutz`, 'Elektronisches Überlastrelais', 'Überlast » Elektronisch', 2, ord++));

  // Ausloeser & Zubehoer Leistungsschalter
  nodes.push(cat(`${r2}.ausloeser_antriebe`, r2, 'Auslöser & Fernantriebe', 'Schutzgeräte » Auslöser', 1, ord++));
  nodes.push(cat(`${r2}.ausloeser_antriebe.arbeitsstromausloeser`, `${r2}.ausloeser_antriebe`, 'Arbeitsstromauslöser (Shunt)', 'Auslöser » Shunt', 2, ord++));
  nodes.push(cat(`${r2}.ausloeser_antriebe.unterspannungsausloeser`, `${r2}.ausloeser_antriebe`, 'Unterspannungsauslöser', 'Auslöser » Unterspannung', 2, ord++));
  nodes.push(cat(`${r2}.ausloeser_antriebe.motorantriebe`, `${r2}.ausloeser_antriebe`, 'Motorantriebe / Fernantriebe', 'Auslöser » Motorantrieb', 2, ord++));

  // Sicherungen, SPD, Elektronischer Schutz
  nodes.push(cat(`${r2}.sicherungen_spd`, r2, 'Sicherungen & Überspannungsschutz', 'Schutzgeräte » Sicherungen/SPD', 1, ord++));
  nodes.push(cat(`${r2}.sicherungen_spd.sicherungshalter`, `${r2}.sicherungen_spd`, 'Sicherungshalter & Sockel', 'Sicherungen » Halter', 2, ord++));
  nodes.push(cat(`${r2}.sicherungen_spd.schmelzeinsaetze`, `${r2}.sicherungen_spd`, 'Schmelzeinsätze (D0/NH/Zylinder)', 'Sicherungen » Einsätze', 2, ord++));
  nodes.push(cat(`${r2}.sicherungen_spd.ueberspannungsableiter_spd`, `${r2}.sicherungen_spd`, 'Überspannungsableiter (SPD)', 'Schutzgeräte » SPD', 2, ord++));
  nodes.push(cat(`${r2}.sicherungen_spd.elektronische_schutzschalter_24v`, `${r2}.sicherungen_spd`, 'Elektronische Schutzschalter 24V DC', 'Schutzgeräte » 24V DC Schutz', 2, ord++));

  // 03. Schaltgeraete & Antriebstechnik
  const r3 = '03_schaltgeraete_antriebe';
  nodes.push(cat(r3, null, 'Schütze, Relais & Antriebstechnik', 'Schütze & Antriebe', 0, ord++));

  nodes.push(cat(`${r3}.leistungsschuetze`, r3, 'Leistungsschütze', 'Schütze » Leistungsschütze', 1, ord++));
  nodes.push(cat(`${r3}.leistungsschuetze.kleinschuetze_bis_12a`, `${r3}.leistungsschuetze`, 'Kleinschütze / Minischütze (bis 12 A)', 'Schütze » Minischütze bis 12 A', 2, ord++));
  nodes.push(cat(`${r3}.leistungsschuetze.standard_9_38a`, `${r3}.leistungsschuetze`, 'Leistungsschütze (9 A – 38 A)', 'Schütze » 9 A bis 38 A', 2, ord++));
  nodes.push(cat(`${r3}.leistungsschuetze.mittel_40_95a`, `${r3}.leistungsschuetze`, 'Leistungsschütze (40 A – 95 A)', 'Schütze » 40 A bis 95 A', 2, ord++));
  nodes.push(cat(`${r3}.leistungsschuetze.gross_ab_115a`, `${r3}.leistungsschuetze`, 'Großschütze (ab 115 A)', 'Schütze » ab 115 A', 2, ord++));
  nodes.push(cat(`${r3}.leistungsschuetze.4p_schuetze`, `${r3}.leistungsschuetze`, '4-polige Schütze (Netzumschaltung)', 'Schütze » 4-polig', 2, ord++));
  nodes.push(cat(`${r3}.leistungsschuetze.installationsschuetze`, `${r3}.leistungsschuetze`, 'Installationsschütze (Reiheneinbau)', 'Schütze » Installationsschütze', 2, ord++));

  nodes.push(cat(`${r3}.hilfsschuetze_bloecke`, r3, 'Hilfsschütze & Zubehör', 'Schütze » Hilfsschütze', 1, ord++));
  nodes.push(cat(`${r3}.hilfsschuetze_bloecke.hilfsschuetze`, `${r3}.hilfsschuetze_bloecke`, 'Hilfsschütze / Steuerrelais', 'Schütze » Hilfsschütze', 2, ord++));
  nodes.push(cat(`${r3}.hilfsschuetze_bloecke.hilfsschalterbloecke`, `${r3}.hilfsschuetze_bloecke`, 'Hilfsschalterblöcke (Front/Seite)', 'Schütze » Hilfsschalterblöcke', 2, ord++));
  nodes.push(cat(`${r3}.hilfsschuetze_bloecke.schutzbeschaltung_varistor`, `${r3}.hilfsschuetze_bloecke`, 'Schutzbeschaltung / RC-Glieder', 'Schütze » RC-Glieder', 2, ord++));

  nodes.push(cat(`${r3}.relais`, r3, 'Koppel-, Zeit- & Überwachungsrelais', 'Relais', 1, ord++));
  nodes.push(cat(`${r3}.relais.koppelrelais`, `${r3}.relais`, 'Koppelrelais / Steckrelais', 'Relais » Koppelrelais', 2, ord++));
  nodes.push(cat(`${r3}.relais.zeitrelais`, `${r3}.relais`, 'Zeitrelais / Multifunktionsrelais', 'Relais » Zeitrelais', 2, ord++));
  nodes.push(cat(`${r3}.relais.ueberwachungsrelais`, `${r3}.relais`, 'Überwachungsrelais (Spannung/Phasen/Strom)', 'Relais » Überwachungsrelais', 2, ord++));
  nodes.push(cat(`${r3}.relais.sicherheitsrelais`, `${r3}.relais`, 'Sicherheitsrelais / Not-Halt-Schaltgeräte', 'Relais » Sicherheitsrelais', 2, ord++));

  nodes.push(cat(`${r3}.antriebstechnik`, r3, 'Umrichter & Sanftstarter', 'Antriebstechnik', 1, ord++));
  nodes.push(cat(`${r3}.antriebstechnik.frequenzumrichter_1ac`, `${r3}.antriebstechnik`, 'Frequenzumrichter 1AC (230 V)', 'Antriebe » FU 1AC', 2, ord++));
  nodes.push(cat(`${r3}.antriebstechnik.frequenzumrichter_3ac`, `${r3}.antriebstechnik`, 'Frequenzumrichter 3AC (400 V)', 'Antriebe » FU 3AC', 2, ord++));
  nodes.push(cat(`${r3}.antriebstechnik.sanftstarter`, `${r3}.antriebstechnik`, 'Sanftstarter', 'Antriebe » Sanftstarter', 2, ord++));
  nodes.push(cat(`${r3}.antriebstechnik.motormanagement_umc`, `${r3}.antriebstechnik`, 'Motormanagementsysteme (UMC)', 'Antriebe » UMC', 2, ord++));

  // 04. Stromversorgung & Transformatoren
  const r4 = '04_stromversorgung_trafos';
  nodes.push(cat(r4, null, 'Stromversorgung & Transformatoren', 'Stromversorgung & Trafos', 0, ord++));
  nodes.push(cat(`${r4}.schaltnetzteile`, r4, 'Schaltnetzteile & DC/DC', 'Netzteile', 1, ord++));
  nodes.push(cat(`${r4}.schaltnetzteile.24vdc_1ac`, `${r4}.schaltnetzteile`, 'Schaltnetzteile 24V DC (1-phasig)', 'Netzteile » 24V 1AC', 2, ord++));
  nodes.push(cat(`${r4}.schaltnetzteile.24vdc_3ac`, `${r4}.schaltnetzteile`, 'Schaltnetzteile 24V DC (3-phasig)', 'Netzteile » 24V 3AC', 2, ord++));
  nodes.push(cat(`${r4}.schaltnetzteile.12v_5v_48v_dc`, `${r4}.schaltnetzteile`, 'Netzteile sonstige Spannungen (12V/48V)', 'Netzteile » Sonstige', 2, ord++));
  nodes.push(cat(`${r4}.transformatoren`, r4, 'Transformatoren', 'Trafos', 1, ord++));
  nodes.push(cat(`${r4}.transformatoren.steuertrafos_1p`, `${r4}.transformatoren`, 'Steuertransformatoren (1-phasig)', 'Trafos » 1-phasig', 2, ord++));
  nodes.push(cat(`${r4}.transformatoren.drehstromtrafos_3p`, `${r4}.transformatoren`, 'Drehstromtransformatoren (3-phasig)', 'Trafos » 3-phasig', 2, ord++));

  return nodes;
}
