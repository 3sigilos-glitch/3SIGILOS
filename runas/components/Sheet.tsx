"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Star, X } from "lucide-react";
import { RUNES, runeById } from "@/lib/runes";
import { weaponByName } from "@/lib/weapons";
import { beingByName } from "@/lib/beings";
import { classOf, elemsOf } from "@/lib/rules";
import RuneGlyph from "./RuneGlyph";
import { ClassBadge, Lab, VelaDot } from "./bits";
import { useAppStore } from "./StoreProvider";

// Ficha deslizante (runa, arma ou ser), partilhada por todos os ecrãs.
// No telemóvel sobe do fundo; em ecrã largo entra pela direita.

type SheetState =
  | { kind: "rune"; id: number }
  | { kind: "weapon"; n: string }
  | { kind: "being"; n: string }
  | null;

interface SheetApi {
  openRune: (id: number) => void;
  openWeapon: (n: string) => void;
  openBeing: (n: string) => void;
  close: () => void;
}

const SheetContext = createContext<SheetApi | null>(null);

export function useSheet(): SheetApi {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error("useSheet fora do SheetProvider");
  return ctx;
}

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SheetState>(null);

  const api: SheetApi = {
    openRune: useCallback((id: number) => setState({ kind: "rune", id }), []),
    openWeapon: useCallback((n: string) => setState({ kind: "weapon", n }), []),
    openBeing: useCallback((n: string) => setState({ kind: "being", n }), []),
    close: useCallback(() => setState(null), []),
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setState(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SheetContext.Provider value={api}>
      {children}
      {state && (
        <>
          <button
            aria-label="Fechar ficha"
            onClick={api.close}
            className="fixed inset-0 z-40 cursor-default bg-black/40 backdrop-blur-[2px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-2xl border lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:max-h-none lg:w-[460px] lg:rounded-none lg:border-y-0 lg:border-r-0"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
          >
            <div className="sticky top-0 z-10 flex justify-end p-2" style={{ background: "var(--panel)" }}>
              <button
                onClick={api.close}
                aria-label="Fechar"
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ color: "var(--muted)" }}
              >
                <X size={22} />
              </button>
            </div>
            <div className="px-5 pb-10">
              {state.kind === "rune" && <RuneBody key={state.id} id={state.id} />}
              {state.kind === "weapon" && <WeaponBody n={state.n} />}
              {state.kind === "being" && <BeingBody n={state.n} />}
            </div>
          </aside>
        </>
      )}
    </SheetContext.Provider>
  );
}

function OpenRow({
  k,
  label,
  runeId,
  onClick,
}: {
  k: string;
  label: string;
  runeId: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full min-h-[52px] items-center gap-3 rounded-xl border px-3 py-2 text-left"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <RuneGlyph id={runeId} className="h-10 w-5 shrink-0" />
      <span>
        <span className="block text-[13px] uppercase tracking-wide" style={{ color: "var(--accent)" }}>
          {k}
        </span>
        <b className="font-display text-[17px]" style={{ color: "var(--ink)" }}>
          {label}
        </b>
      </span>
    </button>
  );
}

function Kw({ words }: { words: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {words.map((k) => (
        <span
          key={k}
          className="rounded-lg border px-2 py-1 text-[13px]"
          style={{ borderColor: "var(--line)", color: "var(--muted)" }}
        >
          {k}
        </span>
      ))}
    </div>
  );
}

