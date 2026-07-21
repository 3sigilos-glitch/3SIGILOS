"use client";

// Peças partilhadas do redesign: chip pill, vela, quadrado de classe,
// divisória rúnica e títulos.

import type { CSSProperties } from "react";

export function chipStyle(active: boolean): CSSProperties {
  return {
    fontFamily: "inherit",
    fontSize: "14px",
    padding: "5px 13px",
    borderRadius: "999px",
    border: "1px solid " + (active ? "var(--gold)" : "var(--border-chip)"),
    color: active ? "var(--gold-pale)" : "var(--text-2)",
    background: active ? "rgba(201,168,106,0.12)" : "transparent",
    transition: "all .15s",
  };
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} style={chipStyle(active)}>
      {children}
    </button>
  );
}

/** Ponto de vela com glow e tremular. */
export function Vela({
  color,
  size = 9,
  flicker = true,
}: {
  color: string;
  size?: number;
  flicker?: boolean;
}) {
  return (
    <span
      className={flicker ? "flicker" : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 7px ${color}`,
        flexShrink: 0,
        display: "inline-block",
      }}
    />
  );
}

/** Quadrado 8x8 da classe. */
export function ClassSquare({ color, title }: { color: string; title?: string }) {
  return (
    <span
      title={title}
      style={{ width: 8, height: 8, background: color, display: "inline-block", flexShrink: 0 }}
    />
  );
}

/** Divisória rúnica: linha gradiente dourada de cada lado de um futhark. */
export function RunicDivider({ runes = "ᚠᚢᚦᚨᚱᚲ" }: { runes?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 14 }}>
      <span
        style={{ height: 1, flex: 1, background: "linear-gradient(90deg,transparent,rgba(201,168,106,0.4))" }}
      />
      <span className="font-runic" style={{ color: "var(--gold)", fontSize: 14, letterSpacing: 8 }}>
        {runes}
      </span>
      <span
        style={{ height: 1, flex: 1, background: "linear-gradient(270deg,transparent,rgba(201,168,106,0.4))" }}
      />
    </div>
  );
}

/** H1 de ecrã (Cinzel 34px) + parágrafo explicativo. */
export function ScreenTitle({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h1
        className="font-cinzel"
        style={{ fontWeight: 500, fontSize: 34, margin: "0 0 6px", letterSpacing: 2, color: "var(--title)" }}
      >
        {title}
      </h1>
      {children && (
        <p style={{ margin: 0, color: "var(--text-2)", maxWidth: "62ch", textWrap: "pretty" }}>
          {children}
        </p>
      )}
    </div>
  );
}

/** H2 de secção (Cinzel 21px dourado claro) + sub. */
export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <h2
        className="font-cinzel"
        style={{ fontWeight: 500, fontSize: 21, margin: "0 0 4px", letterSpacing: 1.5, color: "var(--gold-light)" }}
      >
        {title}
      </h2>
      {sub && <p style={{ margin: "0 0 14px", color: "var(--text-2)", fontSize: 15 }}>{sub}</p>}
    </>
  );
}

/** Rótulo uppercase Cinzel 11px. */
export function Lab({ children, minWidth }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <span
      className="font-cinzel"
      style={{
        fontSize: 11,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: "var(--text-4)",
        minWidth,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}
