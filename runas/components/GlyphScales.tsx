"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { GLYPH } from "@/lib/glyphs";

// Normalização do tamanho dos glifos (bug fix crítico do handoff):
// a Noto Sans Runic desenha alguns glifos (ᚲ, ᛃ, ᛜ, ᛊ...) com "tinta"
// muito menor que o em-box. Depois de as fontes carregarem, mede-se cada
// glifo num canvas offscreen, calcula-se a mediana e escala-se cada um
// por mediana/tinta (clamp 0.8 a 2.2) via transform: scale().

type Scales = Record<number, number>;

const GlyphScaleContext = createContext<Scales>({});

export function useGlyphScale(id: number): number {
  const scales = useContext(GlyphScaleContext);
  return scales[id] ?? 1;
}

export function GlyphScaleProvider({ children }: { children: React.ReactNode }) {
  const [scales, setScales] = useState<Scales>({});

  useEffect(() => {
    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      // com next/font o nome real da familia e gerado; le-se do computed
      // style de uma sonda que usa a variavel CSS
      const probe = document.createElement("span");
      probe.style.fontFamily = "var(--font-runic), 'Noto Sans Runic', serif";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      probe.textContent = "ᚠ";
      document.body.appendChild(probe);
      const family = getComputedStyle(probe).fontFamily;
      document.body.removeChild(probe);

      const cv = document.createElement("canvas");
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.font = `100px ${family}`;

      const inkOf = (g: string) => {
        const m = ctx.measureText(g);
        const h = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
        const w = (m.actualBoundingBoxRight || 0) + (m.actualBoundingBoxLeft || 0);
        return Math.max(h, w * 0.9);
      };

      const inks = Object.keys(GLYPH).map((k) => ({
        id: Number(k),
        ink: inkOf(GLYPH[Number(k)]),
      }));
      const valid = inks.filter((x) => x.ink > 5);
      if (!valid.length) return;
      const sorted = valid.map((x) => x.ink).sort((a, b) => a - b);
      const target = sorted[Math.floor(valid.length / 2)];
      const next: Scales = {};
      valid.forEach((x) => {
        next[x.id] = Math.min(2.2, Math.max(0.8, target / x.ink));
      });
      if (!cancelled) setScales(next);
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    } else {
      measure();
    }
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <GlyphScaleContext.Provider value={scales}>{children}</GlyphScaleContext.Provider>
  );
}
