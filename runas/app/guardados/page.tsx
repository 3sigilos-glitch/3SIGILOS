"use client";

import { NotebookPen, Star } from "lucide-react";
import { RUNES, runeById } from "@/lib/runes";
import RuneCard from "@/components/RuneCard";
import RuneGlyph from "@/components/RuneGlyph";
import { Lab } from "@/components/bits";
import { useSheet } from "@/components/Sheet";
import { useAppStore } from "@/components/StoreProvider";

// Guardados: favoritos e notas pessoais, persistentes neste dispositivo.

export default function GuardadosPage() {
  const { store, ready } = useAppStore();
  const sheet = useSheet();

  const favs = RUNES.filter((r) => store.favs[r.id]);
  const noted = Object.keys(store.notes)
    .map(Number)
    .map((id) => ({ rune: runeById(id), text: store.notes[id] }))
    .filter((x): x is { rune: NonNullable<ReturnType<typeof runeById>>; text: string } => !!x.rune);

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold" style={{ color: "var(--ink)" }}>
        Guardados
      </h1>
      <p className="mb-4 text-[15px]" style={{ color: "var(--muted)" }}>
        Favoritos e notas ficam guardados neste dispositivo.
      </p>

      <section className="mb-6">
        <Lab>
          <span className="inline-flex items-center gap-1.5">
            <Star size={14} /> Favoritos
          </span>
        </Lab>
        {ready && favs.length === 0 ? (
          <p className="rounded-2xl border px-4 py-6 text-center text-[16px]" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            Ainda não tens favoritos. Toca na estrela de qualquer runa para a guardar aqui.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {favs.map((r) => (
              <RuneCard key={r.id} rune={r} />
            ))}
          </div>
        )}
      </section>

      <section>
        <Lab>
          <span className="inline-flex items-center gap-1.5">
            <NotebookPen size={14} /> As minhas notas
          </span>
        </Lab>
        {ready && noted.length === 0 ? (
          <p className="rounded-2xl border px-4 py-6 text-center text-[16px]" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
            Sem notas por agora. Abre a ficha de uma runa e escreve no campo de notas.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {noted.map(({ rune, text }) => (
              <button
                key={rune.id}
                onClick={() => sheet.openRune(rune.id)}
                className="flex w-full items-start gap-3 rounded-2xl border p-4 text-left"
                style={{ borderColor: "var(--line)", background: "var(--card)" }}
              >
                <RuneGlyph id={rune.id} className="h-[46px] w-[26px] shrink-0" />
                <span>
                  <b className="font-display text-[18px] font-semibold" style={{ color: "var(--ink)" }}>
                    {rune.ed}
                  </b>
                  <span className="ml-2 text-[13px]" style={{ color: "var(--muted)" }}>
                    {rune.mod} · {rune.deity}
                  </span>
                  <span className="mt-1 block whitespace-pre-wrap text-[16px] leading-[1.55]" style={{ color: "var(--ink)" }}>
                    {text}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
