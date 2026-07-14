import { load, save } from "./storage";

/* Ambiente sonoro opcional, transversal à app. Sempre desligado por
   defeito. Os ficheiros vivem em src/assets/ambient/ (fornecidos pelo
   autor, de fontes livres); sem ficheiro, a opção aparece indisponível.
   Quando a voz está a falar, o ambiente baixa para não competir. */

export interface AmbientChoice {
  id: string;
  label: string;
  url: string | null;
}

const FILES = import.meta.glob("../assets/ambient/*.mp3", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function urlFor(id: string): string | null {
  const hit = Object.entries(FILES).find(([path]) => path.includes("/" + id + "."));
  return hit ? hit[1] : null;
}

export const AMBIENTS: AmbientChoice[] = [
  { id: "rio", label: "Rio", url: urlFor("rio") },
  { id: "mata", label: "Mata com pássaros", url: urlFor("mata") },
  { id: "mar", label: "Mar", url: urlFor("mar") },
  { id: "chuva", label: "Chuva suave", url: urlFor("chuva") },
  { id: "lareira", label: "Lareira", url: urlFor("lareira") },
  { id: "galaxia", label: "Galáctico zen", url: urlFor("galaxia") },
];

let audio: HTMLAudioElement | null = null;
let currentId: string | null = null;
let baseVolume = load<number>("ts-ambient-volume", 0.5);
let ducked = false;

function applyVolume() {
  if (audio) audio.volume = ducked ? baseVolume * 0.15 : baseVolume;
}

export function ambientState() {
  return { playing: currentId, volume: baseVolume };
}

export function playAmbient(id: string): boolean {
  const choice = AMBIENTS.find((a) => a.id === id);
  if (!choice?.url) return false;
  stopAmbient();
  audio = new Audio(choice.url);
  audio.loop = true;
  applyVolume();
  audio.play().catch(() => {
    audio = null;
  });
  currentId = audio ? id : null;
  return currentId !== null;
}

export function stopAmbient() {
  audio?.pause();
  audio = null;
  currentId = null;
}

export function setAmbientVolume(v: number) {
  baseVolume = Math.min(1, Math.max(0, v));
  save("ts-ambient-volume", baseVolume);
  applyVolume();
}

/* A voz da app avisa por evento quando começa e acaba de falar. */
if (typeof window !== "undefined") {
  window.addEventListener("ts-speech", (e) => {
    ducked = Boolean((e as CustomEvent).detail?.speaking);
    applyVolume();
  });
}
