import type { Element } from "./types";

// Os 9 elementos. A cor nomeada e a cor da vela; os hex por ambiente
// vivem em maps.ts (CANDLE).
export const ELEMENTS: Element[] = [
  { n: "Cristalino", cor: "Branco", rep: "Pureza, luz, éter, elevação." },
  { n: "Mineral", cor: "Amarelo", rep: "Harmonia, beleza, prosperidade." },
  { n: "Vegetal", cor: "Verde", rep: "Intelecto, conhecimento, filosofia." },
  { n: "Eólico", cor: "Laranja", rep: "Renovação, proteção, liberdade." },
  { n: "Ígneo", cor: "Vermelho", rep: "Ação, batalhas, determinação." },
  { n: "Terreno", cor: "Marrom", rep: "Estabilidade, desenvolvimento, mudança." },
  { n: "Aquático", cor: "Azul", rep: "Cursos da vida, fluir, sentimentos." },
  { n: "Vazio", cor: "Preto", rep: "Absorção, finalizações, absorve o negativo." },
  { n: "Temporal", cor: "Roxo", rep: "Eternidade, tempo, maturidade." },
];

export const INTENTS: string[] = [
  "Cura", "Proteção", "Limpeza", "Prosperidade", "Amor", "Comunicação",
  "Coragem", "Sabedoria", "Elevação", "Harmonia", "Transformação", "Destino",
];

export const POLES = ["Irradiador", "Neutro", "Absorvedor"] as const;
export const CLASSES = ["Guerreiro", "Sacerdote", "Mago", "Híbrido"] as const;

// Cor da vela por elemento, no feminino (concorda com "vela": vela preta,
// vela roxa, vela vermelha...).
export const VELA_COR: Record<Element["n"], string> = {
  Cristalino: "branca",
  Mineral: "amarela",
  Vegetal: "verde",
  "Eólico": "laranja",
  "Ígneo": "vermelha",
  Terreno: "castanha",
  "Aquático": "azul",
  Vazio: "preta",
  Temporal: "roxa",
};
