"use client";

import { RUNES } from "@/lib/runes";
import { ELEMENTS, POLES } from "@/lib/elements";
import { elemsOf } from "@/lib/rules";
import { accentOf, classColorOf, POLE_CLASS } from "@/lib/maps";
import type { ElementName, Pole, Rune } from "@/lib/types";
import RuneGlyph from "@/components/RuneGlyph";
import { useEnv } from "@/components/EnvContext";
import { useSheet } from "@/components/Sheet";

// A espinha dorsal do sistema: 9 linhas (elementos) x 3 colunas (pólos).
// Cada célula mostra o regente dessa combinação. O Odin, tríade, ocupa as
// três células que faltam (Cristalino-Neutro, Vazio-Irradiador,
// Temporal-Absorvedor) e é por isso que a matriz fecha certa.
function cellRune(elem: ElementName, pole: Pole): Rune | undefined {
  const direct = RUNES.find((r) => r.elem === elem && r.pole === pole);
  if (direct) return direct;
  const odin = RUNES[24];
  if (elemsOf(odin).includes(elem)) return odin;
  return undefined;
}

export default function MatrizPage() {
  const env = useEnv();
  const sheet = useSheet();

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold" style={{ color: "var(--ink)" }}>
        Matriz 9×3
      </h1>
      <p className="mb-4 text-[15px] leading-[1.55]" style={{ color: "var(--muted)" }}>
        Elemento (linha) dá a cor da vela; pólo (coluna) dá a classe. Toca numa célula para
        abrir a ficha.
      </p>

      {/* cabeçalho das colunas */}
      <div className="grid grid-cols-[84px_1fr_1fr_1fr] gap-1.5 sm:grid-cols-[110px_1fr_1fr_1fr]">
        <div />
        {POLES.map((p) => (
          <div key={p} className="pb-1 text-center">
            <div className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
              {p}
            </div>
            <div
              className="mt-0.5 inline-flex items-center gap-1 text-[13px]"
              style={{ color: "var(--muted)" }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ background: classColorOf(POLE_CLASS[p], env), border: "1px solid var(--ring)" }}
              />
              {POLE_CLASS[p]}
            </div>
          </div>
        ))}

        {ELEMENTS.map((e) => (
          <RowFor key={e.n} elemName={e.n} />
        ))}
      </div>
    </div>
  );

  function RowFor({ elemName }: { elemName: (typeof ELEMENTS)[number]["n"] }) {
    return (
      <>
        {/* etiqueta da linha, com a cor do elemento à esquerda */}
        <div className="flex items-center gap-1.5 py-1">
          <span
            className="h-full min-h-[44px] w-1.5 rounded-full"
            style={{ background: accentOf(elemName, env), border: "1px solid var(--ring)" }}
            aria-hidden
          />
          <span className="text-[13px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {elemName}
          </span>
        </div>
        {POLES.map((p) => {
          const r = cellRune(elemName, p);
          if (!r)
            return <div key={p} className="rounded-xl border" style={{ borderColor: "var(--line)" }} />;
          const isOdin = r.id === 24;
          return (
            <button
              key={p}
              onClick={() => sheet.openRune(r.id)}
              className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-2 text-center"
              style={{
                borderColor: isOdin ? classColorOf("Híbrido", env) : "var(--line)",
                background: "var(--card)",
              }}
            >
              <RuneGlyph id={r.id} className="h-[30px] w-[18px]" />
              <span className="text-[13px] font-medium leading-tight" style={{ color: "var(--ink)" }}>
                {r.deity}
              </span>
              <span className="text-[13px] leading-tight" style={{ color: "var(--muted)" }}>
                {r.ed}
              </span>
            </button>
          );
        })}
      </>
    );
  }
}
