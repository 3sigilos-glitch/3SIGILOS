import raw from "./cards.json";

export type Cat = "major" | "wands" | "cups" | "swords" | "pentacles";
export type CatFilter = Cat | "all";
export type RankFilter = number | "all";

export interface Card {
  pt: string;
  en: string;
  cat: Cat;
  roman?: string;
  rank?: number;
  kw: string[];
  up: string;
  rev: string;
  slug: string;
  sym: string;
  q: string[];
}

export interface SuitMeta {
  label: string;
  en: string;
  color: string;
  hex: string;
  el: string;
}

interface Data {
  suits: Record<Cat, SuitMeta>;
  rankLabel: Record<string, string>;
  rankShort: Record<string, string>;
  roman2nn: Record<string, string>;
  suitImg: Record<string, string>;
  guideSuits: { name: string; en: string; el: string; hex: string; body: string }[];
  guideNums: { n: string; body: string }[];
  cards: Card[];
}

const data = raw as unknown as Data;

export const CARDS = data.cards;
export const SUITS = data.suits;
export const RANK_LABEL = data.rankLabel;
export const RANK_SHORT = data.rankShort;
export const GUIDE_SUITS = data.guideSuits;
export const GUIDE_NUMS = data.guideNums;

const ROMAN2NN = data.roman2nn;
const SUIT_IMG = data.suitImg;

export function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function pad2(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

/* URL da gravura de 1909 (Wikimedia Commons, domínio público) */
export function cardImgFile(c: Card): string {
  if (c.cat === "major") {
    return "RWS1909 - " + ROMAN2NN[c.roman!] + " " + c.en.replace(/^The /, "") + ".jpeg";
  }
  return "RWS1909 - " + SUIT_IMG[c.cat] + " " + pad2(c.rank!) + ".jpeg";
}

export function cardImgURL(c: Card, w: number): string {
  return (
    "https://commons.wikimedia.org/wiki/Special:FilePath/" +
    encodeURIComponent(cardImgFile(c)) +
    "?width=" +
    w
  );
}

export function badgeText(c: Card): string {
  return c.cat === "major" ? c.roman! : RANK_SHORT[String(c.rank)];
}

export function metaEyebrow(c: Card): string {
  if (c.cat === "major") return "Arcano Maior · " + c.roman;
  const s = SUITS[c.cat];
  return s.label + " · " + s.el;
}

export function suitHex(cat: Cat): string {
  return SUITS[cat]?.hex ?? "#b89344";
}

const HAYSTACK = new Map<string, string>(
  CARDS.map((c) => {
    const s = SUITS[c.cat];
    return [
      c.slug,
      norm(
        [
          c.pt,
          c.en,
          c.kw.join(" "),
          s.label,
          s.en,
          s.el,
          c.roman ?? "",
          c.rank ? RANK_LABEL[String(c.rank)] : "",
        ].join(" ")
      ),
    ];
  })
);

export function filterCards(cat: CatFilter, rank: RankFilter, query: string): Card[] {
  const q = norm(query.trim());
  return CARDS.filter((c) => {
    if (cat !== "all" && c.cat !== cat) return false;
    if (rank !== "all" && c.rank !== rank) return false;
    if (q && !HAYSTACK.get(c.slug)!.includes(q)) return false;
    return true;
  });
}

export function cardBySlug(slug: string): Card | undefined {
  return CARDS.find((c) => c.slug === slug);
}

export const CAT_FILTERS: { value: CatFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "major", label: "Maiores" },
  { value: "wands", label: "Paus" },
  { value: "cups", label: "Copas" },
  { value: "swords", label: "Espadas" },
  { value: "pentacles", label: "Ouros" },
];

export const RANK_FILTERS: { value: RankFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  ...Array.from({ length: 14 }, (_, i) => ({
    value: (i + 1) as RankFilter,
    label: RANK_LABEL[String(i + 1)],
  })),
];
