// Gera os icones da PWA a partir de SVG, com o motivo do arco.
// Correr com: npm run icones
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));
const destino = join(raiz, "public", "icons");

// zonaSegura: fraccao do lado ocupada pelo desenho. Menor em maskable
// para o Android poder recortar sem cortar o arco.
function svg(lado, zonaSegura) {
  const c = lado / 2;
  const raio = (lado * zonaSegura) / 2;
  const largura = Math.max(2, lado * 0.055);
  // Arco de cerca de 210 graus, aberto em baixo, como um mostrador.
  const a0 = (150 * Math.PI) / 180;
  const a1 = (390 * Math.PI) / 180;
  const x0 = c + raio * Math.cos(a0);
  const y0 = c + raio * Math.sin(a0);
  const x1 = c + raio * Math.cos(a1);
  const y1 = c + raio * Math.sin(a1);
  // Agulha a apontar para cima e para a direita.
  const ang = (300 * Math.PI) / 180;
  const ax = c + raio * 0.72 * Math.cos(ang);
  const ay = c + raio * 0.72 * Math.sin(ang);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" viewBox="0 0 ${lado} ${lado}">
  <rect width="${lado}" height="${lado}" fill="#12161A"/>
  <path d="M ${x0} ${y0} A ${raio} ${raio} 0 1 1 ${x1} ${y1}"
        fill="none" stroke="#2A323B" stroke-width="${largura}" stroke-linecap="round"/>
  <path d="M ${x0} ${y0} A ${raio} ${raio} 0 0 1 ${ax} ${ay}"
        fill="none" stroke="#7FA37A" stroke-width="${largura}" stroke-linecap="round"/>
  <circle cx="${c}" cy="${c}" r="${largura * 0.9}" fill="#E8E4DC"/>
  <line x1="${c}" y1="${c}" x2="${ax}" y2="${ay}" stroke="#E8E4DC" stroke-width="${largura * 0.6}" stroke-linecap="round"/>
</svg>`;
}

async function gerar() {
  await mkdir(destino, { recursive: true });
  const trabalhos = [
    ["icone-192.png", 192, 0.78],
    ["icone-512.png", 512, 0.78],
    ["icone-maskable-192.png", 192, 0.62],
    ["icone-maskable-512.png", 512, 0.62],
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
