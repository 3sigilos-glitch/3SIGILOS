import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { Card, badgeText, filterCards, suitHex } from "../data";
import { CardImg } from "./CardImg";

interface Props {
  title: string;
  usedSlugs: string[];
  onPick: (card: Card) => void;
  onClose: () => void;
}

/* Folha de escolha de carta, com a pesquisa da app. As cartas já usadas
   na leitura aparecem indisponíveis para não haver repetições. */
export function CardPicker({ title, usedSlugs, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => filterCards("all", "all", query), [query]);

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet picker-sheet"
        role="dialog"
        aria-label={"Escolher carta para " + title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="search">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar carta, naipe, tema…"
            aria-label="Procurar carta"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <ul className="picker-list">
          {results.map((c) => {
            const used = usedSlugs.includes(c.slug);
            return (
              <li key={c.slug}>
                <button
                  type="button"
                  className={"picker-row" + (used ? " used" : "")}
                  disabled={used}
                  onClick={() => onPick(c)}
                >
                  <span className="picker-thumb">
                    <CardImg card={c} width={96} />
                  </span>
                  <span className="picker-names">
                    <strong>{c.pt}</strong>
                    <small>{c.en}</small>
                  </span>
                  <span className="picker-badge" style={{ color: suitHex(c.cat) }}>
                    {used ? "já usada" : badgeText(c)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body
  );
}