function RuneBody({ id }: { id: number }) {
  const r = runeById(id);
  const sheet = useSheet();
  const { store, toggleFav, setNote } = useAppStore();
  if (!r) return null;

  const cls = classOf(r);
  const elems = elemsOf(r);
  const fav = !!store.favs[r.id];
  const sameElem = RUNES.filter(
    (x) => x.id !== r.id && elemsOf(x).some((e) => elems.includes(e))
  ).slice(0, 4);

  return (
    <div>
      <div className="flex items-center gap-4">
        <RuneGlyph id={r.id} className="h-[74px] w-10 shrink-0" />
        <div>
          <h2 className="font-display text-[28px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {r.ed}
          </h2>
          <div className="text-[14px]" style={{ color: "var(--muted)" }}>
            <span className="uppercase tracking-wide text-[13px]">nome moderno</span> · {r.mod} · letra {r.letter}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ClassBadge cls={cls} />
        <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "var(--muted)" }}>
          {elems.map((e) => (
            <VelaDot key={e} elem={e} />
          ))}
          {r.elem === "Tríade" ? "Cristalino, Vazio, Temporal" : r.elem}
        </span>
        <span className="text-[13px]" style={{ color: "var(--muted)" }}>
          Pólo: {r.pole}
        </span>
        <span className="text-[13px]" style={{ color: "var(--muted)" }}>
          {r.type}
        </span>
      </div>

      <section className="mt-5">
        <Lab>
          {r.deity} · {r.epi}
        </Lab>
        <p className="text-[17px] leading-[1.55]">{r.essence}</p>
      </section>

      {r.deep && (
        <section className="mt-5">
          <Lab>Aprofundado</Lab>
          <p className="text-[17px] leading-[1.55]">{r.deep}</p>
        </section>
      )}

      <section className="mt-5">
        <Lab>Palavras-chave</Lab>
        <Kw words={r.kw} />
      </section>

      <section className="mt-5">
        <Lab>Serve para</Lab>
        <Kw words={r.intent} />
      </section>

      {(r.weapons.length > 0 || r.being) && (
        <section className="mt-5">
          <Lab>Abre</Lab>
          <div className="flex flex-col gap-2">
            {r.weapons.map((w) => (
              <OpenRow key={w} k="Arma" label={w} runeId={r.id} onClick={() => sheet.openWeapon(w)} />
            ))}
            {r.being && (
              <OpenRow k="Seres" label={r.being} runeId={r.id} onClick={() => sheet.openBeing(r.being!)} />
            )}
          </div>
        </section>
      )}

      <section className="mt-5">
        <Lab>No mesmo elemento</Lab>
        <div className="flex flex-wrap gap-2">
          {sameElem.map((x) => (
            <button
              key={x.id}
              onClick={() => sheet.openRune(x.id)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-[14px]"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            >
              <VelaDot elem={elemsOf(x)[0]} />
              {x.deity}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <button
          onClick={() => toggleFav(r.id)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 text-[15px] font-medium"
          style={
            fav
              ? { background: "var(--accent)", borderColor: "var(--accent)", color: "var(--bg)" }
              : { borderColor: "var(--line)", color: "var(--ink)" }
          }
        >
          <Star size={18} fill={fav ? "currentColor" : "none"} />
          {fav ? "Nos favoritos" : "Adicionar aos favoritos"}
        </button>
      </section>

      <section className="mt-5">
        <Lab>As minhas notas</Lab>
        <textarea
          defaultValue={store.notes[r.id] ?? ""}
          onBlur={(e) => setNote(r.id, e.target.value)}
          placeholder="Escreve aqui as tuas notas sobre esta runa. Ficam guardadas neste dispositivo."
          rows={4}
          className="w-full rounded-xl border p-3 text-[16px] leading-[1.55]"
          style={{ borderColor: "var(--line)", background: "var(--card)", color: "var(--ink)" }}
        />
      </section>
    </div>
  );
}

function WeaponBody({ n }: { n: string }) {
  const w = weaponByName(n);
  const sheet = useSheet();
  if (!w) return null;
  const r = runeById(w.rune)!;
  return (
    <div>
      <div className="flex items-center gap-4">
        <RuneGlyph id={w.rune} className="h-[74px] w-10 shrink-0" />
        <div>
          <h2 className="font-display text-[26px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {w.n}
          </h2>
          <div className="text-[14px] italic" style={{ color: "var(--muted)" }}>
            {w.epi}
          </div>
        </div>
      </div>
      <section className="mt-5">
        <Lab>O que faz</Lab>
        <p className="text-[17px] leading-[1.55]">{w.d}</p>
      </section>
      <section className="mt-5">
        <Lab>Aberta por</Lab>
        <OpenRow
          k="Regente · Runa"
          label={`${w.deity} · ${r.ed}`}
          runeId={r.id}
          onClick={() => sheet.openRune(r.id)}
        />
      </section>
    </div>
  );
}

function BeingBody({ n }: { n: string }) {
  const b = beingByName(n);
  const sheet = useSheet();
  if (!b) return null;
  const r = runeById(b.rune)!;
  return (
    <div>
      <div className="flex items-center gap-4">
        <RuneGlyph id={b.rune} className="h-[74px] w-10 shrink-0" />
        <div>
          <h2 className="font-display text-[26px] font-semibold leading-tight" style={{ color: "var(--ink)" }}>
            {b.n}
          </h2>
          <div className="text-[14px] italic" style={{ color: "var(--muted)" }}>
            {b.epi}
          </div>
        </div>
      </div>
      <section className="mt-5">
        <Lab>O que faz</Lab>
        <p className="text-[17px] leading-[1.55]">{b.d}</p>
      </section>
      <section className="mt-5">
        <Lab>Sumonados por</Lab>
        <OpenRow
          k="Regente · Runa"
          label={`${b.deity} · ${r.ed}`}
          runeId={r.id}
          onClick={() => sheet.openRune(r.id)}
        />
      </section>
    </div>
  );
}
