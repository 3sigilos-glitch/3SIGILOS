import { load, save } from "./storage";

/* Registo de leituras: tudo local e privado, sem backend.
   Estrutura limpa a pensar numa futura exportação manual. */

export interface ReadingCardEntry {
  slug: string;
  reversed: boolean;
}

export interface Reading {
  id: string;
  createdAt: number;
  spreadId: string;
  framingId?: string;
  question: string;
  cards: ReadingCardEntry[];
  patterns: string[];
  yesNo?: { verdict: string; note: string };
  aiText?: string;
  notes: string;
}

const KEY = "ts-readings";

export function listReadings(): Reading[] {
  return load<Reading[]>(KEY, []);
}

export function getReading(id: string): Reading | undefined {
  return listReadings().find((r) => r.id === id);
}

export function saveReading(reading: Reading) {
  const all = listReadings().filter((r) => r.id !== reading.id);
  all.unshift(reading);
  save(KEY, all.slice(0, 200));
}

export function updateReading(id: string, patch: Partial<Reading>) {
  const all = listReadings();
  const i = all.findIndex((r) => r.id === id);
  if (i === -1) return;
  all[i] = { ...all[i], ...patch };
  save(KEY, all);
}

export function deleteReading(id: string) {
  save(
    KEY,
    listReadings().filter((r) => r.id !== id)
  );
}

export function newReadingId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
