"use client";

import { RUNES, runeById } from "@/lib/runes";
import RuneCard from "@/components/RuneCard";
import Glyph from "@/components/Glyph";
import { ScreenTitle, SectionTitle } from "@/components/ui";
import { useModal } from "@/components/Modal";
import { useAppStore } from "@/components/StoreProvider";

// Guardados (handoff): os mesmos cartões da tab Runas, filtrados aos
// favoritos; vazio com caixa tracejada. As notas pessoais mantêm-se
// listadas abaixo, na mesma linguagem visual.
export default function GuardadosPage() {
  const { store, ready } = useAppStore();
  const modal = useModal();

  const favs = RUNES.filter((r) => store.favs[r.id]);
  const noted = Object.keys(store.notes)
    .map(Number)
    .map((id) => ({ rune: runeById(id), text: store.notes[id] }))
    .filter((x): x is { rune: (typeof RUNES)[number]; text: string } => !!x.rune);

  return (
    <section className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <ScreenTitle title="Guardados">
        As runas que marcaste com ★. Ficam guardadas neste dispositivo.
      </ScreenTitle>

      {ready && favs.length === 0 ? (
        <div
          style={{
            border: "1px dashed var(--border-chip)",
            borderRadius: 6,
            padding: 40,
            textAlign: "center",
            color: "var(--text-4)",
            fontStyle: "italic",
          }}
        >
          Ainda não guardaste nenhuma runa. Abre uma ficha e toca em ★.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(185px,1fr))", gap: 10 }}>
          {favs.map((r) => (
            <RuneCard key={r.id} rune={r} />
          ))}
        </div>
      )}

      {noted.length > 0 && (
        <div>
          <SectionTitle title="As minhas notas" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {noted.map(({ rune, text }) => (
              <button
                key={rune.id}
                onClick={() => modal.openRune(rune.id)}
                className="cell-hover"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border-card)",
                  borderRadius: 5,
                  padding: "13px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  color: "inherit",
                  textAlign: "left",
                }}
              >
                <Glyph id={rune.id} size={26} origin="left top" />
                <span>
                  <span
                    className="font-cinzel"
                    style={{ display: "block", fontSize: 16, letterSpacing: 1, color: "var(--text-strong)" }}
                  >
                    {rune.ed}{" "}
                    <span
                      style={{
                        fontFamily: "var(--font-garamond)",
                        fontStyle: "italic",
                        fontSize: 14,
                        color: "var(--text-3)",
                        letterSpacing: 0,
                        textTransform: "none",
                      }}
                    >
                      {rune.mod} · {rune.deity}
                    </span>
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 15.5,
                      lineHeight: 1.5,
                      color: "var(--text-body2)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {text}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
