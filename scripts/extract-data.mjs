// Extrai os dados do HTML original (fonte de verdade) para src/data/cards.json.
// Avalia apenas o bloco de constantes do <script>, sem tocar no DOM,
// para garantir que os textos saem exactamente como estão no ficheiro.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const html = readFileSync(join(root, "source/tarot-rider-waite.html"), "utf8");

const start = html.indexOf("const SUITS");
const end = html.indexOf("/* ---------- Estado ---------- */");
if (start === -1 || end === -1) {
  console.error("Não encontrei o bloco de dados no HTML.");
  process.exit(1);
}

const context = {};
vm.createContext(context);
vm.runInContext(
  html.slice(start, end) +
    "\n;__out = { SUITS, RANK_LABEL, RANK_SHORT, ROMAN2NN, SUIT_IMG, CARDS, GUIDE_SUITS, GUIDE_NUMS, EXTRA };",
  context
);
const { SUITS, RANK_LABEL, RANK_SHORT, ROMAN2NN, SUIT_IMG, CARDS, GUIDE_SUITS, GUIDE_NUMS, EXTRA } =
  context.__out;

// ---------- Validação ----------
const errors = [];
if (CARDS.length !== 78) errors.push(`Esperava 78 cartas, encontrei ${CARDS.length}.`);

const counts = { major: 0, wands: 0, cups: 0, swords: 0, pentacles: 0 };
for (const c of CARDS) {
  counts[c.cat] = (counts[c.cat] || 0) + 1;
  const id = c.en || c.pt || "(sem nome)";
  for (const field of ["pt", "en", "cat", "kw", "up", "rev"]) {
    if (!c[field] || (Array.isArray(c[field]) && c[field].length === 0)) {
      errors.push(`${id}: campo "${field}" em falta ou vazio.`);
    }
  }
  if (c.cat === "major" && !(c.roman in ROMAN2NN)) errors.push(`${id}: roman inválido.`);
  if (c.cat !== "major" && !(c.rank >= 1 && c.rank <= 14)) errors.push(`${id}: rank inválido.`);
  const extra = EXTRA[c.en];
  if (!extra) {
    errors.push(`${id}: sem entrada em EXTRA.`);
  } else {
    if (!extra.sym) errors.push(`${id}: "sym" em falta.`);
    if (!extra.q || extra.q.length === 0) errors.push(`${id}: "q" em falta.`);
  }
}
const expected = { major: 22, wands: 14, cups: 14, swords: 14, pentacles: 14 };
for (const [cat, n] of Object.entries(expected)) {
  if (counts[cat] !== n) errors.push(`Categoria ${cat}: esperava ${n}, encontrei ${counts[cat]}.`);
}
if (GUIDE_SUITS.length !== 4) errors.push(`GUIDE_SUITS: esperava 4, encontrei ${GUIDE_SUITS.length}.`);
if (GUIDE_NUMS.length !== 14) errors.push(`GUIDE_NUMS: esperava 14, encontrei ${GUIDE_NUMS.length}.`);

if (errors.length) {
  console.error("Validação falhou:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

// Junta EXTRA a cada carta e acrescenta um slug estável para as rotas.
const slug = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const cards = CARDS.map((c) => ({
  ...c,
  slug: slug(c.en),
  sym: EXTRA[c.en].sym,
  q: EXTRA[c.en].q,
}));

const out = {
  suits: SUITS,
  rankLabel: RANK_LABEL,
  rankShort: RANK_SHORT,
  roman2nn: ROMAN2NN,
  suitImg: SUIT_IMG,
  guideSuits: GUIDE_SUITS,
  guideNums: GUIDE_NUMS,
  cards,
};

writeFileSync(join(root, "src/data/cards.json"), JSON.stringify(out, null, 1), "utf8");
console.log(`OK: ${cards.length} cartas validadas (Maiores ${counts.major}, Paus ${counts.wands}, Copas ${counts.cups}, Espadas ${counts.swords}, Ouros ${counts.pentacles}).`);
console.log("Todas têm up, rev, sym e q. Escrito em src/data/cards.json");
