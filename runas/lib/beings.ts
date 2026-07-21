import type { Being } from "./types";

// Os 9 seres. `rune` e o id da runa que sumona o ser.
export const BEINGS: Being[] = [
  { n: "Elfos", epi: "Filhos da Luz", deity: "Freyr", rune: 0,
    d: "Os mais luminosos; iluminação que vem de dentro, ligação à natureza e à arte.", module: "branco" },
  { n: "Anões", epi: "Lapidação do Espírito", deity: "Wayland", rune: 7,
    d: "Senhores da forja; equilibram minérios e hormonas, lapidam o espírito, buscam a felicidade.", module: "branco" },
  { n: "Ents", epi: "Árvores Curadoras", deity: "Yggdrasil", rune: 12,
    d: "Árvores vivas; tutores da mente, cura mental, ótimos para pessoas idosas.", module: "branco" },
  { n: "Valquírias", epi: "Guerreiras Celestiais", deity: "Valquíria", rune: 18,
    d: "Equilibradoras; levam a pessoa a realidades que descarregam ou energizam.", module: "branco" },
  { n: "Dragões", epi: "Potência Divina", deity: "Siegfried", rune: 4,
    d: "Pura força espiritual; limpeza profunda e potencializadores de ações e decisões.", module: "branco" },
  { n: "Elementares", epi: "Seres da Terra", deity: "Baldur", rune: 22,
    d: "Fadas, gnomos e silfos; trabalham o campo mediúnico e limpam ambientes.", module: "branco" },
  { n: "Sereias", epi: "Cantos e Encantos", deity: "Njord", rune: 20,
    d: "Cantos que são emissões energéticas; diluem mágoas e hábitos, trabalham os sentimentos.", module: "branco" },
  { n: "Espectros", epi: "Esgotadores de Negatividades", deity: "Hela", rune: 9,
    d: "Seres do vazio; esgotam o medo e as fobias, muito bons contra pesadelos.", module: "branco" },
  { n: "Gigantes", epi: "Resistência e Crescimento", deity: "Ymir", rune: 8,
    d: "Estruturadores; dão resistência e persistência, e combatem a ilusão.", module: "branco" },
];

export const beingByName = (n: string): Being | undefined =>
  BEINGS.find((b) => b.n === n);
