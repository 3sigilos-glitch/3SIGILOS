import { useState } from "react";
import { Link } from "react-router-dom";
import { Footprints } from "lucide-react";
import { GUIDE_NUMS, GUIDE_SUITS } from "../data";
import { Accordion } from "../components/Accordion";

export function Guide() {
  const [tab, setTab] = useState<"suits" | "nums">("suits");

  return (
    <main className="guide">
      <Link to="/jornada" className="shortcut guide-journey">
        <Footprints size={20} />
        <span>
          <strong>Jornada do Louco</strong>
          <small>A narrativa dos 22 Arcanos Maiores</small>
        </span>
      </Link>

      <div className="guide-tabs" role="tablist" aria-label="Secções do guia">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "suits"}
          className={"guide-tab" + (tab === "suits" ? " active" : "")}
          onClick={() => setTab("suits")}
        >
          Naipes
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "nums"}
          className={"guide-tab" + (tab === "nums" ? " active" : "")}
          onClick={() => setTab("nums")}
        >
          Números
        </button>
      </div>

      {tab === "suits" ? (
        <div className="accordion-list">
          {GUIDE_SUITS.map((s) => (
            <Accordion
              key={s.en}
              title={s.name}
              meta={s.en + " · " + s.el}
              accent={s.hex}
            >
              <p>{s.body}</p>
            </Accordion>
          ))}
        </div>
      ) : (
        <div className="accordion-list">
          {GUIDE_NUMS.map((x) => (
            <Accordion key={x.n} title={x.n}>
              <p>{x.body}</p>
            </Accordion>
          ))}
        </div>
      )}
    </main>
  );
}
