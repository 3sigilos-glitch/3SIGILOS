"use client";

import { useState } from "react";
import { RUNES, runeById } from "@/lib/runes";
import { INTENTS } from "@/lib/elements";
import {
  buildEvocation,
  DETERM,
  EVOCATION_TYPES,
  MUDRAS,
  NEEDS_REGENTE,
  PROC,
} from "@/lib/evocations";
import type { EvocationType } from "@/lib/types";
import { Chip, RunicDivider, ScreenTitle, SectionTitle } from "@/components/ui";
import { useModal } from "@/components/Modal";
import { useAppStore } from "@/components/StoreProvider";

// Ecrã Altar (handoff): procedimento em checklist, visão geral filtrável,
// evocações com chips de tipo e select de regente, determinações e mudras
// em grelha de cartões.
export default function AltarPage() {
  return (
    <section className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 36 }}>
      <div>
        <ScreenTitle title="Altar">Modo prática. Pouca luz, texto grande, um fio condutor.</ScreenTitle>
        <RunicDivider runes="ᛏᛁᛊ" />
      </div>
      <Procedimento />
      <VisaoGeral />
      <Evocacoes />
      <CardsGrid
        title="Determinações"
        sub="O que pedir depois de ativar. Versões resumidas, adapta às tuas palavras."
        items={DETERM.map((d) => ({ t: d.t, b: d.x + " Que assim seja!" }))}
      />
      <CardsGrid
        title="Mudras"
        sub="Referência rápida."
        items={MUDRAS.map((m) => ({ t: m.n, b: m.p }))}
      />
    </section>
  );
}

/* ------------- procedimento ------------- */

