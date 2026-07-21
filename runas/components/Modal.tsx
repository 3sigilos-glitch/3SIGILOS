"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { runeById } from "@/lib/runes";
import { WEAPONS } from "@/lib/weapons";
import { BEINGS } from "@/lib/beings";
import { classOf, elemsOf } from "@/lib/rules";
import Glyph from "./Glyph";
import { Lab } from "./ui";
import { useAppStore } from "./StoreProvider";

// Modal de ficha da runa (handoff): overlay escuro com blur, caixa 460px,
// glifo 64px com glowPulse, linhas chave-valor. Mantém, abaixo das linhas
// do handoff, a essência, o texto aprofundado, as descrições de arma/ser
// e as notas pessoais, na mesma linguagem visual.

interface ModalApi {
  openRune: (id: number) => void;
  close: () => void;
}

const ModalContext = createContext<ModalApi | null>(null);

export function useModal(): ModalApi {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal fora do ModalProvider");
  return ctx;
}

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<number | null>(null);

  const api: ModalApi = {
    openRune: useCallback((x: number) => setId(x), []),
    close: useCallback(() => setId(null), []),
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setId(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ModalContext.Provider value={api}>
      {children}
      {id !== null && (
        <div
          onClick={api.close}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(8,7,12,0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="fade-up"
            style={{
              background: "#15131c",
              border: "1px solid var(--border-modal)",
              borderRadius: 8,
              maxWidth: 460,
              width: "100%",
              maxHeight: "86vh",
              overflowY: "auto",
              padding: "28px 28px 24px",
              boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            }}
          >
            <RuneDetail key={id} id={id} onClose={api.close} />
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <Lab minWidth={88}>{k}</Lab>
      <span style={{ fontSize: 16.5, color: "var(--text-warm)" }}>{v}</span>
    </div>
  );
}

function RuneDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const r = runeById(id);
  const { store, toggleFav, setNote } = useAppStore();
  if (!r) return null;

  const fav = !!store.favs[r.id];
  const cls = classOf(r);
  const elems = elemsOf(r);
  const isTriad = r.elem === "Tríade";
  const armas = WEAPONS.filter((w) => r.weapons.includes(w.n));
  const ser = r.being ? BEINGS.find((b) => b.n === r.being) : undefined;

  const pill = (hl: boolean): React.CSSProperties => ({
    background: "none",
    border: "1px solid var(--border-modal)",
    borderRadius: 999,
    color: hl ? "var(--gold)" : "var(--text-2)",
    fontSize: 14,
    padding: "6px 14px",
  });

  return (
    <div>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}
      >
        <Glyph id={r.id} size={64} className="glow-pulse-4" origin="left center" />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => toggleFav(r.id)} style={pill(true)}>
            {fav ? "★ Guardada" : "☆ Guardar"}
          </button>
          <button onClick={onClose} aria-label="Fechar" style={pill(false)}>
            ✕
          </button>
        </div>
      </div>

      <h2
        className="font-cinzel"
        style={{ fontWeight: 500, fontSize: 30, margin: 0, letterSpacing: 2, color: "var(--title)" }}
      >
        {r.ed}
      </h2>
      <div style={{ fontStyle: "italic", color: "var(--text-3)", fontSize: 16, marginBottom: 16 }}>
        {r.mod} · regente {r.deity}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <Row k="Classe" v={cls} />
        <Row k="Elemento" v={isTriad ? "Cristalino · Vazio · Temporal" : r.elem} />
        <Row k="Pólo" v={r.pole} />
        <Row k="Vela" v={elems.map((e) => e.toLowerCase()).join(" · ")} />
        <Row k="Intenções" v={r.intent.join(" · ")} />
        <Row k="Qualidades" v={r.kw.join(", ")} />
        {r.weapons.length > 0 && <Row k="Arma" v={r.weapons.join(" · ")} />}
        {r.being && <Row k="Ser" v={r.being} />}
      </div>

      {/* conteúdo de estudo preservado do códice */}
      <div style={{ marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
        <div
          className="font-cinzel"
          style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}
        >
          {r.deity} · {r.epi}
        </div>
        <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.55, color: "var(--text-warm)" }}>
          {r.essence}
        </p>
        {r.deep && (
          <p style={{ margin: "10px 0 0", fontSize: 16, lineHeight: 1.55, color: "var(--text-body2)" }}>
            {r.deep}
          </p>
        )}
      </div>

      {(armas.length > 0 || ser) && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {armas.map((w) => (
            <div
              key={w.n}
              style={{ background: "var(--surface)", border: "1px solid var(--border-card)", borderRadius: 5, padding: "12px 14px" }}
            >
              <div className="font-cinzel" style={{ fontSize: 13, letterSpacing: 1.5, color: "var(--gold-light)" }}>
                {w.n} <span style={{ color: "var(--text-4)" }}>· {w.epi}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.5, color: "var(--text-body2)" }}>{w.d}</p>
            </div>
          ))}
          {ser && (
            <div
              style={{ background: "var(--surface)", border: "1px solid var(--border-card)", borderRadius: 5, padding: "12px 14px" }}
            >
              <div className="font-cinzel" style={{ fontSize: 13, letterSpacing: 1.5, color: "var(--blue)" }}>
                {ser.n} <span style={{ color: "var(--text-4)" }}>· {ser.epi}</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.5, color: "var(--text-body2)" }}>{ser.d}</p>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Lab>As minhas notas</Lab>
        <textarea
          defaultValue={store.notes[r.id] ?? ""}
          onBlur={(e) => setNote(r.id, e.target.value)}
          placeholder="Escreve aqui as tuas notas. Ficam guardadas neste dispositivo."
          rows={3}
          style={{
            width: "100%",
            marginTop: 6,
            background: "var(--surface)",
            border: "1px solid var(--border-chip)",
            borderRadius: 5,
            color: "var(--text-strong)",
            font: "inherit",
            fontSize: 15.5,
            lineHeight: 1.5,
            padding: 10,
            resize: "vertical",
          }}
        />
      </div>
    </div>
  );
}
