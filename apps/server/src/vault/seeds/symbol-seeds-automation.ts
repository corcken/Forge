import type { SymbolDefinition } from '@descriptio-forge/shared';
import { buildSymbol, svgWrap16, twoPinsVertical } from './symbol-svg-builders.js';
import { composeIecPrimitiveSvg } from './symbol-svg-composer.js';

export const AUTOMATION_AND_TERMINAL_SYMBOLS: readonly SymbolDefinition[] = [
  buildSymbol({
    id: 'SYM_VFD_POWER',
    name: 'Frequenzumrichter (AC/AC Leistungsteil)',
    iec60617Ref: 'S00740 | 06-14-01 | Teil 06',
    bmkPrefix: 'T',
    pins: twoPinsVertical('L1', 'U'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="13" x2="13" y2="3"/><text x="5.2" y="7" font-size="3.2" fill="currentColor">~</text><text x="9.5" y="11.5" font-size="3.2" fill="currentColor">~</text>',
    ),
  }),
  buildSymbol({
    id: 'SYM_SOFTSTARTER_POLE',
    name: 'Sanftstarter / Thyristor-Steller-Pol',
    iec60617Ref: 'S00742 | 06-14-02 | Teil 06',
    bmkPrefix: 'Q',
    pins: twoPinsVertical('1', '2'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><path d="M5.5 6h5L8 9.8z"/><line x1="5.5" y1="9.8" x2="10.5" y2="9.8"/><path d="M9.2 9.8l1.6 1.6"/>',
    ),
  }),
  buildSymbol({
    id: 'SYM_SSR_POLE',
    name: 'Halbleiterschütz-Pol (SSR)',
    iec60617Ref: 'S00299 | 07-14-05 | Teil 07',
    bmkPrefix: 'K',
    pins: twoPinsVertical('1', '2'),
    svgContent: composeIecPrimitiveSvg('CONTACT_NO', 'SEMICONDUCTOR', 'K', 2),
  }),
  buildSymbol({
    id: 'SYM_PLC_IO_CHANNEL',
    name: 'SPS / PLC E/A-Kanal (allgemein)',
    iec60617Ref: 'S01105 | 10-01-01 | Teil 10',
    bmkPrefix: 'K',
    pins: twoPinsVertical('I0', 'M'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="6" x2="13" y2="6"/><text x="8" y="11" font-size="3.2" text-anchor="middle" fill="currentColor">I/O</text>',
    ),
  }),
  buildSymbol({
    id: 'SYM_PLC_DI',
    name: 'SPS Digitaleingang (DI)',
    iec60617Ref: 'S01106 | 10-01-02 | Teil 10',
    bmkPrefix: 'K',
    pins: twoPinsVertical('DI', 'M'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><path d="M8 4.5v4m-1.5-1.5L8 8.5l1.5-1.5"/><text x="8" y="12" font-size="3" text-anchor="middle" fill="currentColor">DI</text>',
    ),
  }),
  buildSymbol({
    id: 'SYM_PLC_DO',
    name: 'SPS Digitalausgang (DO)',
    iec60617Ref: 'S01107 | 10-01-03 | Teil 10',
    bmkPrefix: 'K',
    pins: twoPinsVertical('DO', 'M'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><path d="M8 8v3.5m-1.5-1.5L8 11.5l1.5-1.5"/><text x="8" y="6.8" font-size="3" text-anchor="middle" fill="currentColor">DO</text>',
    ),
  }),
  buildSymbol({
    id: 'SYM_PLC_AI',
    name: 'SPS Analogeingang (AI)',
    iec60617Ref: 'S01108 | 10-01-04 | Teil 10',
    bmkPrefix: 'K',
    pins: twoPinsVertical('AI+', 'AI-'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="13" x2="13" y2="3"/><text x="5.5" y="7" font-size="2.8" fill="currentColor">A</text><text x="9.5" y="11.5" font-size="2.8" fill="currentColor">D</text>',
    ),
  }),
  buildSymbol({
    id: 'SYM_PLC_AO',
    name: 'SPS Analogausgang (AO)',
    iec60617Ref: 'S01109 | 10-01-05 | Teil 10',
    bmkPrefix: 'K',
    pins: twoPinsVertical('AO+', 'AO-'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="13" x2="13" y2="3"/><text x="5.5" y="7" font-size="2.8" fill="currentColor">D</text><text x="9.5" y="11.5" font-size="2.8" fill="currentColor">A</text>',
    ),
  }),
  buildSymbol({
    id: 'SYM_PSU_INPUT',
    name: 'Netzgerät Primäreingang (AC)',
    iec60617Ref: 'S00744 | 06-14-03 | Teil 06',
    bmkPrefix: 'G',
    pins: twoPinsVertical('L', 'N'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="3" y1="13" x2="13" y2="3"/><text x="5.2" y="7" font-size="3" fill="currentColor">~</text><text x="9.5" y="11.5" font-size="3" fill="currentColor">=</text>',
    ),
  }),
  buildSymbol({
    id: 'SYM_UPS_BLOCK',
    name: 'USV-Modul / Pufferung (DC)',
    iec60617Ref: 'S00748 | 06-14-06 | Teil 06',
    bmkPrefix: 'G',
    pins: twoPinsVertical('DC+', 'DC-'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="3"/><line x1="8" y1="13" x2="8" y2="16"/><rect x="3" y="3" width="10" height="10"/><line x1="5" y1="7" x2="11" y2="7"/><line x1="6.5" y1="9.5" x2="9.5" y2="9.5"/>',
    ),
  }),
  buildSymbol({
    id: 'SYM_BUSBAR_PASS',
    name: 'Sammelschienen-Anschluss / Einspeisung',
    iec60617Ref: 'S00045 | 03-01-05 | Teil 03',
    bmkPrefix: 'W',
    pins: twoPinsVertical('L1', '1'),
    svgContent: svgWrap16(
      '<line x1="2" y1="4" x2="14" y2="4" stroke-width="2.2"/><line x1="8" y1="0" x2="8" y2="16"/><circle cx="8" cy="4" r="1.5" fill="currentColor"/>',
    ),
  }),
  buildSymbol({
    id: 'SYM_DIODE_TERMINAL',
    name: 'Diodenklemme / Sperrdioden-Durchgang',
    iec60617Ref: 'S00065 | 03-02-07 | Teil 03',
    bmkPrefix: 'X',
    pins: twoPinsVertical('1', '2'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="16"/><path d="M5.5 6.5h5L8 10z" fill="currentColor"/><line x1="5.5" y1="10" x2="10.5" y2="10"/>',
    ),
  }),
  buildSymbol({
    id: 'SYM_FUSE_TERMINAL',
    name: 'Sicherungsklemme',
    iec60617Ref: 'S00066 | 03-02-08 | Teil 03',
    bmkPrefix: 'X',
    pins: twoPinsVertical('1', '2'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="16"/><rect x="5.5" y="4.5" width="5" height="7"/><circle cx="8" cy="2.5" r="1.2"/><circle cx="8" cy="13.5" r="1.2"/>',
    ),
  }),
  buildSymbol({
    id: 'SYM_N_DISCONNECT_TERMINAL',
    name: 'N-Trennklemme (Neutralleiter)',
    iec60617Ref: 'S00067 | 03-02-09 | Teil 03',
    bmkPrefix: 'X',
    pins: twoPinsVertical('N1', 'N2'),
    svgContent: svgWrap16(
      '<line x1="8" y1="0" x2="8" y2="5"/><line x1="8" y1="11" x2="8" y2="16"/><rect x="6.5" y="5" width="3" height="6"/><text x="3" y="9.5" font-size="3.2" fill="currentColor">N</text>',
    ),
  }),
];
