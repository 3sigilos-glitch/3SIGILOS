"use client";

import type { ClassName, ElementName } from "@/lib/types";
import { accentOf, classColorOf, ELEMENT_NEEDS_RING } from "@/lib/maps";
import { useEnv } from "./EnvContext";

/** Ponto redondo com a cor da vela (elemento). Com anel quando a cor se confunde com o fundo. */
export function VelaDot({ elem, size = 13 }: { elem: ElementName; size?: number }) {
  const env = useEnv();
  return (
    <span
      className="vela"
      title={`Vela ${elem}`}
      style={{
        width: size,
        height: size,
        background: accentOf(elem, env),
        borderColor: ELEMENT_NEEDS_RING[elem] ? "var(--ring)" : "transparent",
      }}
    />
  );
}

/** Etiqueta da classe com o quadrado da sua cor. A cor nunca é a única pista. */
export function ClassBadge({ cls }: { cls: ClassName }) {
  const env = useEnv();
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--muted)" }}>
      <span
        className="inline-block h-3 w-3 rounded-[3px]"
        style={{ background: classColorOf(cls, env), border: "1px solid var(--ring)" }}
      />
      {cls}
    </span>
  );
}

/** Rótulo de secção pequeno, nunca abaixo de 13px. */
export function Lab({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.12em]"
      style={{ color: "var(--accent)" }}
    >
      {children}
    </div>
  );
}
