"use client";

import type { Rune } from "@/lib/types";
import { classOf, elemsOf } from "@/lib/rules";
import { CANDLE, CLASS_COLOR } from "@/lib/maps";
import { GLYPH } from "@/lib/glyphs";
import Glyph from "./Glyph";
import { ClassSquare, Vela } from "./ui";
import { useModal } from "./Modal";
import { useAppStore } from "./StoreProvider";

// Cartão da runa (handoff): glifo dourado com glow, glifo marca-de-água,
// nome Eduardo em Cinzel, nome moderno em itálico, regente e vela+classe.
export default function RuneCard({ rune }: { rune: Rune }) {
  const modal = useModal();
  const { store } = useAppStore();
  const cls = classOf(rune);
  const elems = elemsOf(rune);
  const fav = !!store.favs[rune.id];

  return (
    <div
      onClick={() => modal.openRune(rune.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          modal.openRune(rune.id);
        }
      }}
      className="card-hover"
      style={{
        cursor: "pointer",
        background: "var(--surface)",
        border: "1px solid var(--border-card)",
        borderRadius: 5,
        padding: "16px 16px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 130,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* glifo marca-de-água */}
      <span
        aria-hidden
        className="font-runic"
        style={{
          position: "absolute",
          right: -6,
          bottom: -22,
          fontSize: 96,
          lineHeight: 1,
          color: "rgba(201,168,106,0.055)",
          pointerEvents: "none",
        }}
      >
        {GLYPH[rune.id]}
      </span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Glyph id={rune.id} size={32} glow origin="left center" />
        <span style={{ color: "var(--gold)", fontSize: 15 }}>{fav ? "★" : ""}</span>
      </div>
      <div>
        <div className="font-cinzel" style={{ fontSize: 19, letterSpacing: 1, color: "var(--text-strong)" }}>
          {rune.ed}
        </div>
        <div style={{ fontStyle: "italic", color: "var(--text-3)", fontSize: 14 }}>{rune.mod}</div>
      </div>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", gap: 8 }}
      >
        <span style={{ fontSize: 14.5, color: "#bdb7c9" }}>{rune.deity}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <Vela color={CANDLE[elems[0]]} />
          <ClassSquare color={CLASS_COLOR[cls]} title={cls} />
        </span>
      </div>
    </div>
  );
}
