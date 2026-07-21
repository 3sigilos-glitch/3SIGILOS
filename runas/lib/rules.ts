import type { ClassName, ElementName, Rune } from "./types";
import { POLE_CLASS } from "./maps";
import { RUNES } from "./runes";

// Regras da matriz, portadas dos helpers do prototipo.

/** Classe templária da runa: o pólo define a classe. */
export function classOf(r: Rune): ClassName {
  return POLE_CLASS[r.pole];
}

/**
 * Elementos da runa. O Odin/Wyrd é tríade: ocupa Cristalino, Vazio e
 * Temporal, logo tem três velas (branca, preta, roxa).
 */
export function elemsOf(r: Rune): ElementName[] {
  if (r.elem === "Tríade") return ["Cristalino", "Vazio", "Temporal"];
  return [r.elem];
}

export function byDeity(name: string): Rune | undefined {
  return RUNES.find((r) => r.deity === name);
}

/** Pesquisa por qualquer um dos dois nomes, regente, epíteto ou palavra-chave. */
export function searchText(r: Rune): string {
  return (r.ed + " " + r.mod + " " + r.deity + " " + r.kw.join(" ") + " " + r.epi).toLowerCase();
}

/** Normaliza para pesquisa insensível a acentos. */
export function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
