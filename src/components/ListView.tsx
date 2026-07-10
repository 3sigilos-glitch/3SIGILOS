import { useRef } from "react";
import {
  Card,
  CatFilter,
  RankFilter,
  CAT_FILTERS,
  RANK_FILTERS,
  SUITS,
  badgeText,
  suitHex,
} from "../data";
import { navigate } from "../hooks/useHashRoute";
import { CardImg } from "./CardImg";

interface Props {
  cards: Card[];
  cat: CatFilter;
  rank: RankFilter;
  query: string;
  onCat: (c: CatFilter) => void;
  onRank: (r: RankFilter) => void;
  onQuery: (q: string) => void;
}

export function ListView({ cards, cat, rank, query, onCat, onRank, onQuery }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <main className="list-view">
      <div className="search-block">
        <div className="search">
          <svg viewBox="0 0 24 24" className="search-icon" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <line x1="15.2" y1="15.2" x2="20.5" y2="20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
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
                onQuery("");
                inputRef.current?.focus();
              }}
            >
              ×
            </button>
          )}
        </div>
        <div className="chips" role="tablist" aria-label="Filtrar por categoria">
          {CAT_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={cat === f.value}
              className={"chip" + (cat === f.value ? " active" : "")}
              style={
                f.value !== "all" && f.value !== "major"
                  ? ({ "--chip-accent": SUITS[f.value].hex } as React.CSSProperties)
                  : undefined
              }
              onClick={() => onCat(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        {cat !== "major" && (
          <div className="chips chips-rank" role="tablist" aria-label="Filtrar por número">
            {RANK_FILTERS.map((f) => (
              <button
                key={String(f.value)}
                type="button"
                role="tab"
                aria-selected={rank === f.value}
                className={"chip chip-sm" + (rank === f.value ? " active" : "")}
                onClick={() => onRank(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="result-count" aria-live="polite">
        {cards.length === 1 ? "1 carta" : cards.length + " cartas"}
      </p>

      {cards.length === 0 ? (
        <div className="empty">
          <p className="empty-mark">✦</p>
          <p>Nenhuma carta corresponde à procura.</p>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              onQuery("");
              onCat("all");
              onRank("all");
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
    </main>
  );
}
