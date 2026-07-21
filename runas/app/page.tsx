"use client";

import { useMemo, useState } from "react";
import { RUNES } from "@/lib/runes";
import { CLASSES, ELEMENTS, INTENTS, POLES } from "@/lib/elements";
import { classOf, elemsOf, fold, searchText } from "@/lib/rules";
import type { ClassName, ElementName } from "@/lib/types";
import RuneCard from "@/components/RuneCard";
import { Chip, RunicDivider, ScreenTitle } from "@/components/ui";
import { useAppStore } from "@/components/StoreProvider";

// Ecrã Runas (default): título, divisória rúnica, painel de filtros e
// grelha de cartões, conforme o handoff. A pesquisa (por qualquer um dos
// dois nomes, regente ou palavra-chave) mantém-se, integrada no painel.
export default function RunasPage() {
  const { store } = useAppStore();
  const [q, setQ] = useState("");
  const [fClasse, setFClasse] = useState<ClassName | null>(null);
  const [fElemento, setFElemento] = useState<ElementName | null>(null);
  const [fPolo, setFPolo] = useState<string | null>(null);
  const [fIntent, setFIntent] = useState<string | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  const filtered = useMemo(() => {
    const nq = fold(q.trim());
    return RUNES.filter(
      (r) =>
        (!fClasse || classOf(r) === fClasse) &&
        (!fElemento || elemsOf(r).includes(fElemento)) &&
        (!fPolo || r.pole === fPolo) &&
        (!fIntent || r.intent.includes(fIntent)) &&
        (!favOnly || store.favs[r.id]) &&
        (!nq || fold(searchText(r)).includes(nq))
    );
  }, [q, fClasse, fElemento, fPolo, fIntent, favOnly, store.favs]);

  const clear = () => {
    setQ("");
    setFClasse(null);
    setFElemento(null);
    setFPolo(null);
    setFIntent(null);
    setFavOnly(false);
  };

  return (
    <section className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <ScreenTitle title="As 25 Runas">
          O nome grande é o do Eduardo (anglo-saxónico, o mais antigo); por baixo, o nome
          moderno. O ponto redondo é a cor da <em>vela</em> (o elemento do regente); o
          quadrado é a <em>classe</em>.
        </ScreenTitle>
        <RunicDivider />
      </div>

      {/* painel de filtros */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "16px 18px",
          background: "var(--panel)",
        }}
      >
        <FilterRow name="Procurar">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Feoh ou Fehu, regente, palavra-chave…"
            aria-label="Procurar runas"
            style={{
              flex: 1,
              minWidth: 200,
              font: "inherit",
              fontSize: 16,
              background: "var(--surface)",
              color: "var(--text-strong)",
              border: "1px solid var(--border-chip)",
              borderRadius: 4,
              padding: "6px 10px",
            }}
          />
        </FilterRow>
        <FilterRow name="Classe">
          {CLASSES.map((c) => (
            <Chip key={c} active={fClasse === c} onClick={() => setFClasse(fClasse === c ? null : c)}>
              {c}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow name="Elemento">
          {ELEMENTS.map((e) => (
            <Chip
              key={e.n}
              active={fElemento === e.n}
              onClick={() => setFElemento(fElemento === e.n ? null : e.n)}
            >
              {e.n}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow name="Pólo">
          {POLES.map((p) => (
            <Chip key={p} active={fPolo === p} onClick={() => setFPolo(fPolo === p ? null : p)}>
              {p}
            </Chip>
          ))}
        </FilterRow>
        <FilterRow name="Intenção">
          {INTENTS.map((i) => (
            <Chip key={i} active={fIntent === i} onClick={() => setFIntent(fIntent === i ? null : i)}>
              {i}
            </Chip>
          ))}
        </FilterRow>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            borderTop: "1px solid var(--border)",
            paddingTop: 10,
            marginTop: 2,
          }}
        >
          <span style={{ color: "var(--text-2)", fontSize: 15 }}>
            {filtered.length} {filtered.length === 1 ? "runa" : "runas"}
          </span>
          <Chip active={favOnly} onClick={() => setFavOnly(!favOnly)}>
            ★ Favoritos
          </Chip>
          <button
            onClick={clear}
            style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 15, padding: 0, fontStyle: "italic" }}
          >
            limpar
          </button>
        </div>
      </div>

      {/* grelha de cartões */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(185px,1fr))", gap: 10 }}>
        {filtered.map((r) => (
          <RuneCard key={r.id} rune={r} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div
          style={{
            border: "1px dashed var(--border-chip)",
            borderRadius: 6,
            padding: 40,
            textAlign: "center",
            color: "var(--text-4)",
            fontStyle: "italic",
          }}
        >
          Nenhuma runa corresponde a estes filtros.
        </div>
      )}
    </section>
  );
}

function FilterRow({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
      <span
        className="font-cinzel"
        style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-4)", minWidth: 74 }}
      >
        {name}
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1 }}>{children}</div>
    </div>
  );
}
