"use client";

import { createContext, useContext } from "react";
import { useStore } from "@/lib/useStore";

// Um único store partilhado por toda a app, para que um favorito marcado
// na ficha apareça logo em Guardados e na grelha.

type StoreApi = ReturnType<typeof useStore>;

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const api = useStore();
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useAppStore fora do StoreProvider");
  return ctx;
}
