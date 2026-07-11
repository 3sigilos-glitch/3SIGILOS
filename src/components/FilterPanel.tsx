import { ChevronDown, ChevronUp, Heart } from "lucide-react";
import { Cat, RANK_LABEL, SUITS } from "../data";
import { usePrefs } from "../lib/prefs";
import { haptic } from "../lib/storage";
import { SuitGlyph } from "./SuitGlyph";

const SUIT_ORDER: Cat[] = ["wands", "cups", "swords", "pentacles"];
const NUM_CELLS = ["all", 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const COURT_CELLS = [11, 12, 13, 14] as const;

interface Props {
  count: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function FilterPanel({ count, collapsed, onToggleCollapsed }: Props) {
  const { cat, setCat, rank, setRank, favOnly, setFavOnly } = usePrefs();
  const numbersDisabled = cat === "major";

  const summary = [
    cat === "all" ? "Todas" : cat === "major" ? "Maiores" : SUITS[cat].label,
    rank !== "all" && !numbersDisabled ? RANK_LABEL[String(rank)] : null,
    favOnly ? "Favoritas" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={"filter-panel" + (collapsed ? " collapsed" : "")}>
      <button
        type="button"
        className="panel-handle"
        onClick={() => {
          haptic(8);
          onToggleCollapsed();
        }}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Abrir filtros" : "Recolher filtros"}
      >
        {collapsed ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        <span className="panel-summary">{summary}</span>
        <span className="panel-count" aria-live="polite">
          {count === 1 ? "1 carta" : count + " cartas"}
        </span>
      </button>

      {!collapsed && (
        <div className="panel-body">
          <div className="suit-row" role="tablist" aria-label="Filtrar por categoria">
            <button
              type="button"
              role="tab"
              aria-selected={cat === "all"}
              className={"suit-btn" + (cat === "all" ? " active" : "")}
              onClick={() => setCat("all")}
            >
              Todas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={cat === "major"}
              className={"suit-btn" + (cat === "major" ? " active" : "")}
              onClick={() => setCat("major")}
            >
              Maiores
            </button>
            {SUIT_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={cat === s}
                aria-label={SUITS[s].label}
                title={SUITS[s].label}
                className={"suit-btn suit-glyph" + (cat === s ? " active" : "")}
                style={{ "--suit": SUITS[s].hex } as React.CSSProperties}
                onClick={() => setCat(s)}
              >
                <SuitGlyph cat={s} />
              </button>
            ))}
            <button
              type="button"
              className={"suit-btn fav-btn" + (favOnly ? " active" : "")}
              aria-pressed={favOnly}
              aria-label="Só favoritas"
              title="Só favoritas"
              onClick={() => setFavOnly(!favOnly)}
            >
              <Heart size={17} fill={favOnly ? "currentColor" : "none"} />
            </button>
          </div>

          <div
            className={"num-zone" + (numbersDisabled ? " disabled" : "")}
            aria-hidden={numbersDisabled}
          >
            <div className="num-grid" role="tablist" aria-label="Filtrar por número">
              {NUM_CELLS.map((n) => (
                <button
                  key={String(n)}
                  type="button"
                  role="tab"
                  aria-selected={rank === n}
                  disabled={numbersDisabled}
                  className={"num-btn" + (rank === n ? " active" : "")}
                  onClick={() => setRank(n)}
                >
                  {n === "all" ? "Todos" : n === 1 ? "Ás" : n}
                </button>
              ))}
            </div>
            <div className="court-grid" role="tablist" aria-label="Filtrar por figura">
              {COURT_CELLS.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={rank === n}
                  disabled={numbersDisabled}
                  className={"num-btn" + (rank === n ? " active" : "")}
                  onClick={() => setRank(n)}
                >
                  {RANK_LABEL[String(n)]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
