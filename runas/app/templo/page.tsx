"use client";

import { useState } from "react";
import { RUNES } from "@/lib/runes";
import { ELEMENTS } from "@/lib/elements";
import { elemsOf } from "@/lib/rules";
import { accentOf, ELEMENT_NEEDS_RING } from "@/lib/maps";
import { templeShape } from "@/lib/temple";
import RuneGlyph from "@/components/RuneGlyph";
import { VelaDot } from "@/components/bits";
import { useEnv } from "@/components/EnvContext";
import { useSheet } from "@/components/Sheet";

// Montador de Templo: escolhe de 2 a 9 runas para intensificar e a app
// desenha o escudo de geometria sagrada com a cor da vela em cada vértice
// e o cálice ao centro (lógica templeShape do protótipo).

export default function TemploPage() {
  const env = useEnv();
  const sheet = useSheet();
  const [sel, setSel] = useState<number[]>([]);

  const toggle = (id: number) =>
    setSel((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length >= 9 ? s : [...s, id]
    );

  const ids = sel.slice(0, 9);
  const W = 340;
  const cx = 170;
  const cy = 170;
  const Rout = 150;
  const Rin = 110;
  const sh = ids.length >= 2 ? templeShape(ids.length, cx, cy, Rin) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[30px] font-semibold" style={{ color: "var(--ink)" }}>
        Montador de Templo
      </h1>
      <p className="mb-4 text-[15px] leading-[1.6]" style={{ color: "var(--muted)" }}>
        Escolhe de 2 a 9 runas para intensificar. O escudo e as cores das velas saem
        automaticamente: 2 linha, 3 triângulo, 4 quadrado, 5 pentagrama, 6 estrela de seis,
        7 a 9 estrelas maiores.
      </p>

      {/* seletor de runas (as 24; o Wyrd congrega, não entra no escudo) */}
      <div className="mb-4 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {RUNES.slice(0, 24).map((r) => {
          const on = sel.includes(r.id);
          return (
            <button
              key={r.id}
              onClick={() => toggle(r.id)}
              aria-pressed={on}
              className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2"
              style={
                on
                  ? { borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 12%, transparent)" }
                  : { borderColor: "var(--line)", background: "var(--card)" }
              }
            >
              <RuneGlyph id={r.id} className="h-[32px] w-[18px]" />
              <small className="text-[13px]" style={{ color: on ? "var(--ink)" : "var(--muted)" }}>
                {r.ed}
              </small>
            </button>
          );
        })}
      </div>

      {/* palco do escudo */}
      <div
        className="rounded-2xl border p-3"
        style={{
          borderColor: "var(--line)",
          background: "radial-gradient(80% 80% at 50% 40%, var(--panel), var(--bg))",
        }}
      >
        {!sh ? (
          <p className="px-4 py-10 text-center text-[16px] leading-[1.6]" style={{ color: "var(--muted)" }}>
            Escolhe pelo menos 2 runas para desenhar o escudo.
          </p>
        ) : (
          <svg viewBox={`0 0 ${W} ${W}`} className="mx-auto block w-full max-w-[380px]">
            {/* anel duplo do templo */}
            <circle cx={cx} cy={cy} r={Rout} fill="none" stroke="var(--line)" strokeWidth="1.6" />
            <circle cx={cx} cy={cy} r={Rout - 8} fill="none" stroke="var(--line)" strokeWidth="1" />
            {/* geometria sagrada */}
            {sh.paths.map((p, i) => (
              <polyline
                key={i}
                points={p.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(" ")}
                fill="none"
                stroke="var(--ink)"
                strokeWidth="1.4"
                opacity="0.7"
              />
            ))}
            {/* cálice ao centro */}
            <circle cx={cx} cy={cy} r={20} fill="var(--bg)" stroke="var(--accent)" strokeWidth="1.4" />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontSize="12"
              fill="var(--accent)"
              className="font-display"
            >
              cálice
            </text>
            {/* velas nos vértices, com o tremular de chama */}
            {sh.pts.map((p, i) => {
              const r = RUNES[ids[i]];
              const elem = elemsOf(r)[0];
              const col = accentOf(elem, env);
              return (
                <g key={r.id} className="flame" style={{ transformOrigin: `${p[0]}px ${p[1]}px` }}>
                  <circle
                    cx={p[0].toFixed(1)}
                    cy={p[1].toFixed(1)}
                    r={13}
                    fill={col}
                    stroke={ELEMENT_NEEDS_RING[elem] ? "var(--ring)" : "rgba(240,178,74,.55)"}
                    strokeWidth="1.6"
                    style={{ filter: "drop-shadow(0 0 6px rgba(240,178,74,.35))" }}
                  />
                  <text
                    x={p[0].toFixed(1)}
                    y={(p[1] + 30).toFixed(1)}
                    textAnchor="middle"
                    fontSize="13"
                    fill="var(--ink)"
                    className="font-display"
                  >
                    {r.ed}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* lista das runas escolhidas */}
      {ids.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {ids.map((id) => {
            const r = RUNES[id];
            const elem = elemsOf(r)[0];
            const corNome = ELEMENTS.find((e) => e.n === elem)?.cor.toLowerCase() ?? "";
            return (
              <li key={id}>
                <button
                  onClick={() => sheet.openRune(id)}
                  className="flex w-full min-h-[48px] items-center gap-3 border-b border-dashed pb-1.5 text-left text-[15px]"
                  style={{ borderColor: "var(--line)" }}
                >
                  <VelaDot elem={elem} />
                  <b className="font-display text-[17px]" style={{ color: "var(--ink)" }}>
                    {r.ed}
                  </b>
                  <span style={{ color: "var(--muted)" }}>
                    {r.mod} · vela {corNome}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
