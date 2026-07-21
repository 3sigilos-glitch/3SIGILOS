"use client";

import { RUNES } from "@/lib/runes";
import { ELEMENTS, POLES } from "@/lib/elements";
import { elemsOf } from "@/lib/rules";
import { CANDLE, POLE_CLASS } from "@/lib/maps";
import type { ElementName, Pole, Rune } from "@/lib/types";
import Glyph from "@/components/Glyph";
import { ScreenTitle, Vela } from "@/components/ui";
import { useModal } from "@/components/Modal";

// Matriz 9x3 (handoff): grelha 110px + 3 colunas, células com border-top
// da cor da vela, scroll horizontal em mobile. O Odin (tríade) preenche
// as células de Cristalino-Neutro, Vazio-Irradiador e Temporal-Absorvedor.
function cellRune(elem: ElementName, pole: Pole): Rune | undefined {
  const direct = RUNES.find((r) => r.elem === elem && r.pole === pole);
  if (direct) return direct;
  const odin = RUNES[24];
  if (elemsOf(odin).includes(elem)) return odin;
  return undefined;
}

export default function MatrizPage() {
  const modal = useModal();

  return (
    <section className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <ScreenTitle title="Matriz 9×3">
        O elemento (linha) dá a cor da vela; o pólo (coluna) dá a classe. Toca numa célula
        para abrir a ficha.
      </ScreenTitle>

      <div style={{ overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "110px repeat(3,minmax(140px,1fr))",
            gap: 6,
            minWidth: 560,
          }}
        >
          <div />
          {POLES.map((p) => (
            <div key={p} style={{ textAlign: "center", padding: "8px 4px" }}>
              <div
                className="font-cinzel"
                style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)" }}
              >
                {p}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-4)", fontStyle: "italic" }}>
                {POLE_CLASS[p]}
              </div>
            </div>
          ))}

          {ELEMENTS.map((e) => (
            <Row key={e.n} elem={e.n} />
          ))}
        </div>
      </div>
    </section>
  );

  function Row({ elem }: { elem: ElementName }) {
    return (
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 4px" }}>
          <Vela color={CANDLE[elem]} flicker={false} />
          <span
            className="font-cinzel"
            style={{ fontSize: 12.5, letterSpacing: 1, color: "#bdb7c9" }}
          >
            {elem}
          </span>
        </div>
        {POLES.map((p) => {
          const r = cellRune(elem, p);
          if (!r) return <div key={p} />;
          return (
            <button
              key={p}
              onClick={() => modal.openRune(r.id)}
              className="cell-hover"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-card)",
                borderTop: `2px solid ${CANDLE[elem]}`,
                borderRadius: 5,
                padding: "10px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                color: "inherit",
              }}
            >
              <Glyph id={r.id} size={20} origin="center" />
              <span style={{ fontSize: 15, color: "var(--text-strong)" }}>{r.deity}</span>
              <span
                className="font-cinzel"
                style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-4)" }}
              >
                {r.ed}
              </span>
            </button>
          );
        })}
      </>
    );
  }
}
