"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Flame, RotateCcw } from "lucide-react";
import { RUNES, runeById } from "@/lib/runes";
import {
  buildEvocation,
  DETERM,
  EVOCATION_TYPES,
  MUDRAS,
  PROC,
} from "@/lib/evocations";
import type { EvocationType } from "@/lib/types";
import { useAppStore } from "@/components/StoreProvider";

// Modo Altar: escuro, à luz de velas. Texto grande (20 a 24px,
// entrelinha 1.6), pouca distração.

export default function AltarPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-[30px] font-semibold" style={{ color: "var(--ink)" }}>
        Altar
      </h1>
      <p className="mb-5 text-[15px] leading-[1.6]" style={{ color: "var(--muted)" }}>
        Modo prática. Pouca luz, texto grande, um fio condutor.
      </p>

      <Procedimento />
      <Evocacoes />
      <TemploLink />
      <Determinacoes />
      <Mudras />
    </div>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mb-4 rounded-2xl border p-4 sm:p-5"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <h2
        className="font-display text-[22px] font-semibold tracking-wide"
        style={{ color: "var(--ink)" }}
      >
        {title}
      </h2>
      {sub && (
        <p className="mt-0.5 text-[14px]" style={{ color: "var(--muted)" }}>
          {sub}
        </p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* ------------- procedimento: 8 passos para tocar e marcar ------------- */

function Procedimento() {
  const { store, toggleStep, resetSteps } = useAppStore();
  const done = PROC.filter((_, i) => store.steps[i]).length;

  return (
    <Section
      title="Procedimento de Atendimento"
      sub="A sequência de proteção antes de atender. Toca em cada passo para marcar."
    >
      <ol className="flex flex-col gap-2">
        {PROC.map((t, i) => {
          const on = !!store.steps[i];
          return (
            <li key={i}>
              <button
                onClick={() => toggleStep(i)}
                aria-pressed={on}
                className="flex w-full min-h-[56px] items-start gap-3 rounded-xl border px-4 py-3 text-left"
                style={{ borderColor: on ? "var(--accent)" : "var(--line)", background: "var(--card)" }}
              >
                <span
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-[16px] ${on ? "flame" : ""}`}
                  style={
                    on
                      ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--bg)" }
                      : { borderColor: "var(--line)", color: "var(--muted)" }
                  }
                >
                  {i + 1}
                </span>
                <span
                  className="text-[20px] leading-[1.6]"
                  style={{
                    color: on ? "var(--muted)" : "var(--ink)",
                    textDecoration: on ? "line-through" : "none",
                  }}
                >
                  {t}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {done > 0 && (
        <button
          onClick={resetSteps}
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-[15px]"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          <RotateCcw size={16} /> Recomeçar ({done}/{PROC.length})
        </button>
      )}
    </Section>
  );
}

/* ------------- evocações: tipo + regente, fórmula preenchida ------------- */

function Evocacoes() {
  const [tipo, setTipo] = useState<EvocationType>("Poder Divino específico");
  const [runeId, setRuneId] = useState(0);
  const r = runeById(runeId)!;
  const segments = buildEvocation(tipo, r);

  const selStyle = {
    borderColor: "var(--line)",
    background: "var(--card)",
    color: "var(--ink)",
  } as const;

  return (
    <Section title="Evocações" sub="Escolhe o tipo e o regente. A fórmula sai preenchida.">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value as EvocationType)}
          aria-label="Tipo de evocação"
          className="min-h-[48px] flex-1 rounded-xl border px-3 text-[16px]"
          style={selStyle}
        >
          {EVOCATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={runeId}
          onChange={(e) => setRuneId(Number(e.target.value))}
          aria-label="Regente"
          className="min-h-[48px] flex-1 rounded-xl border px-3 text-[16px]"
          style={selStyle}
        >
          {RUNES.map((x) => (
            <option key={x.id} value={x.id}>
              {x.deity} · {x.ed}
            </option>
          ))}
        </select>
      </div>
      <blockquote
        className="rounded-2xl border p-5 font-display text-[21px] leading-[1.6]"
        style={{
          borderColor: "var(--line)",
          background: "var(--bg)",
          color: "var(--ink)",
          boxShadow: "inset 0 0 40px rgba(0,0,0,.35)",
        }}
      >
        {segments.map((s, i) =>
          s.fill ? (
            <b key={i} className="flame font-semibold" style={{ color: "var(--accent)" }}>
              {s.text}
            </b>
          ) : (
            <span key={i}>{s.text}</span>
          )
        )}
      </blockquote>
    </Section>
  );
}

/* ------------- ligação ao montador ------------- */

function TemploLink() {
  return (
    <Link
      href="/templo"
      className="mb-4 flex min-h-[56px] items-center gap-3 rounded-2xl border px-4 py-3"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <Flame size={22} className="flame shrink-0" style={{ color: "var(--accent)" }} />
      <span className="text-[17px] font-medium" style={{ color: "var(--ink)" }}>
        Montador de Templo
      </span>
      <span className="ml-auto text-[14px]" style={{ color: "var(--muted)" }}>
        escolher runas →
      </span>
    </Link>
  );
}

/* ------------- determinações ------------- */

function Determinacoes() {
  return (
    <Section
      title="Determinações"
      sub="O que pedir depois de ativar. Versões resumidas, adapta às tuas palavras."
    >
      <div className="flex flex-col gap-2">
        {DETERM.map((d) => (
          <details
            key={d.t}
            className="group rounded-xl border"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <summary
              className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 py-3 font-display text-[19px] [&::-webkit-details-marker]:hidden"
              style={{ color: "var(--ink)" }}
            >
              {d.t}
              <ChevronDown
                size={20}
                className="shrink-0 transition-transform group-open:rotate-180"
                style={{ color: "var(--accent)" }}
              />
            </summary>
            <p className="px-4 pb-4 text-[20px] leading-[1.6]" style={{ color: "var(--ink)" }}>
              {d.x}{" "}
              <span className="font-display" style={{ color: "var(--accent)" }}>
                Que assim seja!
              </span>
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/* ------------- mudras ------------- */

function Mudras() {
  return (
    <Section title="Mudras" sub="Referência rápida.">
      <div className="grid gap-2 sm:grid-cols-2">
        {MUDRAS.map((m) => (
          <div
            key={m.n}
            className="rounded-xl border p-4"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <b className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
              {m.n}
            </b>
            <p className="mt-1 text-[17px] leading-[1.6]">{m.p}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
