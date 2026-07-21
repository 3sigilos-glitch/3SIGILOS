"use client";

import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import { RUNES } from "@/lib/runes";
import { WEAPONS } from "@/lib/weapons";
import { BEINGS } from "@/lib/beings";
import { CLASSES, ELEMENTS, INTENTS, POLES } from "@/lib/elements";
import { classOf, elemsOf, fold, searchText } from "@/lib/rules";
import { accentOf, classColorOf } from "@/lib/maps";
import type { ClassName, ElementName } from "@/lib/types";
import RuneCard from "@/components/RuneCard";
import RuneGlyph from "@/components/RuneGlyph";
import { VelaDot } from "@/components/bits";
import { useEnv } from "@/components/EnvContext";
import { useSheet } from "@/components/Sheet";
import { useAppStore } from "@/components/StoreProvider";

type SubTab = "runas" | "armas" | "seres" | "elementos";

const SUBTABS: { id: SubTab; label: string }[] = [
  { id: "runas", label: "Runas" },
  { id: "armas", label: "Armas" },
  { id: "seres", label: "Seres" },
  { id: "elementos", label: "Elementos" },
];

export default function RunasPage() {
  const [tab, setTab] = useState<SubTab>("runas");

  return (
    <div>
      <h1 className="font-display text-[30px] font-semibold" style={{ color: "var(--ink)" }}>
        Códice
      </h1>
      <p className="mb-3 text-[15px]" style={{ color: "var(--muted)" }}>
        Magia Nórdica · Módulo Branco
      </p>

      {/* segmented control */}
      <div
        role="tablist"
        aria-label="Secções do códice"
        className="mb-4 flex rounded-2xl border p-1"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        {SUBTABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className="min-h-[44px] flex-1 rounded-xl text-[15px] font-medium"
              style={
                on
                  ? { background: "var(--accent)", color: "var(--bg)" }
                  : { color: "var(--muted)" }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "runas" && <RunesTab />}
      {tab === "armas" && <WeaponsTab />}
      {tab === "seres" && <BeingsTab />}
      {tab === "elementos" && <ElementsTab />}
    </div>
  );
}

/* ---------------- Runas: pesquisa, filtros, grelha ---------------- */

function RunesTab() {
  const env = useEnv();
  const { store } = useAppStore();
  const [q, setQ] = useState("");
  const [classe, setClasse] = useState<ClassName | "">("");
  const [elem, setElem] = useState<ElementName | "">("");
  const [pole, setPole] = useState("");
  const [intents, setIntents] = useState<Record<string, boolean>>({});
  const [favOnly, setFavOnly] = useState(false);

  const activeIntents = Object.keys(intents).filter((k) => intents[k]);

  const shown = useMemo(() => {
    const nq = fold(q.trim());
    return RUNES.filter((r) => {
      if (classe && classOf(r) !== classe) return false;
      if (elem && !elemsOf(r).includes(elem)) return false;
      if (pole && r.pole !== pole) return false;
      if (activeIntents.length && !activeIntents.some((i) => r.intent.includes(i))) return false;
      if (nq && !fold(searchText(r)).includes(nq)) return false;
      if (favOnly && !store.favs[r.id]) return false;
      return true;
    });
  }, [q, classe, elem, pole, activeIntents, favOnly, store.favs]);

  const clear = () => {
    setQ("");
    setClasse("");
    setElem("");
    setPole("");
    setIntents({});
    setFavOnly(false);
  };

  const chipStyle = (on: boolean) =>
    on
      ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--bg)", fontWeight: 600 }
      : { borderColor: "var(--line)", color: "var(--muted)" };

  return (
    <div>
      {/* pesquisa fixa no topo do separador */}
      <div
        className="sticky top-0 z-30 -mx-4 px-4 py-2"
        style={{ background: "var(--bg)" }}
      >
        <label
          className="flex items-center gap-2 rounded-2xl border px-4 py-3"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <Search size={20} style={{ color: "var(--accent)" }} aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Procurar por nome (Feoh ou Fehu), regente ou palavra-chave"
            className="w-full bg-transparent text-[16px] outline-none"
            style={{ color: "var(--ink)" }}
            aria-label="Procurar runas"
          />
        </label>
      </div>

      {/* filtros */}
      <div className="mt-2 flex flex-col gap-2">
        <FilterRow label="Classe">
          {CLASSES.map((c) => (
            <button
              key={c}
              onClick={() => setClasse(classe === c ? "" : c)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[13px]"
              style={chipStyle(classe === c)}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ background: classColorOf(c, env), border: "1px solid var(--ring)" }}
              />
              {c}
            </button>
          ))}
        </FilterRow>
        <FilterRow label="Elemento">
          {ELEMENTS.map((e) => (
            <button
              key={e.n}
              onClick={() => setElem(elem === e.n ? "" : e.n)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[13px]"
              style={chipStyle(elem === e.n)}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: accentOf(e.n, env), border: "1px solid var(--ring)" }}
              />
              {e.n}
            </button>
          ))}
        </FilterRow>
        <FilterRow label="Pólo">
          {POLES.map((p) => (
            <button
              key={p}
              onClick={() => setPole(pole === p ? "" : p)}
              className="min-h-[36px] rounded-full border px-3 text-[13px]"
              style={chipStyle(pole === p)}
            >
              {p}
            </button>
          ))}
        </FilterRow>
        <FilterRow label="Intenção">
          {INTENTS.map((i) => (
            <button
              key={i}
              onClick={() => setIntents((s) => ({ ...s, [i]: !s[i] }))}
              className="min-h-[36px] rounded-full border px-3 text-[13px]"
              style={chipStyle(!!intents[i])}
            >
              {i}
            </button>
          ))}
        </FilterRow>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[14px]" style={{ color: "var(--muted)" }}>
          {shown.length} runa{shown.length === 1 ? "" : "s"}
        </span>
        <span className="flex items-center gap-2">
          <button
            onClick={() => setFavOnly(!favOnly)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 text-[13px]"
            style={chipStyle(favOnly)}
          >
            <Star size={14} fill={favOnly ? "currentColor" : "none"} /> Favoritos
          </button>
          <button
            onClick={clear}
            className="min-h-[36px] text-[14px] underline decoration-dashed underline-offset-4"
            style={{ color: "var(--accent)" }}
          >
            limpar
          </button>
        </span>
      </div>

      <p
        className="mt-3 rounded-2xl border px-4 py-3 text-[14px] leading-[1.6]"
        style={{ borderColor: "var(--line)", background: "var(--panel)", color: "var(--muted)" }}
      >
        <b style={{ color: "var(--ink)" }}>Como ler:</b> o nome grande é o do Eduardo
        (anglo-saxónico, o mais antigo); por baixo, o nome moderno. O ponto redondo é a cor
        da <b style={{ color: "var(--ink)" }}>vela</b> (o elemento do regente). O quadrado é
        a <b style={{ color: "var(--ink)" }}>classe</b>.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {shown.map((r) => (
          <RuneCard key={r.id} rune={r} />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="mt-8 text-center text-[16px]" style={{ color: "var(--muted)" }}>
          Nenhuma runa corresponde a estes filtros.
        </p>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span
        className="mt-2 w-[76px] shrink-0 text-[13px] uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

/* ---------------- Armas ---------------- */

function WeaponsTab() {
  const sheet = useSheet();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {WEAPONS.map((w) => {
        const r = RUNES[w.rune];
        return (
          <button
            key={w.n}
            onClick={() => sheet.openWeapon(w.n)}
            className="rounded-2xl border p-4 text-left"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <div className="flex items-center gap-3">
              <RuneGlyph id={w.rune} className="h-[46px] w-[26px] shrink-0" />
              <div>
                <b className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
                  {w.n}
                </b>
                <div className="text-[13px] italic" style={{ color: "var(--muted)" }}>
                  {w.epi}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[15px] leading-[1.55]">{w.d}</p>
            <div className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
              Regente: {w.deity} · Runa {r.ed} ({r.mod})
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Seres ---------------- */

function BeingsTab() {
  const sheet = useSheet();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {BEINGS.map((b) => {
        const r = RUNES[b.rune];
        return (
          <button
            key={b.n}
            onClick={() => sheet.openBeing(b.n)}
            className="rounded-2xl border p-4 text-left"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <div className="flex items-center gap-3">
              <RuneGlyph id={b.rune} className="h-[46px] w-[26px] shrink-0" />
              <div>
                <b className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
                  {b.n}
                </b>
                <div className="text-[13px] italic" style={{ color: "var(--muted)" }}>
                  {b.epi}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[15px] leading-[1.55]">{b.d}</p>
            <div className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
              Regente: {b.deity} · Runa {r.ed} ({r.mod})
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Elementos ---------------- */

const POLE_ORDER: Record<string, number> = { Irradiador: 0, Neutro: 1, Absorvedor: 2, "Tríade": 3 };

function ElementsTab() {
  const env = useEnv();
  const sheet = useSheet();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ELEMENTS.map((e) => {
        const trio = RUNES.filter((r) => elemsOf(r).includes(e.n)).sort(
          (a, b) => POLE_ORDER[a.pole] - POLE_ORDER[b.pole]
        );
        return (
          <div
            key={e.n}
            className="rounded-2xl border p-4"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <div className="flex items-center gap-3">
              <VelaDot elem={e.n} size={22} />
              <div>
                <b className="font-display text-[19px] font-semibold" style={{ color: "var(--ink)" }}>
                  {e.n}
                </b>
                <div className="text-[13px]" style={{ color: "var(--muted)" }}>
                  Vela {e.cor.toLowerCase()}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[15px] leading-[1.55]">{e.rep}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {trio.map((r) => (
                <button
                  key={r.id}
                  onClick={() => sheet.openRune(r.id)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-2.5 text-[13px]"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                >
                  <span
                    className="vela"
                    style={{ width: 11, height: 11, background: accentOf(e.n, env) }}
                  />
                  {r.deity}
                  <span style={{ color: "var(--muted)" }}>{r.pole.slice(0, 3)}</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
