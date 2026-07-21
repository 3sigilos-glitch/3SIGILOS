"use client";

import { useCallback, useEffect, useState } from "react";

// Persistencia local (favoritos e notas), isolada neste hook para que
// trocar por Supabase mais tarde nao mexa nos ecras (seccao 8 e 9).

const KEY = "runas.store.v1";

export interface Store {
  favs: Record<number, boolean>;
  notes: Record<number, string>;
  /** passos do procedimento marcados no Altar */
  steps: Record<number, boolean>;
}

const EMPTY: Store = { favs: {}, notes: {}, steps: {} };

function load(): Store {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      favs: parsed.favs ?? {},
      notes: parsed.notes ?? {},
      steps: parsed.steps ?? {},
    };
  } catch {
    return EMPTY;
  }
}

function save(s: Store) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // sem espaço ou modo privado: a app continua a funcionar em memória
  }
}

export function useStore() {
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(load());
    setReady(true);
  }, []);

  const update = useCallback((fn: (s: Store) => Store) => {
    setStore((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const toggleFav = useCallback(
    (id: number) => update((s) => ({ ...s, favs: { ...s.favs, [id]: !s.favs[id] } })),
    [update]
  );

  const setNote = useCallback(
    (id: number, text: string) =>
      update((s) => {
        const notes = { ...s.notes };
        if (text.trim()) notes[id] = text;
        else delete notes[id];
        return { ...s, notes };
      }),
    [update]
  );

  const toggleStep = useCallback(
    (i: number) => update((s) => ({ ...s, steps: { ...s.steps, [i]: !s.steps[i] } })),
    [update]
  );

  const resetSteps = useCallback(
    () => update((s) => ({ ...s, steps: {} })),
    [update]
  );

  return { store, ready, toggleFav, setNote, toggleStep, resetSteps };
}
