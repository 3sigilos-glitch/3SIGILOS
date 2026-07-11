import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CatFilter, RankFilter } from "../data";
import { load, save } from "./storage";

/* Preferências e estado partilhado da app, persistidos localmente. */

interface Prefs {
  reversed: boolean;
  setReversed: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (slug: string) => void;
  isFavorite: (slug: string) => boolean;
  getNote: (slug: string) => string;
  setNote: (slug: string, text: string) => void;
  // filtros da vista Cartas, partilhados com o modo estudo
  cat: CatFilter;
  setCat: (c: CatFilter) => void;
  rank: RankFilter;
  setRank: (r: RankFilter) => void;
  query: string;
  setQuery: (q: string) => void;
  favOnly: boolean;
  setFavOnly: (v: boolean) => void;
}

const Ctx = createContext<Prefs | null>(null);

interface Note {
  text: string;
  updated: number;
}

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [reversed, setReversed] = useState(() => load("ts-reversed-v2", false));
  const [favorites, setFavorites] = useState<string[]>(() => load("ts-favorites", []));
  const [notes, setNotes] = useState<Record<string, Note>>(() => load("ts-diary", {}));
  const [cat, setCat] = useState<CatFilter>("all");
  const [rank, setRank] = useState<RankFilter>("all");
  const [query, setQuery] = useState("");
  const [favOnly, setFavOnly] = useState(false);

  useEffect(() => save("ts-reversed-v2", reversed), [reversed]);
  useEffect(() => save("ts-favorites", favorites), [favorites]);
  useEffect(() => save("ts-diary", notes), [notes]);

  const value = useMemo<Prefs>(
    () => ({
      reversed,
      setReversed,
      favorites,
      toggleFavorite: (slug) =>
        setFavorites((f) => (f.includes(slug) ? f.filter((s) => s !== slug) : [...f, slug])),
      isFavorite: (slug) => favorites.includes(slug),
      getNote: (slug) => notes[slug]?.text ?? "",
      setNote: (slug, text) =>
        setNotes((n) => {
          const next = { ...n };
          if (text.trim() === "") delete next[slug];
          else next[slug] = { text, updated: Date.now() };
          return next;
        }),
      cat,
      setCat,
      rank,
      setRank,
      query,
      setQuery,
      favOnly,
      setFavOnly,
    }),
    [reversed, favorites, notes, cat, rank, query, favOnly]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): Prefs {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrefs fora do PrefsProvider");
  return ctx;
}
