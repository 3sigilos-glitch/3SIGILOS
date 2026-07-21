"use client";

import { useState } from "react";
import { RUNES } from "@/lib/runes";
import { elemsOf } from "@/lib/rules";
import { CANDLE } from "@/lib/maps";
import { GLYPH } from "@/lib/glyphs";
import { SHAPE_NAME, shieldGeometry } from "@/lib/temple";
import { useGlyphScale } from "@/components/GlyphScales";
import Glyph from "@/components/Glyph";
import { RunicDivider, ScreenTitle, Vela } from "@/components/ui";

// Montador de Templo (handoff): tiles das 24 runas, escudo SVG 440x440
// com anéis tracejados a rodar, velas nos vértices e glifos no raio
// exterior; painel lateral com estado, velas necessárias e limpar.
export default function TemploPage() {
  const [sel, setSel] = useState<number[]>([]);

  const toggle = (id: number) =>
    setSel((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 9 ? s : [...s, id]
    );

  const n = sel.length;
  const geo = n >= 2 ? shieldGeometry(n) : null;

  const velaCount: Record<string, number> = {};
  sel.forEach((id) => {
    const el = elemsOf(RUNES[id])[0];
    velaCount[el] = (velaCount[el] || 0) + 1;
  });

  return (
    <section className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <ScreenTitle title="Montador de Templo">
          Escolhe de 2 a 9 runas para intensificar. O escudo e as cores das velas saem
          automaticamente: 2 linha, 3 triângulo, 4 quadrado, 5 pentagrama, 6 estrela de
          seis, 7 a 9 estrelas maiores.
        </ScreenTitle>
        <RunicDivider runes="ᛟᚦᛖᛚ" />
      </div>

      {/* tiles das 24 runas (o Wyrd congrega, não entra no escudo) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(66px,1fr))", gap: 6 }}>
        {RUNES.slice(0, 24).map((r) => {
          const on = sel.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              aria-pressed={on}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "9px 4px",
                borderRadius: 5,
                fontFamily: "inherit",
                border: "1px solid " + (on ? "var(--gold)" : "var(--border-card)"),
                background: on ? "rgba(201,168,106,0.1)" : "var(--surface)",
                color: on ? "var(--gold-light)" : "var(--text-2)",
                transition: "all .15s",
              }}
            >
              <Glyph id={r.id} size={22} color="currentColor" origin="center bottom" />
              <span style={{ fontSize: 12, letterSpacing: 0.5 }}>{r.ed}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* escudo */}
        <div
          style={{
            flex: "1 1 340px",
            maxWidth: 480,
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--panel)",
            padding: 10,
          }}
        >
          <svg viewBox="0 0 440 440" style={{ width: "100%", display: "block" }}>
            <g style={{ transformOrigin: "220px 220px", animation: "spinSlow 120s linear infinite" }}>
              <circle cx={220} cy={220} r={196} fill="none" stroke="#3b3450" strokeWidth={1} strokeDasharray="2 7" />
              <circle cx={220} cy={220} r={204} fill="none" stroke="#262233" strokeWidth={1} strokeDasharray="1 12" />
            </g>
            <g style={{ transformOrigin: "220px 220px", animation: "spinSlow 180s linear infinite reverse" }}>
              <circle cx={220} cy={220} r={152} fill="none" stroke="#2a2536" strokeWidth={1} strokeDasharray="4 10" />
            </g>
            {geo && (
              <>
                <path
                  d={geo.path}
                  fill="rgba(201,168,106,0.07)"
                  stroke="#c9a86a"
                  strokeWidth={1.5}
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 7px rgba(201,168,106,0.55))" }}
                />
                {geo.pts.map((p, i) => (
                  <ShieldVertex key={sel[i]} runeId={sel[i]} p={p} />
                ))}
              </>
            )}
          </svg>
        </div>

        {/* painel lateral */}
        <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            className="font-cinzel"
            style={{ fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold-light)" }}
          >
            {n < 2 ? "Escolhe pelo menos 2 runas" : `${n} runas · ${SHAPE_NAME[n]}`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {Object.entries(velaCount).map(([el, c]) => (
              <div key={el} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Vela color={CANDLE[el as keyof typeof CANDLE]} size={10} />
                <span style={{ fontSize: 16, color: "var(--text-warm)" }}>
                  {(c > 1 ? c + "× " : "") + "vela " + el.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setSel([])}
            style={{
              alignSelf: "flex-start",
              background: "none",
              border: "1px solid var(--border-chip)",
              borderRadius: 999,
              color: "var(--text-2)",
              fontSize: 14,
              padding: "6px 16px",
              marginTop: 6,
            }}
          >
            limpar escolha
          </button>
        </div>
      </div>
    </section>
  );
}

function ShieldVertex({
  runeId,
  p,
}: {
  runeId: number;
  p: { x: number; y: number; tx: number; ty: number };
}) {
  const scale = useGlyphScale(runeId);
  const r = RUNES[runeId];
  const vela = CANDLE[elemsOf(r)[0]];
  return (
    <>
      <circle
        cx={p.x.toFixed(1)}
        cy={p.y.toFixed(1)}
        r={7}
        fill={vela}
        stroke="#0e0d13"
        strokeWidth={1.5}
        className="flicker-3"
        style={{ filter: `drop-shadow(0 0 5px ${vela})` }}
      />
      <text
        x={p.tx.toFixed(1)}
        y={p.ty.toFixed(1)}
        textAnchor="middle"
        fill="#c9a86a"
        fontSize={(17 * scale).toFixed(1)}
        style={{ fontFamily: "var(--font-runic), 'Noto Sans Runic', serif" }}
      >
        {GLYPH[runeId]}
      </text>
    </>
  );
}
