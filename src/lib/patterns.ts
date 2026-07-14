import { Card, RANK_LABEL, SUITS } from "../data";

/* Leitura de padrões por regras: observações factuais derivadas do
   conjunto de cartas, sem previsões nem significados inventados. */

export interface DrawnCard {
  card: Card;
  reversed: boolean;
}

const SUIT_THEME: Record<string, string> = {
  wands: "Paus e fogo: o centro de gravidade está na ação, na vontade e nos projetos.",
  cups: "Copas e água: o centro de gravidade está nas emoções e nas relações.",
  swords: "Espadas e ar: o centro de gravidade está na mente, nas decisões e na comunicação.",
  pentacles: "Ouros e terra: o centro de gravidade está no material e no concreto.",
};

const NUMBER_THEME: Record<number, string> = {
  1: "vários Ases: começos e sementes em várias frentes",
  2: "vários Dois: escolhas e equilíbrios em jogo",
  3: "vários Três: crescimento e colaboração",
  4: "vários Quatros: estabilidade, ou estagnação a vigiar",
  5: "vários Cincos: crise, perda ou mudança a atravessar",
  6: "vários Seis: harmonia e reequilíbrio a regressar",
  7: "vários Setes: provas e reavaliações",
  8: "vários Oitos: movimento e poder em marcha",
  9: "vários Noves: culminar próximo, para o melhor ou para o pior",
  10: "vários Dez: fins de ciclo e plenitudes",
};

export function readPatterns(cards: DrawnCard[]): string[] {
  const obs: string[] = [];
  const n = cards.length;
  if (n === 0) return obs;

  // Arcanos Maiores
  const majors = cards.filter((c) => c.card.cat === "major").length;
  if (majors > 0) {
    const half = majors >= Math.ceil(n / 2);
    obs.push(
      `${majors} de ${n} ${n === 1 ? "carta é" : "cartas são"} Arcanos Maiores` +
        (half && n > 1
          ? ": forças de peso e temas de fundo em jogo, para lá do dia a dia."
          : n > 1
            ? "."
            : ": um tema de fundo, com peso próprio.")
    );
  } else if (n > 1) {
    obs.push("Sem Arcanos Maiores: a leitura fala do quotidiano e do que está ao teu alcance.");
  }

  // Naipe dominante
  const suitCount: Record<string, number> = {};
  for (const c of cards) {
    if (c.card.cat !== "major") suitCount[c.card.cat] = (suitCount[c.card.cat] ?? 0) + 1;
  }
  const dominant = Object.entries(suitCount).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] >= 2 && dominant[1] > n / 3) {
    obs.push(
      `${SUITS[dominant[0] as keyof typeof SUITS].label} em maioria (${dominant[1]} cartas). ` +
        SUIT_THEME[dominant[0]]
    );
  }

  // Números repetidos
  const rankCount: Record<number, number> = {};
  for (const c of cards) {
    if (c.card.rank && c.card.rank <= 10) rankCount[c.card.rank] = (rankCount[c.card.rank] ?? 0) + 1;
  }
  for (const [rank, count] of Object.entries(rankCount)) {
    if (count >= 2) {
      obs.push(`Número repetido, ${NUMBER_THEME[Number(rank)]}.`);
    }
  }

  // Cartas de corte
  const courts = cards.filter((c) => c.card.rank && c.card.rank >= 11);
  if (courts.length >= 2) {
    obs.push(
      `${courts.length} cartas de corte (${courts
        .map((c) => RANK_LABEL[String(c.card.rank)])
        .join(", ")}): podem indicar pessoas envolvidas na questão, ou posturas a assumir.`
    );
  } else if (courts.length === 1 && n >= 3) {
    obs.push(
      `Uma carta de corte (${RANK_LABEL[String(courts[0].card.rank)]} de ${SUITS[courts[0].card.cat as keyof typeof SUITS].label}): pode indicar uma pessoa envolvida, ou uma postura a assumir.`
    );
  }

  // Invertidas
  const reversed = cards.filter((c) => c.reversed).length;
  if (reversed > 0) {
    obs.push(
      `${reversed} de ${n} ${reversed === 1 ? "carta invertida" : "cartas invertidas"}: energia bloqueada, interiorizada ou em transição nesses pontos.`
    );
  } else if (n > 1) {
    obs.push("Todas as cartas direitas: a energia do conjunto flui sem grandes bloqueios.");
  }

  return obs;
}

/* Sim ou não: pondera a orientação e a natureza da carta. */
const YES_CARDS = new Set([
  "The Sun", "The World", "The Star", "The Empress", "The Magician", "The Lovers",
  "Ace of Wands", "Ace of Cups", "Ace of Pentacles", "Three of Cups", "Six of Wands",
  "Nine of Cups", "Ten of Cups", "Ten of Pentacles", "Four of Wands", "The Chariot",
  "Temperance", "Strength", "Judgement", "The Emperor", "Two of Cups", "Eight of Wands",
]);
const NO_CARDS = new Set([
  "The Tower", "The Devil", "Death", "Ten of Swords", "Three of Swords", "Five of Cups",
  "Five of Pentacles", "Nine of Swords", "Eight of Swords", "Five of Wands", "Seven of Swords",
  "The Moon", "Five of Swords", "Ten of Wands",
]);

export interface YesNoAnswer {
  verdict: "sim" | "não" | "depende";
  note: string;
}

export function yesNoFor(drawn: DrawnCard): YesNoAnswer {
  const inclined = YES_CARDS.has(drawn.card.en) ? 1 : NO_CARDS.has(drawn.card.en) ? -1 : 0;
  const score = drawn.reversed ? -inclined || -0.5 : inclined || 0.5;
  if (inclined === 0) {
    return {
      verdict: "depende",
      note: drawn.reversed
        ? "É uma carta ambígua e saiu invertida: a resposta depende de desbloqueares primeiro o que está preso. Lê os padrões e o significado com atenção."
        : "É uma carta ambígua: a resposta depende das condições à volta. Lê os padrões e o significado com atenção.",
    };
  }
  if (score > 0) {
    return {
      verdict: "sim",
      note: drawn.reversed
        ? "Tende a sim, mas a inversão pede tempo ou uma condição por cumprir."
        : "A carta inclina-se claramente para o sim.",
    };
  }
  return {
    verdict: "não",
    note: drawn.reversed
      ? "Tende a não, embora a inversão sugira que o bloqueio pode estar a dissolver-se."
      : "A carta inclina-se para o não, ou para um custo alto demais.",
  };
}
