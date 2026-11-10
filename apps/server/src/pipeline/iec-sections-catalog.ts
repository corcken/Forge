export interface IecSection {
  code: string;
  part: string;
  name: string;
}

/**
 * 66 feingliedrige Unterkapitel der DIN EN 60617 (IEC 60617 Teil 02 bis Teil 11)
 * fuer die systematische KI-Abfrage aller genormten E-CAD-Schaltzeichen.
 */
export const IEC_SECTIONS: readonly IecSection[] = [
  // Teil 02: Symbolelemente, Kennzeichen
  { code: '02-01', part: 'Teil 02', name: 'Gegenstaende, Gehaeuse, Abschirmungen und Potentialausgleich' },
  { code: '02-02', part: 'Teil 02', name: 'Stromarten, Spannungsarten, Frequenz und Phasenlagen' },
  { code: '02-12', part: 'Teil 02', name: 'Mechanische Betaetigungselemente (Zug, Dreh, Druck, Raste, Kupplung)' },
  { code: '02-13', part: 'Teil 02', name: 'Antriebe durch Temperatur, Druck, Durchfluss, Niveau und Drehzahl' },
  { code: '02-15', part: 'Teil 02', name: 'Erdung, Masse, Schutzleiter (PE, PEN, Funktionserde, fremdarme Erde)' },

  // Teil 03: Leiter und Verbindungsbauteile
  { code: '03-01', part: 'Teil 03', name: 'Leiter, Sammelschienen, Kabel und Leitungsfuehrungen' },
  { code: '03-02', part: 'Teil 03', name: 'Klemmen, Durchgangsklemmen, Trennklemmen, Mehrstockklemmen, Loetstellen' },
  { code: '03-03', part: 'Teil 03', name: 'Steckverbinder, Stecker, Buchsen, Koaxial- und Mehrpolstecker' },
  { code: '03-04', part: 'Teil 03', name: 'Kabelmuffen, Kabelendverschluesse und Abzweiggarnituren' },

  // Teil 04: Passive Bauelemente
  { code: '04-01', part: 'Teil 04', name: 'Widerstaende, Potentiometer, Stellwiderstaende, Shunts, Heizwiderstaende' },
  { code: '04-02', part: 'Teil 04', name: 'Kondensatoren, Elektrolytkondensatoren, Leistungskondensatoren, Drehkondensatoren' },
  { code: '04-03', part: 'Teil 04', name: 'Induktivitaeten, Spulen, Drosseln mit Eisen-/Ferritkern, Kommutierungsdrosseln' },
  { code: '04-04', part: 'Teil 04', name: 'Verzoegerungsleitungen, Ferritperlen und Magnetverstaerker' },
  { code: '04-05', part: 'Teil 04', name: 'Piezoelektrische Kristalle, Quarze und Elektret-Elemente' },

  // Teil 05: Halbleiter
  { code: '05-01', part: 'Teil 05', name: 'Halbleiterdioden, Gleichrichterdioden, Z-Dioden, Tunnel- und Schottky-Dioden' },
  { code: '05-02', part: 'Teil 05', name: 'Thyristoren, Triacs, Diacs, GTO-Thyristoren und gesteuerte Gleichrichter' },
  { code: '05-03', part: 'Teil 05', name: 'Bipolartransistoren (NPN, PNP), Lawinentransistoren und Unijunction-Transistoren' },
  { code: '05-04', part: 'Teil 05', name: 'Feldeffekttransistoren (JFET, MOSFET N-Kanal/P-Kanal, IGBT)' },
  { code: '05-05', part: 'Teil 05', name: 'Optoelektronische Halbleiter: LED, Fotodiode, Fototransistor, Optokoppler, Solarzelle' },
  { code: '05-06', part: 'Teil 05', name: 'Hall-Generatoren, Magnetfeldhalbleiter und Strahlungsdetektoren' },

  // Teil 06: Erzeugung und Umwandlung elektrischer Energie
  { code: '06-01', part: 'Teil 06', name: 'Wicklungen, Stern-, Dreieck-, Zickzack- und offene Mehrphasenschaltungen' },
  { code: '06-04', part: 'Teil 06', name: 'Gleichstrommotoren, Gleichstromgeneratoren, Reihenschluss- und Nebenschlussmaschinen' },
  { code: '06-05', part: 'Teil 06', name: 'Wechselstrom-Kommutatormotoren und Universalmotoren' },
  { code: '06-06', part: 'Teil 06', name: 'Synchronmotoren, Synchrongeneratoren und Permanentmagnet-Synchronmaschinen' },
  { code: '06-07', part: 'Teil 06', name: 'Asynchronmotoren (Drehstrom-Kurzschlusslaeufer, Schleifringlaeufer, 1-Phasen-Kondensatormotor)' },
  { code: '06-08', part: 'Teil 06', name: 'Servomotoren, Schrittmotoren, Linearmotoren und Tachogeneratoren' },
  { code: '06-09', part: 'Teil 06', name: 'Einphasen- und Dreiphasentransformatoren, Spartransformatoren, Regeltransformatoren' },
  { code: '06-10', part: 'Teil 06', name: 'Stromwandler, Spannungswandler, Summenstromwandler und Messwandler' },
  { code: '06-14', part: 'Teil 06', name: 'Leistungsstromrichter: Gleichrichter (AC/DC), Wechselrichter (DC/AC), DC/DC-Wandler, Frequenzumrichter' },
  { code: '06-15', part: 'Teil 06', name: 'Primaerzellen, Akkumulatoren, Batterien und USV-Batteriebloecke' },

  // Teil 07: Schaltgeraete, Steuer- und Schutzeinrichtungen
  { code: '07-01', part: 'Teil 07', name: 'Schaltfunktionen allgemein, Zwangslaeufigkeit, Schaltstueck-Kennzeichen' },
  { code: '07-02', part: 'Teil 07', name: 'Schliesser, Oeffner, Wechsler, unterbrechungsloser Wechsler, Doppelunterbrechung' },
  { code: '07-03', part: 'Teil 07', name: 'Fruehschliesser, Spaetoeffner, Wischkontakte und Impulskontakte' },
  { code: '07-04', part: 'Teil 07', name: 'Kontakte mit selbsttaetiger Rueckstellung oder Verriegelung / Rastung' },
  { code: '07-05', part: 'Teil 07', name: 'Zeitverzoegerte Kontakte (anzugverzoegert, rueckfallverzoegert, beidseitig verzoegert)' },
  { code: '07-07', part: 'Teil 07', name: 'Handbetaetigte Steuerschalter: Drucktaster, Zugtaster, Drehtaster, Kippschalter, Schluesselschalter' },
  { code: '07-08', part: 'Teil 07', name: 'Positionsschalter und Grenztaster (Schliesser, Oeffner, Zwangs-Oeffner, Rollenhebel)' },
  { code: '07-09', part: 'Teil 07', name: 'Temperaturabhaengige Schalter, Thermostate und Bimetall-Kontakte' },
  { code: '07-10', part: 'Teil 07', name: 'Druckwaechter, Differenzdruckschalter, Vakuumschalter, Fuellstands- und Stroemungswaechter' },
  { code: '07-11', part: 'Teil 07', name: 'Drehzahlwaechter, Fliehkraftschalter, Vibrationsschalter und Schrittschaltwerke' },
  { code: '07-12', part: 'Teil 07', name: 'Mehrstellungsschalter, Nockenschalter, Stufenschalter, Not-Halt- und Pilzdrucktaster' },
  { code: '07-13', part: 'Teil 07', name: 'Leistungsschalter, Lasttrennschalter, Trenner, Erdungsschalter, Motorschutzschalter, FI/RCD, RCBO' },
  { code: '07-14', part: 'Teil 07', name: 'Schuetze, Hilfsschuetze, Halbleiterschuetze (SSR), Direktstarter, Wendestarter, Stern-Dreieck-Starter' },
  { code: '07-15', part: 'Teil 07', name: 'Relaisspulen: Standard, verzögert, Remanenz, polarisiert, AC, DC, Magnetventil, Bremsluefter' },
  { code: '07-16', part: 'Teil 07', name: 'Schutzrelais & Messrelais: Ueberstrom (I>), Kurzschluss (I>>), Unterspannung (U<), Erdschluss, Schieflast' },
  { code: '07-17', part: 'Teil 07', name: 'Netzueberwachungsrelais: Frequenz, Phasenfolge, Phasenausfall, Isolationswaechter (R<), Thermistorrelais' },
  { code: '07-19', part: 'Teil 07', name: 'Naeherungsschalter: induktiv, kapazitiv, optisch (Lichtschranke/Lichttaster), Ultraschall, Magnet/Reed' },
  { code: '07-21', part: 'Teil 07', name: 'Schmelzsicherungen, Sicherungen mit Schlagbolzen/Meldekontakt, Sicherungstrenner, NH-Lastschaltleisten' },
  { code: '07-22', part: 'Teil 07', name: 'Funkenstrecken, Gasableiter, Überspannungsableiter (SPD Typ 1/2/3), Varistor-Ableiter' },
  { code: '07-23', part: 'Teil 07', name: 'Statische Schalter, Halbleiter-Leistungsschalter und elektronische Sicherungsautomaten' },

  // Teil 08: Mess-, Anzeige- und Signaleinrichtungen
  { code: '08-01', part: 'Teil 08', name: 'Anzeigende Messgeraete: Amperemeter, Voltmeter, Wattmeter, Varmeter, Phasenmesser (cos phi)' },
  { code: '08-02', part: 'Teil 08', name: 'Frequenzmesser (Hz), Ohmmeter, Isolationsmesser, Temperaturanzeiger, Drehzahlmesser, Synchronoskop' },
  { code: '08-03', part: 'Teil 08', name: 'Schreibende Messgeraete, Linienschreiber und Oszilloskope' },
  { code: '08-04', part: 'Teil 08', name: 'Zaehlende Messgeraete: Wirkstromzaehler (kWh), Blindstromzaehler (kvarh), Zweitarifzaehler, Betriebsstundenzaehler' },
  { code: '08-06', part: 'Teil 08', name: 'Messfuehler: Thermoelemente, Widerstandsthermometer (Pt100, Pt1000, NTC, PTC), Druckmessumformer' },
  { code: '08-08', part: 'Teil 08', name: 'Drehgeber (Inkrementalgeber, Absolutwertgeber), Resolver und Wegmesssysteme' },
  { code: '08-10', part: 'Teil 08', name: 'Optische und akustische Signalmelder: Meldeleuchte, Blinkleuchte, Hupe, Sirene, Klingel, Summer, Leuchtsaeule' },

  // Teil 09 & 10 & 11: Telekommunikation, SPS, Gebaeudeinstallation
  { code: '09-01', part: 'Teil 09', name: 'Filter, Entstoerfilter, EMV-Netzfilter, Trennverstaerker und Messumformer' },
  { code: '10-01', part: 'Teil 10', name: 'SPS / PLC Baugruppen: CPU, Digitaleingang (DI), Digitalausgang (DO), Analogeingang (AI), Analogausgang (AO)' },
  { code: '10-02', part: 'Teil 10', name: 'Feldbus-Koppler, Ethernet-Switches, Gateways, Sicherheits-SPS (F-DI, F-DO)' },
  { code: '11-11', part: 'Teil 11', name: 'Gebaeudeinstallation: Unterverteilung, Einspeisekasten, Hausanschlusskasten, Zaehlerschrank' },
  { code: '11-13', part: 'Teil 11', name: 'Steckdosen (Schuko, CEE 16A/32A/63A, abschaltbar, mit FI, Datensteckdose RJ45)' },
  { code: '11-14', part: 'Teil 11', name: 'Installationsschalter (Ausschalter, Wechselschalter, Kreuzschalter, Serienschalter, Dimmer, Bewegungsmelder)' },
  { code: '11-15', part: 'Teil 11', name: 'Leuchten, Notbeleuchtung, Einzelbatterieleuchten, Scheinwerfer und Vorschaltgeraete (EVG)' },
  { code: '11-16', part: 'Teil 11', name: 'Warmwasserbereiter, Lüfter, Ventilatoren, Klimageraete, Rolladen-/Jalousieantriebe, Türöffner' },
];
