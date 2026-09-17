import { readFileSync } from "node:fs";
import { join } from "node:path";

const LOGO_PATH = join(process.cwd(), "public/logo-italypizza-mark.png");

const getLogoDataUri = (): string => {
  const buffer = readFileSync(LOGO_PATH);
  return `data:image/png;base64,${buffer.toString("base64")}`;
};

/**
 * Overlays the brand mark on a QR SVG generated with errorCorrectionLevel
 * "H", the same way WhatsApp/most apps embed a logo without hurting
 * scannability (H tolerates ~30% of the code being covered).
 */
export const addLogoToQrSvg = (svgMarkup: string): string => {
  const match = svgMarkup.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!match) return svgMarkup;

  const size = Number(match[1]);
  const badge = size * 0.24;
  const radius = badge * 0.18;
  const pad = badge * 0.12;
  const inner = badge - pad * 2;
  const offset = (size - badge) / 2;

  const overlay =
    `<rect x="${offset}" y="${offset}" width="${badge}" height="${badge}" ` +
    `rx="${radius}" fill="#fffaf0"/>` +
    `<image x="${offset + pad}" y="${offset + pad}" width="${inner}" ` +
    `height="${inner}" href="${getLogoDataUri()}" ` +
    `preserveAspectRatio="xMidYMid meet"/>`;

  return svgMarkup.replace("</svg>", `${overlay}</svg>`);
};
