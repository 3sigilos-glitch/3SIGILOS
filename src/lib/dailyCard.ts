import { CARDS, Card } from "../data";
import { DAY_MESSAGES } from "../data/day-messages";
import { load, save } from "./storage";

/* Carta do dia determinística: a mesma durante todo o dia local,
   muda à meia-noite. Semente derivada de ano, mês e dia. */

function daySeed(d = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function mix(seed: number): number {
  let h = seed >>> 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

export interface DailyCard {
  card: Card;
  reversed: boolean;
  dateKey: string;
}

export function dailyCard(reversedEnabled: boolean, d = new Date()): DailyCard {
  const seed = daySeed(d);
  const card = CARDS[mix(seed) % CARDS.length];
  // Hipótese determinística de cerca de 30 por cento de sair invertida.
  const reversed = reversedEnabled && mix(seed * 31 + 7) % 100 < 30;
  const dateKey = d.toISOString().slice(0, 10);
  return { card, reversed, dateKey };
}

/* Mensagem do dia: usa dayMsg se existir; caso contrário compõe uma
   mensagem curta com as keywords e a primeira frase do significado. */
export function dayMessage(card: Card): string {
  const custom = DAY_MESSAGES[card.en];
  if (custom) return custom;
  const firstSentence = card.up.split(/(?<=\.)\s/)[0] ?? "";
  const kws = card.kw.slice(0, 3).join(", ");
  return `Hoje pede ${kws}. ${firstSentence}`;
}

export interface HistoryEntry {
  dateKey: string;
  slug: string;
  reversed: boolean;
}

const HISTORY_KEY = "ts-daily-history";

export function recordDaily(entry: DailyCard): HistoryEntry[] {
  const history = load<HistoryEntry[]>(HISTORY_KEY, []);
  if (!history.some((h) => h.dateKey === entry.dateKey)) {
    history.unshift({ dateKey: entry.dateKey, slug: entry.card.slug, reversed: entry.reversed });
    save(HISTORY_KEY, history.slice(0, 60));
  }
  return load<HistoryEntry[]>(HISTORY_KEY, []);
}

export function dailyHistory(): HistoryEntry[] {
  return load<HistoryEntry[]>(HISTORY_KEY, []);
}
