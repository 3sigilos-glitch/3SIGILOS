// Gera os ícones PNG da PWA a partir do sigilo SVG.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const svg = readFileSync(join(root, "public/sigilo.svg"), "utf8");

// O ícone maskable precisa de margem extra (zona segura de 40% do raio).
function padded(svgStr, pad) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#0b0c14"/>
    <svg x="${pad}" y="${pad}" width="${64 - 2 * pad}" height="${64 - 2 * pad}" viewBox="0 0 64 64">${svgStr
      .replace(/^[\s\S]*?<svg[^>]*>/, "")
      .replace("</svg>", "")}</svg>
  </svg>`;
}

const jobs = [
  { file: "icon-192.png", size: 192, pad: 4 },
  { file: "icon-512.png", size: 512, pad: 4 },
  { file: "icon-maskable-512.png", size: 512, pad: 11 },
  { file: "apple-touch-icon.png", size: 180, pad: 7 },
];

for (const { file, size, pad } of jobs) {
  const png = await sharp(Buffer.from(padded(svg, pad)), { density: 300 })
    .resize(size, size)
    .png()
    .toBuffer();
  writeFileSync(join(root, "public", file), png);
  console.log(`OK ${file} (${size}x${size})`);
}
