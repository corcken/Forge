import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export interface BrandingOptions {
  /** Marken- oder App-Name fuer die Kopfzeile (z. B. "DESCRIPTIO"). */
  brandText?: string;
  /** Optionale Sekundaerzeile rechts im Header (z. B. Hersteller / Artikelnummer). */
  subText?: string;
  /** Hintergrundfarbe des oberen Markenbalkens (Standard: #0f172a). */
  headerBgColor?: string;
  /** Textfarbe im Markenbalken (Standard: #f8fafc). */
  headerTextColor?: string;
  /** Rahmenfarbe um das gesamte Bild (Standard: #cbd5e1). */
  borderColor?: string;
  /** Hoehe des oberen Markenbalkens in Pixeln (Standard: 44). */
  headerHeightPx?: number;
}

const TARGET_INNER_SIZE = 540;
const TARGET_MARGIN = 30;
const TOTAL_SIZE = TARGET_INNER_SIZE + TARGET_MARGIN * 2; // 600x600

/**
 * Bringt ein beliebiges Hersteller-Produktbild verlustarm auf das einheitliche
 * Quadrat-Format 600x600 px (540x540 Inhalt + 30px Reinweiss-Rand rundum, WebP Q84).
 */
export async function normalizeProductImage(
  input: Buffer | string,
  targetWebpPath: string,
): Promise<void> {
  fs.mkdirSync(path.dirname(targetWebpPath), { recursive: true });
  await sharp(input)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(TARGET_INNER_SIZE, TARGET_INNER_SIZE, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
      withoutEnlargement: false,
    })
    .extend({
      top: TARGET_MARGIN,
      bottom: TARGET_MARGIN,
      left: TARGET_MARGIN,
      right: TARGET_MARGIN,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .webp({ quality: 84 })
    .toFile(targetWebpPath);
}

/**
 * Erzeugt aus einem 600x600 normalisierten Bild eine gebrandete Variante
 * mit zusätzlichem oberen Logo-/Markenbalken (600 x (600 + headerHeightPx))
 * sowie einem umlaufenden technischen Rahmen.
 */
export async function stampBrandedImage(
  normWebpPath: string,
  brandedWebpPath: string,
  opts: BrandingOptions = {},
): Promise<void> {
  const headerH = opts.headerHeightPx ?? 44;
  const bg = opts.headerBgColor ?? '#0f172a';
  const fg = opts.headerTextColor ?? '#f8fafc';
  const border = opts.borderColor ?? '#cbd5e1';
  const brand = escapeXml(opts.brandText ?? 'DESCRIPTIO');
  const sub = escapeXml(opts.subText ?? '');
  const totalH = TOTAL_SIZE + headerH;

  const overlaySvg = Buffer.from(
    `<svg width="${TOTAL_SIZE}" height="${totalH}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${TOTAL_SIZE}" height="${headerH}" fill="${bg}"/>
      <text x="16" y="${Math.round(headerH * 0.64)}" font-family="monospace, sans-serif" font-size="16" font-weight="bold" letter-spacing="2" fill="${fg}">${brand}</text>
      ${sub ? `<text x="${TOTAL_SIZE - 16}" y="${Math.round(headerH * 0.62)}" text-anchor="end" font-family="monospace, sans-serif" font-size="12" fill="#94a3b8">${sub}</text>` : ''}
      <rect x="1" y="1" width="${TOTAL_SIZE - 2}" height="${totalH - 2}" fill="none" stroke="${border}" stroke-width="2"/>
    </svg>`,
  );

  fs.mkdirSync(path.dirname(brandedWebpPath), { recursive: true });
  await sharp(normWebpPath)
    .extend({
      top: headerH,
      bottom: 0,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .composite([{ input: overlaySvg, top: 0, left: 0 }])
    .webp({ quality: 86 })
    .toFile(brandedWebpPath);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;');
}
