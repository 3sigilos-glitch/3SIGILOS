"use client";

import { Star } from "lucide-react";
import type { Rune } from "@/lib/types";
import { classOf, elemsOf } from "@/lib/rules";
import { accentOf } from "@/lib/maps";
import RuneGlyph from "./RuneGlyph";
import { ClassBadge, VelaDot } from "./bits";
import { useEnv } from "./EnvContext";
import { useSheet } from "./Sheet";
import { useAppStore } from "./StoreProvider";

// Cartão da runa: lombada da cor do elemento à esquerda, runa gravada,
// os dois nomes (o do Eduardo em destaque), regente, vela(s) e classe.
export default function RuneCard({ rune }: { rune: Rune }) {
  const env = useEnv();
  const sheet = useSheet();
  const { store, toggleFav } = useAppStore();
  const cls = classOf(rune);
  const elems = elemsOf(rune);
  const fav = !!store.favs[rune.id];

  return (
    <div
      className="relative overflow-hidden rounded-2xl border transition-transform hover:-translate-y-0.5"
      style={{
        borderColor: "var(--line)",
        background: "var(--card)",
        boxShadow: "0 1px 2px rgba(35,32,27,.06)",
      }}
    >
      <span
        className="spine"
        style={{
          background:
            rune.elem === "Tríade"
              ? `linear-gradient(${accentOf("Cristalino", env)} 0%, ${accentOf("Cristalino", env)} 33%, ${accentOf("Vazio", env)} 33%, ${accentOf("Vazio", env)} 66%, ${accentOf("Temporal", env)} 66%)`
              : accentOf(elems[0], env),
        }}
        aria-hidden
      />
      <button
        onClick={() => sheet.openRune(rune.id)}
        className="block w-full pb-3 pl-5 pr-3 pt-3 text-left"
      >
        <RuneGlyph id={rune.id} className="mb-2 h-[52px] w-[30px]" />
        <div className="font-display text-[24px] font-semibold leading-none" style={{ color: "var(--ink)" }}>
          {rune.ed}
        </div>
        <div className="mt-0.5 text-[14px]" style={{ color: "var(--muted)" }}>
          {rune.mod}
        </div>
        <div className="mt-2 text-[14px] font-medium" style={{ color: "var(--ink)" }}>
          {rune.deity}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            {elems.map((e) => (
              <VelaDot key={e} elem={e} />
            ))}
          </span>
          <ClassBadge cls={cls} />
        </div>
      </button>
      <button
        onClick={() => toggleFav(rune.id)}
        aria-label={fav ? `Tirar ${rune.ed} dos favoritos` : `Adicionar ${rune.ed} aos favoritos`}
        aria-pressed={fav}
        className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ color: fav ? "var(--accent)" : "var(--muted)" }}
      >
        <Star size={20} fill={fav ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
