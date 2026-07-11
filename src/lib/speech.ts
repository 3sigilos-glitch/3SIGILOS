import { useCallback, useEffect, useRef, useState } from "react";

/* Motor de voz transversal (Web Speech API), usado no detalhe das cartas
   e na Jornada. Lida com o carregamento assíncrono das vozes, prefere
   PT-PT quando existe e degrada sem partir quando algo falta. */

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
  const ptPT = pt.find((v) => v.lang.toLowerCase().includes("pt-pt") || v.lang.toLowerCase().includes("pt_pt"));
  return ptPT ?? pt[0] ?? null;
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
  const [trackIndex, setTrackIndex] = useState(0);
  const [rate, setRateState] = useState(1);
  const [charIndex, setCharIndex] = useState(-1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const tracksRef = useRef<Track[]>([]);
  const rateRef = useRef(1);
  const autoRef = useRef(true);
  const onChangeRef = useRef(onTrackChange);
  onChangeRef.current = onTrackChange;
  autoRef.current = autoAdvance;

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setStatus("idle");
    setCharIndex(-1);
  }, []);

  useEffect(() => stop, [stop]);

  const speakIndex = useCallback((index: number) => {
    if (!supported) return;
    const track = tracksRef.current[index];
    if (!track) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(track.title + ". " + track.text);
    u.lang = "pt-PT";
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.rate = rateRef.current;
    u.onboundary = (e) => {
      if (e.name === "word" || e.name === "sentence") setCharIndex(e.charIndex);
    };
    u.onend = () => {
      setCharIndex(-1);
      const nextIndex = index + 1;
      if (autoRef.current && nextIndex < tracksRef.current.length) {
        setTrackIndex(nextIndex);
        onChangeRef.current?.(nextIndex);
        speakIndex(nextIndex);
      } else {
        setStatus("idle");
      }
    };
    u.onerror = () => {
      setStatus("idle");
      setCharIndex(-1);
    };
    setTrackIndex(index);
    setStatus("playing");
    window.speechSynthesis.speak(u);
  }, []);

  const playTracks = useCallback(
    (tracks: Track[], index = 0) => {
      tracksRef.current = tracks;
      onChangeRef.current?.(index);
      speakIndex(index);
    },
    [speakIndex]
  );

  const toggle = useCallback(() => {
    if (!supported) return;
    if (status === "playing") {
      window.speechSynthesis.pause();
      setStatus("paused");
    } else if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("playing");
    } else if (tracksRef.current.length) {
      speakIndex(trackIndex);
    }
  }, [status, trackIndex, speakIndex]);

  const next = useCallback(() => {
    if (trackIndex + 1 < tracksRef.current.length) {
      onChangeRef.current?.(trackIndex + 1);
      speakIndex(trackIndex + 1);
    }
  }, [trackIndex, speakIndex]);

  const prev = useCallback(() => {
    if (trackIndex > 0) {
      onChangeRef.current?.(trackIndex - 1);
      speakIndex(trackIndex - 1);
    }
  }, [trackIndex, speakIndex]);

  const setRate = useCallback(
    (r: number) => {
      rateRef.current = r;
      setRateState(r);
      // A velocidade nova aplica-se retomando a faixa actual do início.
      if (status !== "idle") speakIndex(trackIndex);
    },
    [status, trackIndex, speakIndex]
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
