// Gera a marca e os ícones da PWA a partir do logotipo oficial 3SIGILOS
// (source/3sigilos-logo.png, branco sobre preto), recolorido a dourado.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = join(root, "source/3sigilos-logo.png");
const GOLD = { r: 231, g: 207, b: 146 }; // dourado claro da app (--gold-light)
const INK = "#0b0c14";

// 1. Isola o símbolo circular (sem o lettering): corta acima do wordmark
//    e apara as margens pretas.
const meta = await sharp(SRC).metadata();
const topHalf = await sharp(SRC)
  .extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * 0.72) })
  .toBuffer();
const markRegion = await sharp(topHalf).trim({ threshold: 25 }).toBuffer();

// 2. Recolore: a luminância do original passa a canal alfa sobre dourado puro.
const gray = sharp(markRegion).grayscale();
const { width, height } = await gray.clone().metadata();
const alpha = await gray.raw().toBuffer();
const px = Buffer.alloc(width * height * 4);
for (let i = 0; i < width * height; i++) {
  px[i * 4] = GOLD.r;
  px[i * 4 + 1] = GOLD.g;
  px[i * 4 + 2] = GOLD.b;
  px[i * 4 + 3] = alpha[i];
}
const markPng = await sharp(px, { raw: { width, height, channels: 4 } })
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
writeFileSync(join(root, "public/marca.png"), markPng);
console.log("OK marca.png (512, transparente)");

// 3. Ícones: símbolo dourado centrado sobre tinta-noite.
async function icon(file, size, scale) {
  const inner = Math.round(size * scale);
  const markBuf = await sharp(markPng)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const out = await sharp({
    create: { width: size, height: size, channels: 4, background: INK },
  })
    .composite([{ input: markBuf, gravity: "centre" }])
    .png()
    .toBuffer();
  writeFileSync(join(root, "public", file), out);
  console.log(`OK ${file} (${size}x${size})`);
}

await icon("icon-192.png", 192, 0.82);
await icon("icon-512.png", 512, 0.82);
await icon("icon-maskable-512.png", 512, 0.6);
await icon("apple-touch-icon.png", 180, 0.76);
await icon("favicon.png", 96, 0.88);
