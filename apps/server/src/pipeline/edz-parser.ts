export interface ParsedEdzPart {
  manufacturer: string;
  articleNr: string;
  typeNr: string | null;
  seriesName: string | null;
  codeLetter: string | null;
  descrDe: string | null;
  descrEn: string | null;
  noteDe: string | null;
  noteEn: string | null;
  widthMm: number | null;
  heightMm: number | null;
  depthMm: number | null;
  weightG: number | null;
  voltage: string | null;
  voltageType: string | null;
  current: string | null;
  powerLoss: string | null;
  crossSection: string | null;
  characteristics: string | null;
  eclass: string | null;
  pinDesignations: string[];
  externalUrl: string | null;
  markdown: string;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&#10;/gu, '\n')
    .replace(/&#13;/gu, '')
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&')
    .trim();
}

function getAttr(tag: string, attrName: string): string | null {
  const re = new RegExp(`\\b${attrName}="([^"]*)"`, 'u');
  const m = re.exec(tag);
  return m?.[1] ? decodeXmlEntities(m[1]) : null;
}

/** Extrahiert aus EPLAN-Mehrsprachentexten (`de_DE@...;en_US@...;`) die gewuenschte Sprache. */
function parseMultilang(raw: string | null): { de: string | null; en: string | null; any: string | null } {
  if (!raw) return { de: null, en: null, any: null };
  let de: string | null = null;
  let en: string | null = null;
  let fallback: string | null = null;

  for (const segment of raw.split(';')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const atIdx = trimmed.indexOf('@');
    if (atIdx > 0 && atIdx <= 6) {
      const lang = trimmed.slice(0, atIdx);
      const val = trimmed.slice(atIdx + 1).trim();
      if (!val) continue;
      if (lang === 'de_DE') de = val;
      else if (lang === 'en_US') en = val;
      if (!fallback) fallback = val;
    } else if (!fallback) {
      fallback = trimmed;
    }
  }
  return { de: de ?? en ?? fallback, en: en ?? de ?? fallback, any: de ?? en ?? fallback };
}

function parsePositiveNumber(raw: string | null): number | null {
  if (!raw) return null;
  const num = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(num) && num > 0 ? num : null;
}

/** Parst den XML-Inhalt einer EPLAN `.part.xml`-Datei in strukturierte Artikel + Markdown. */
export function parseEdzPartXml(xml: string, sourceFileName: string): ParsedEdzPart[] {
  const results: ParsedEdzPart[] = [];
  const weightUnitMatch = /\bweight-unit="([^"]+)"/iu.exec(xml);
  const weightInKg = !weightUnitMatch || weightUnitMatch[1]?.toLowerCase() === 'kg';

  const partRegex = /<part\b([^>]*)>([\s\S]*?)<\/part>/gu;
  let match: RegExpExecArray | null;
  while ((match = partRegex.exec(xml)) !== null) {
    const openTag = match[1] ?? '';
    const body = match[2] ?? '';

    const rawOrderNr = getAttr(openTag, 'P_ARTICLE_ORDERNR');
    const rawPartNr = getAttr(openTag, 'P_ARTICLE_PARTNR');
    const articleNr = (rawOrderNr || rawPartNr || '')
      .replace(/^(?:ABB|JOK|STRIEBEL|THOMAS_BETTS)\./iu, '')
      .trim();
    if (!articleNr) continue;

    const typeNr = getAttr(openTag, 'P_ARTICLE_TYPENR');
    const codeLetter = getAttr(openTag, 'P_ARTICLE_CODELETTER');
    const descr1 = parseMultilang(getAttr(openTag, 'P_ARTICLE_DESCR1'));
    const descr2 = parseMultilang(getAttr(openTag, 'P_ARTICLE_DESCR2'));
    const descr3 = parseMultilang(getAttr(openTag, 'P_ARTICLE_DESCR3'));
    const note = parseMultilang(getAttr(openTag, 'P_ARTICLE_NOTE'));

    const widthMm = parsePositiveNumber(getAttr(openTag, 'P_ARTICLE_WIDTH'));
    const heightMm = parsePositiveNumber(getAttr(openTag, 'P_ARTICLE_HEIGHT'));
    const depthMm = parsePositiveNumber(getAttr(openTag, 'P_ARTICLE_DEPTH'));
    const rawWeight = parsePositiveNumber(getAttr(openTag, 'P_ARTICLE_WEIGHT'));
    const weightG =
      rawWeight !== null ? Math.round((weightInKg ? rawWeight * 1000 : rawWeight) * 100) / 100 : null;

    const extDoc1 = getAttr(openTag, 'P_ARTICLE_EXTERNAL_DOCUMENT_1');
    const urlMatch = extDoc1 ? /(https?:\/\/[^\s;]+)/iu.exec(extDoc1) : null;
    const externalUrl = urlMatch?.[1] ?? null;

    const freeProps: string[] = [];
    let seriesName: string | null = null;
    let eclass: string | null = null;
    const freeRegex = /<freeproperty\b([^>]*)\/>/gu;
    let fm: RegExpExecArray | null;
    while ((fm = freeRegex.exec(body)) !== null) {
      const fTag = fm[1] ?? '';
      const pos = getAttr(fTag, 'pos');
      const desc = parseMultilang(getAttr(fTag, 'P_ARTICLE_FREE_DATA_DESCRIPTION')).any;
      const val = parseMultilang(getAttr(fTag, 'P_ARTICLE_FREE_DATA_VALUE')).any;
      if (!val) continue;
      if (pos === '84' || pos === '83') seriesName = val;
      if (pos === '80' || pos === '81' || pos === '82' || pos === '83' || pos === '84') {
        freeProps.push(val);
      } else if (desc?.toLowerCase().includes('ecl') || pos === '90') {
        eclass = val;
      }
    }

    const variantMatch = /<variant\b([^>]*)>/u.exec(body);
    const vTag = variantMatch?.[1] ?? '';
    const voltage = parseMultilang(getAttr(vTag, 'P_ARTICLE_VOLTAGE')).any;
    const voltageType = parseMultilang(getAttr(vTag, 'P_ARTICLE_VOLTAGETYPE')).any;
    const current = parseMultilang(getAttr(vTag, 'P_ARTICLE_ELECTRICALCURRENT')).any;
    const powerLoss = parseMultilang(getAttr(vTag, 'P_ARTICLE_POWERDISSIPATION')).any;
    const crossSection = parseMultilang(getAttr(vTag, 'P_ARTICLE_CONNECTIONCROSSSECTION')).any;
    const characteristics = parseMultilang(getAttr(vTag, 'P_ARTICLE_CHARACTERISTICS')).any;

    const pinDesignations: string[] = [];
    const fnRegex = /<functiontemplate\b([^>]*)\/>/gu;
    let fnm: RegExpExecArray | null;
    while ((fnm = fnRegex.exec(body)) !== null) {
      const fTag = fnm[1] ?? '';
      const conn = getAttr(fTag, 'connectionDesignation');
      if (conn) {
        const pins = conn
          .split(/\r?\n/u)
          .map((p) => p.trim())
          .filter(Boolean);
        if (pins.length > 0) pinDesignations.push(pins.join(' - '));
      }
    }

    const descrDe = [descr1.de, descr2.de, descr3.de].filter(Boolean).join(' | ') || null;
    const descrEn = [descr1.en, descr2.en, descr3.en].filter(Boolean).join(' | ') || null;

    const lines: string[] = [
      `# ABB ${typeNr ?? articleNr} (${articleNr})`,
      `Hersteller: ABB`,
      `Artikelnummer / Bestellnummer: ${articleNr}`,
      ...(typeNr ? [`Typbezeichnung (Name): ${typeNr}`] : []),
      ...(seriesName ? [`Baureihe / Serie: ${seriesName}`] : []),
      ...(freeProps.length > 0 ? [`Produktfamilie: ${freeProps.join(' > ')}`] : []),
      ...(eclass ? [`eCl@ss: ${eclass}`] : []),
      ...(codeLetter ? [`BMK-Kennbuchstabe (IEC): ${codeLetter}`] : []),
      ...(descrDe ? [`Bezeichnung (DE): ${descrDe}`] : []),
      ...(descrEn && descrEn !== descrDe ? [`Description (EN): ${descrEn}`] : []),
      ...(note.de ? [`\n## Technische Beschreibung (DE)\n${note.de}`] : []),
      ...(note.en && note.en !== note.de ? [`\n## Technical Description (EN)\n${note.en}`] : []),
      `\n## Technische Daten & Abmessungen (EPLAN EDZ)`,
      ...(widthMm !== null ? [`Breite: ${widthMm} mm`] : []),
      ...(heightMm !== null ? [`Höhe: ${heightMm} mm`] : []),
      ...(depthMm !== null ? [`Tiefe / Baulänge: ${depthMm} mm`] : []),
      ...(weightG !== null ? [`Gewicht: ${weightG} g`] : []),
      ...(current ? [`Bemessungsstrom (In / Ie): ${current}`] : []),
      ...(voltage ? [`Bemessungsspannung (Ue / Us): ${voltage}`] : []),
      ...(voltageType ? [`Spannungsart: ${voltageType}`] : []),
      ...(powerLoss ? [`Verlustleistung (Pv): ${powerLoss}`] : []),
      ...(crossSection ? [`Anschlussquerschnitt: ${crossSection}`] : []),
      ...(characteristics ? [`Auslösecharakteristik / Kennlinie: ${characteristics}`] : []),
      ...(pinDesignations.length > 0
        ? [`\n## EPLAN Anschlüsse / Pin-Belegung (${pinDesignations.length} Funktionen)\n${pinDesignations.map((p, idx) => `- Funktion ${idx + 1}: ${p}`).join('\n')}`]
        : []),
      `\nQuelle: EPLAN EDZ (${sourceFileName})`,
    ];

    results.push({
      manufacturer: 'ABB',
      articleNr,
      typeNr,
      seriesName,
      codeLetter,
      descrDe,
      descrEn,
      noteDe: note.de,
      noteEn: note.en,
      widthMm,
      heightMm,
      depthMm,
      weightG,
      voltage,
      voltageType,
      current,
      powerLoss,
      crossSection,
      characteristics,
      eclass,
      pinDesignations,
      externalUrl,
      markdown: lines.join('\n'),
    });
  }
  return results;
}
