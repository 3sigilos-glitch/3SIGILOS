import { CARDS } from ".";

/* Narrativa da Jornada do Louco: 22 capítulos, um por Arcano Maior.
   O texto definitivo será fornecido pelo autor em PT-PT, sem travessões.
   Até lá, cada capítulo tem um marcador de posição e a app funciona
   na mesma (trilho, áudio e transições). */

export interface JourneyChapter {
  roman: string;
  cardEn: string;
  title: string;
  text: string;
}

const PLACEHOLDER =
  "O texto deste capítulo está em preparação. Em breve, a narrativa da " +
  "Jornada do Louco acompanha esta carta, do primeiro passo à plenitude do Mundo.";

export const FOOL_JOURNEY: JourneyChapter[] = CARDS.filter((c) => c.cat === "major").map((c) => ({
  roman: c.roman!,
  cardEn: c.en,
  title: c.pt,
  text: PLACEHOLDER,
}));
