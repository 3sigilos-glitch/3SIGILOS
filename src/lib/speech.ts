import { useCallback, useEffect, useRef, useState } from "react";

/* Motor de voz transversal (Web Speech API), usado no detalhe das cartas
   e na Jornada. Lida com o carregamento assíncrono das vozes, prefere
   PT-PT quando existe e degrada sem partir quando algo falta.

   Nota sobre a pausa: em muitos Android, speechSynthesis.pause() é
   simplesmente ignorado e o áudio continua. Por isso a pausa aqui é um
   cancel() com memória da posição (última fronteira de palavra ouvida),
   e o retomar volta a falar a partir desse ponto. Cada utterance tem um
   número de geração para os eventos antigos não interferirem. */

export interface Track {
  id: string;
  title: string;
  text: string;
}

export type SpeechStatus = "idle" | "playing" | "paused";

const supported = typeof window !== "undefined" && "speechSynthesis" in window;

let cachedVoices: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  if (!supported) return;
  cachedVoices = window.speechSynthesis.getVoices();
}
if (supported) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", refreshVoices);
}

export function pickVoice(): SpeechSynthesisVoice | null {
  refreshVoices();
  const pt = cachedVoices.filter((v) => v.lang.toLowerCase().startsWith("pt"));
  const ptPT = pt.find(
    (v) => v.lang.toLowerCase().includes("pt-pt") || v.lang.toLowerCase().includes("pt_pt")
  );
  return ptPT ?? pt[0] ?? null;
}

function fullText(track: Track): string {
  return track.title ? track.title + ". " + track.text : track.text;
}

export interface UseSpeech {
  supported: boolean;
  status: SpeechStatus;
  trackIndex: number;
  rate: number;
  hasPtVoice: boolean;
  charIndex: number;
  autoAdvance: boolean;
  setAutoAdvance: (v: boolean) => void;
  playTracks: (tracks: Track[], index?: number) => void;
  toggle: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  setRate: (r: number) => void;
}

export function useSpeech(onTrackChange?: (index: number) => void): UseSpeech {
  const [status, setStatus] = useState<SpeechStatus>("idle");

  // Avisa o ambiente sonoro para baixar enquanto a voz fala.
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("ts-speech", { detail: { speaking: status === "playing" } })
    );
  }, [status]);
  const [trackIndex, setTrackIndex] = useState(0);
  const [rate, setRateState] = useState(1);
  const [charIndex, setCharIndex] = useState(-1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const tracksRef = useRef<Track[]>([]);
  const rateRef = useRef(1);
  const autoRef = useRef(true);
  const genRef = useRef(0); // geração da utterance actual
  const trackRef = useRef(0);
  const pausedAtRef = useRef(0); // posição absoluta onde a pausa parou
  const lastCharRef = useRef(0); // última fronteira ouvida (absoluta)
  const onChangeRef = useRef(onTrackChange);
  onChangeRef.current = onTrackChange;
  autoRef.current = autoAdvance;

  const hardCancel = useCallback(() => {
    genRef.current += 1; // invalida os eventos da utterance anterior
    if (supported) window.speechSynthesis.cancel();
  }, []);

  const stop = useCallback(() => {
    hardCancel();
    pausedAtRef.current = 0;
    setStatus("idle");
    setCharIndex(-1);
  }, [hardCancel]);

  useEffect(() => stop, [stop]);

  const speakIndex = useCallback(
    (index: number, fromChar = 0) => {
      if (!supported) return;
      const track = tracksRef.current[index];
      if (!track) return;
      hardCancel();
      const gen = genRef.current;
      const text = fullText(track).slice(fromChar);
      if (!text.trim()) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-PT";
      const voice = pickVoice();
      if (voice) u.voice = voice;
      u.rate = rateRef.current;
      lastCharRef.current = fromChar;
      u.onboundary = (e) => {
        if (genRef.current !== gen) return;
        lastCharRef.current = fromChar + e.charIndex;
        setCharIndex(fromChar + e.charIndex);
      };
      u.onend = () => {
        if (genRef.current !== gen) return; // foi pausa, salto ou paragem
        setCharIndex(-1);
        pausedAtRef.current = 0;
        const nextIndex = index + 1;
        if (autoRef.current && nextIndex < tracksRef.current.length) {
          trackRef.current = nextIndex;
          setTrackIndex(nextIndex);
          onChangeRef.current?.(nextIndex);
          speakIndex(nextIndex);
        } else {
          setStatus("idle");
        }
      };
      u.onerror = () => {
        if (genRef.current !== gen) return;
        setStatus("idle");
        setCharIndex(-1);
      };
      trackRef.current = index;
      setTrackIndex(index);
      setStatus("playing");
      window.speechSynthesis.speak(u);
    },
    [hardCancel]
  );

  const playTracks = useCallback(
    (tracks: Track[], index = 0) => {
      tracksRef.current = tracks;
      pausedAtRef.current = 0;
      onChangeRef.current?.(index);
      speakIndex(index);
    },
    [speakIndex]
  );

  const toggle = useCallback(() => {
    if (!supported) return;
    if (status === "playing") {
      // Pausa fiável: cancela e guarda a posição para retomar.
      pausedAtRef.current = lastCharRef.current;
      hardCancel();
      setStatus("paused");
    } else if (status === "paused") {
      speakIndex(trackRef.current, pausedAtRef.current);
    } else if (tracksRef.current.length) {
      speakIndex(trackRef.current);
    }
  }, [status, speakIndex, hardCancel]);

  const next = useCallback(() => {
    if (trackRef.current + 1 < tracksRef.current.length) {
      pausedAtRef.current = 0;
      onChangeRef.current?.(trackRef.current + 1);
      speakIndex(trackRef.current + 1);
    }
  }, [speakIndex]);

  const prev = useCallback(() => {
    if (trackRef.current > 0) {
      pausedAtRef.current = 0;
      onChangeRef.current?.(trackRef.current - 1);
      speakIndex(trackRef.current - 1);
    }
  }, [speakIndex]);

  const setRate = useCallback(
    (r: number) => {
      rateRef.current = r;
      setRateState(r);
      // A velocidade nova aplica-se retomando perto do ponto onde ia.
      if (status === "playing") speakIndex(trackRef.current, lastCharRef.current);
    },
    [status, speakIndex]
  );

  return {
    supported,
    status,
    trackIndex,
    rate,
    hasPtVoice: pickVoice() !== null,
    charIndex,
    autoAdvance,
    setAutoAdvance,
    playTracks,
    toggle,
    stop,
    next,
    prev,
    setRate,
  };
}
