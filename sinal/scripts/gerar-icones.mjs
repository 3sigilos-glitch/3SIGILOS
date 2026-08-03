// Gera os icones da PWA, com o motivo da mare: duas ondas que sobem e
// descem, como a bateria social e sensorial.
// Correr com: npm run icones
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const destino = join(raiz, "public", "icons");

// Caminho de uma onda sinusoidal amostrada, entre inset e lado-inset.
function onda(lado, cy, amp, comprimento, fase, inset) {
  const passos = 80;
  let d = "";
  for (let i = 0; i <= passos; i++) {
    const x = inset + ((lado - 2 * inset) * i) / passos;
    const y = cy + amp * Math.sin((2 * Math.PI * x) / comprimento + fase);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d.trim();
}

// zonaSegura: fraccao do lado usada pelo desenho. Menor em maskable,
// para o Android poder recortar sem cortar as ondas.
function svg(lado, zonaSegura) {
  const cy = lado / 2;
  const inset = (lado * (1 - zonaSegura)) / 2;
  const util = lado * zonaSegura;
  const amp = util * 0.11;
  const comprimento = util * 0.62;
  const traco = Math.max(2, lado * 0.032);
  const cySocial = cy - amp * 0.55;
  const cySensorial = cy + amp * 0.9;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" fill="#12161A"/>
  <line x1="${inset}" y1="${cy}" x2="${lado - inset}" y2="${cy}" stroke="#2A323B" stroke-width="${traco * 0.5}" stroke-linecap="round"/>
  <path d="${onda(lado, cySensorial, amp, comprimento, Math.PI * 0.65, inset)}"
        fill="none" stroke="#A87C9B" stroke-width="${traco}" stroke-linecap="round" opacity="0.85"/>
  <path d="${onda(lado, cySocial, amp, comprimento, 0, inset)}"
        fill="none" stroke="#7FA37A" stroke-width="${traco}" stroke-linecap="round"/>
</svg>`;
}

async function gerar() {
  await mkdir(destino, { recursive: true });
  const trabalhos = [
    ["icone-192.png", 192, 0.82],
    ["icone-512.png", 512, 0.82],
    ["icone-maskable-192.png", 192, 0.64],
    ["icone-maskable-512.png", 512, 0.64],
  ];
  for (const [nome, lado, zona] of trabalhos) {
    await sharp(Buffer.from(svg(lado, zona))).png().toFile(join(destino, nome));
    console.log("escrito", nome);
  }
}

gerar().catch((e) => {
  console.error(e);
  process.exit(1);
});
