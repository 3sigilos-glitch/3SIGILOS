"use client";

import { useCallback, useEffect, useState } from "react";

// Persistencia local (favoritos e notas), isolada neste hook para que
// trocar por Supabase mais tarde nao mexa nos ecras (seccao 8 e 9).

const KEY = "runas.store.v1";
// Favoritos também ficam espelhados na chave do handoff do redesign
// (array de ids), para compatibilidade com o comportamento especificado.
const FAVS_KEY = "runas-codice-favs";

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
    const parsed = raw ? (JSON.parse(raw) as Partial<Store>) : {};
    const favs: Record<number, boolean> = { ...(parsed.favs ?? {}) };
    // ler tambem a chave do redesign (array de ids)
    const rawFavs = window.localStorage.getItem(FAVS_KEY);
    if (rawFavs) {
      const list = JSON.parse(rawFavs) as unknown;
      if (Array.isArray(list)) {
        for (const id of list) {
          if (typeof id === "number") favs[id] = true;
        }
      }
    }
    return {
      favs,
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
    const list = Object.keys(s.favs)
      .map(Number)
      .filter((id) => s.favs[id]);
    window.localStorage.setItem(FAVS_KEY, JSON.stringify(list));
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
