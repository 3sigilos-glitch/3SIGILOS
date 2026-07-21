"use client";

import { usePathname } from "next/navigation";
import type { Env } from "@/lib/maps";
import { EnvContext } from "./EnvContext";
import BottomNav from "./BottomNav";
import { StoreProvider } from "./StoreProvider";
import { SheetProvider } from "./Sheet";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Estudo (claro) para ler e explorar; Altar e Templo (escuro) para
  // praticar à luz de velas.
  const env: Env =
    pathname.startsWith("/altar") || pathname.startsWith("/templo")
      ? "escuro"
      : "claro";

  return (
    <EnvContext.Provider value={env}>
      <StoreProvider>
        <div className={`env-${env} min-h-screen transition-colors`}>
          <SheetProvider>
            <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 lg:pb-10 lg:pl-60 lg:pr-6">
              {children}
            </main>
            <BottomNav />
          </SheetProvider>
        </div>
      </StoreProvider>
    </EnvContext.Provider>
  );
}