function Procedimento() {
  const { store, toggleStep } = useAppStore();

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 22,
        background: "var(--panel)",
      }}
    >
      <SectionTitle
        title="Procedimento de Atendimento"
        sub="A sequência de proteção antes de atender. Toca em cada passo para marcar."
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {PROC.map((text, i) => {
          const done = !!store.steps[i];
          return (
            <button
              key={i}
              onClick={() => toggleStep(i)}
              aria-pressed={done}
              style={{
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                background: done ? "rgba(201,168,106,0.07)" : "transparent",
                border: "1px solid " + (done ? "#4a3f2a" : "var(--border)"),
                borderRadius: 5,
                padding: "11px 14px",
                color: done ? "var(--text-3)" : "var(--text-warm)",
                textDecoration: done ? "line-through" : "none",
                fontFamily: "inherit",
                width: "100%",
              }}
            >
              <span
                className="font-cinzel"
                style={{
                  fontSize: 13,
                  color: done ? "var(--gold)" : "var(--text-4)",
                  border: "1px solid " + (done ? "var(--gold)" : "var(--border-chip)"),
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <span style={{ textAlign: "left", fontSize: 17.5, lineHeight: 1.45 }}>{text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------- visão geral ------------- */

function VisaoGeral() {
  const modal = useModal();
  const [intent, setIntent] = useState<string | null>(null);
  const shown = RUNES.filter((r) => !intent || r.intent.includes(intent));

  return (
    <div>
      <SectionTitle
        title="Visão geral"
        sub="Runa, regente, arma e ser, com as qualidades de cada. Filtra pelo que precisas e toca para abrir a ficha."
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        <Chip active={!intent} onClick={() => setIntent(null)}>
          Tudo
        </Chip>
        {INTENTS.map((i) => (
          <Chip key={i} active={intent === i} onClick={() => setIntent(i)}>
            {i}
          </Chip>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {shown.map((r) => {
          const extra = [
            r.weapons.length > 0 && "Arma: " + r.weapons.join(" · "),
            r.being && "Ser: " + r.being,
          ]
            .filter(Boolean)
            .join("  ·  ");
          return (
            <button
              key={r.id}
              onClick={() => modal.openRune(r.id)}
              className="cell-hover"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border-card)",
                borderRadius: 5,
                padding: "13px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                color: "inherit",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span
                  className="font-cinzel"
                  style={{ fontSize: 17, letterSpacing: 1, color: "var(--text-strong)" }}
                >
                  {r.ed} · {r.deity}
                </span>
                <span style={{ fontSize: 14, color: "var(--gold)", fontStyle: "italic" }}>
                  {r.intent.join(" · ")}
                </span>
              </span>
              <span style={{ fontSize: 15.5, color: "var(--text-2)" }}>{r.kw.join(", ")}</span>
              {extra && <span style={{ fontSize: 14, color: "var(--blue)" }}>{extra}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------- evocações ------------- */

function Evocacoes() {
  const [tipo, setTipo] = useState<EvocationType>("Poder Divino específico");
  const [runeId, setRuneId] = useState(0);
  const r = runeById(runeId)!;
  const needsReg = NEEDS_REGENTE.includes(tipo);

  const missing =
    (tipo === "Invocar Arma" && r.weapons.length === 0) ||
    (tipo === "Sumonar Ser" && !r.being);
  const segments = buildEvocation(tipo, r);
  const note = needsReg
    ? "Regente: " +
      r.deity +
      " · runa " +
      r.ed +
      (r.weapons.length ? " · arma " + r.weapons.join(" · ") : "") +
      (r.being ? " · ser " + r.being : "")
    : "Fórmula fixa, não precisa de regente.";

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 22,
        background: "var(--panel)",
      }}
    >
      <SectionTitle title="Evocações" sub="Escolhe o tipo e o regente. A fórmula sai preenchida." />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {EVOCATION_TYPES.map((t) => (
          <Chip key={t} active={tipo === t} onClick={() => setTipo(t)}>
            {t}
          </Chip>
        ))}
      </div>
      {needsReg && (
        <label
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}
        >
          <span
            className="font-cinzel"
            style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-4)" }}
          >
            Regente
          </span>
          <select
            value={runeId}
            onChange={(e) => setRuneId(Number(e.target.value))}
            style={{
              fontFamily: "inherit",
              fontSize: 16,
              background: "var(--surface)",
              color: "var(--text-strong)",
              border: "1px solid var(--border-chip)",
              borderRadius: 4,
              padding: "7px 10px",
            }}
          >
            {RUNES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.deity} · {x.ed}
              </option>
            ))}
          </select>
        </label>
      )}
      <blockquote
        style={{
          margin: 0,
          borderLeft: "2px solid var(--gold)",
          padding: "14px 18px",
          background: "rgba(201,168,106,0.05)",
          fontSize: 18,
          lineHeight: 1.6,
          fontStyle: "italic",
          color: "var(--text-warm)",
        }}
      >
        {missing ? (
          tipo === "Invocar Arma"
            ? "Este regente não tem arma associada. Escolhe outro regente."
            : "Este regente não tem ser associado. Escolhe outro regente."
        ) : (
          segments.map((s, i) =>
            s.fill ? (
              <b key={i} style={{ color: "var(--gold-light)", fontStyle: "normal" }}>
                {s.text}
              </b>
            ) : (
              <span key={i}>{s.text}</span>
            )
          )
        )}
      </blockquote>
      <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--text-4)" }}>{note}</p>
    </div>
  );
}

/* ------------- determinações e mudras ------------- */

function CardsGrid({
  title,
  sub,
  items,
}: {
  title: string;
  sub: string;
  items: { t: string; b: string }[];
}) {
  return (
    <div>
      <SectionTitle title={title} sub={sub} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 10 }}>
        {items.map((d) => (
          <div
            key={d.t}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-card)",
              borderRadius: 5,
              padding: "16px 18px",
            }}
          >
            <div
              className="font-cinzel"
              style={{ fontSize: 15, letterSpacing: 1.5, color: "var(--gold-light)", marginBottom: 8 }}
            >
              {d.t}
            </div>
            <div style={{ fontSize: 15.5, lineHeight: 1.55, color: "var(--text-body2)", textWrap: "pretty" }}>
              {d.b}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
