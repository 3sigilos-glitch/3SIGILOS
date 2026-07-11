import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { badgeText, filterCards, suitHex } from "../data";
import { usePrefs } from "../lib/prefs";
import { load, save } from "../lib/storage";
import { CardImg } from "../components/CardImg";
import { FilterPanel } from "../components/FilterPanel";

export function Cards() {
  const navigate = useNavigate();
  const { cat, rank, query, setQuery, setCat, setRank, favOnly, setFavOnly, favorites } =
    usePrefs();
  const [collapsed, setCollapsed] = useState(() => load("ts-panel-collapsed", false));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => save("ts-panel-collapsed", collapsed), [collapsed]);

  // Repõe a posição de leitura ao voltar do detalhe.
  useEffect(() => {
    const y = Number(sessionStorage.getItem("cards-scroll") ?? 0);
    if (y) window.scrollTo(0, y);
    return () => {
      sessionStorage.setItem("cards-scroll", String(window.scrollY));
    };
  }, []);

  const cards = useMemo(() => {
    const base = filterCards(cat, rank, query);
    return favOnly ? base.filter((c) => favorites.includes(c.slug)) : base;
  }, [cat, rank, query, favOnly, favorites]);

  return (
    <main className={"list-view with-panel" + (collapsed ? " panel-collapsed" : "")}>
      <div className="search-block">
        <div className="search">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar carta, naipe, tema…"
            aria-label="Procurar cartas"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className="search-clear"
              aria-label="Limpar pesquisa"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="empty">
          <p className="empty-mark">✦</p>
          <p>Nenhuma carta corresponde à procura.</p>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              setQuery("");
              setCat("all");
              setRank("all");
              setFavOnly(false);
            }}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul className="card-grid">
          {cards.map((c, i) => (
            <li key={c.slug}>
              <button
                type="button"
                className="card-cell"
                onClick={() => navigate("/carta/" + c.slug)}
              >
                <CardImg card={c} width={240} eager={i < 6} />
                <span className="cell-badge" style={{ color: suitHex(c.cat) }}>
                  {badgeText(c)}
                </span>
                <span className="cell-pt">{c.pt}</span>
                <span className="cell-en">{c.en}</span>
                <span className="cell-kw">{c.kw.slice(0, 3).join(" · ")}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <FilterPanel
        count={cards.length}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
      />
    </main>
  );
}
