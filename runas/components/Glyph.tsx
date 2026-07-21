"use client";

import type { CSSProperties } from "react";
import { GLYPH } from "@/lib/glyphs";
import { useGlyphScale } from "./GlyphScales";

// Glifo runico em Noto Sans Runic, com a escala normalizada aplicada.
export default function Glyph({
  id,
  size,
  color = "var(--gold)",
  origin = "left center",
  glow = false,
  className = "",
  style,
}: {
  id: number;
  size: number;
  color?: string;
  /** transform-origin do scale (cartoes: left center; matriz/tiles: center) */
  origin?: string;
  /** text-shadow dourado dos cartoes */
  glow?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const scale = useGlyphScale(id);
  return (
    <span
      aria-hidden
      className={`font-runic ${className}`}
      style={{
        fontSize: size,
        lineHeight: 1,
        color,
        display: "inline-block",
        transform: `scale(${scale})`,
        transformOrigin: origin,
        textShadow: glow ? "0 0 18px rgba(201,168,106,0.35)" : undefined,
        ...style,
      }}
    >
      {GLYPH[id]}
    </span>
  );
}
