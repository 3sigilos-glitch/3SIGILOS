"use client";

import Header from "./Header";
import { StoreProvider } from "./StoreProvider";
import { GlyphScaleProvider } from "./GlyphScales";
import { ModalProvider } from "./Modal";

// Camada base do redesign: aurora boreal fixa ao fundo, header sticky,
// conteúdo a 1100px e footer com futhark.
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <GlyphScaleProvider>
        <ModalProvider>
          {/* aurora boreal: divs fixas, sem eventos, atrás do conteúdo */}
          <div
            aria-hidden
            style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}
          >
            <div
              style={{
                position: "absolute",
                top: "-28%",
                left: "-12%",
                width: "78%",
                height: "80%",
                background: "radial-gradient(closest-side, rgba(122,98,186,0.38), transparent 70%)",
                filter: "blur(50px)",
                animation: "drift 20s ease-in-out infinite alternate",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "-18%",
                right: "-16%",
                width: "70%",
                height: "74%",
                background: "radial-gradient(closest-side, rgba(74,140,193,0.30), transparent 70%)",
                filter: "blur(50px)",
                animation: "drift 26s ease-in-out infinite alternate-reverse",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "10%",
                left: "24%",
                width: "58%",
                height: "48%",
                background: "radial-gradient(closest-side, rgba(96,180,150,0.16), transparent 70%)",
                filter: "blur(50px)",
                animation: "drift 32s ease-in-out infinite alternate",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "26%",
                left: "6%",
                width: "46%",
                height: "40%",
                background: "radial-gradient(closest-side, rgba(201,168,106,0.12), transparent 70%)",
                filter: "blur(50px)",
                animation: "drift 24s ease-in-out infinite alternate-reverse",
              }}
            />
          </div>

          <Header />
          <main
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              padding: "28px 20px 80px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {children}
          </main>
          <footer
            style={{
              borderTop: "1px solid #1d1a29",
              padding: "18px 20px",
              textAlign: "center",
              color: "var(--text-dim)",
              fontSize: 14,
              letterSpacing: 1,
              position: "relative",
              zIndex: 1,
            }}
          >
            <span className="font-runic" style={{ color: "var(--text-4)" }}>
              ᚠᚢᚦᚨᚱᚲ
            </span>{" "}
            · Módulo Branco · Magia Nórdica
          </footer>
        </ModalProvider>
      </GlyphScaleProvider>
    </StoreProvider>
  );
}
