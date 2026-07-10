import { useEffect, useRef, useState } from "react";
import { Card, RANK_LABEL, metaEyebrow, suitHex } from "../data";
import { navigate } from "../hooks/useHashRoute";
import { share } from "../share";
import { CardImg } from "./CardImg";

interface Props {
  card: Card;
  list: Card[];
  reversed: boolean;
}

const SWIPE_MIN = 56;

export function DetailView({ card, list, reversed }: Props) {
  const idx = list.findIndex((c) => c.slug === card.slug);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  const [dir, setDir] = useState<"left" | "right" | null>(null);
  const [revealed, setRevealed] = useState(false);
  const touch = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRevealed(false);
    scroller.current?.scrollTo({ top: 0 });
  }, [card.slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prev) go(prev, "right");
      if (e.key === "ArrowRight" && next) go(next, "left");
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function go(to: Card, d: "left" | "right") {
    setDir(d);
    navigate("/carta/" + to.slug, true);
  }

  function onTouchStart(e: React.TouchEvent) {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true };
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!touch.current.active) return;
    touch.current.active = false;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    if (dx < 0 && next) go(next, "left");
    if (dx > 0 && prev) go(prev, "right");
  }

  return (
    <div className="detail" role="dialog" aria-label={card.pt}>
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="Voltar à lista">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M 14.5 5 L 7.5 12 L 14.5 19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="detail-pos">{idx + 1} de {list.length}</span>
        <button
          type="button"
          className="icon-btn"
          onClick={() => share(card.pt + " · Tarot by 3SIGILOS", card.pt + " (" + card.en + "): " + card.kw.join(", "))}
          aria-label="Partilhar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17.5" cy="5.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17.5" cy="18.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <line x1="8.3" y1="10.8" x2="15.2" y2="6.7" stroke="currentColor" strokeWidth="1.6" />
            <line x1="8.3" y1="13.2" x2="15.2" y2="17.3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>

      <div
        ref={scroller}
        className="detail-scroll"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <article
          key={card.slug}
          className={"detail-body" + (dir ? " slide-" + dir : "")}
          onAnimationEnd={() => setDir(null)}
        >
          <div className="detail-figure">
            <CardImg card={card} width={640} eager />
          </div>

          <p className="eyebrow" style={{ color: suitHex(card.cat) }}>
            {metaEyebrow(card)}
          </p>
          <h1 className="card-title">{card.pt}</h1>
          <p className="card-en">{card.en}</p>

          <ul className="kw-row" aria-label="Palavras-chave">
            {card.kw.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>

          <section className="meaning">
            <h2>Direito</h2>
            <p className="dropcap">{card.up}</p>
          </section>

          <section className={"meaning meaning-rev" + (reversed || revealed ? "" : " hidden-rev")}>
            <h2>Invertido</h2>
            {reversed || revealed ? (
              <p>{card.rev}</p>
            ) : (
              <button type="button" className="ghost-btn reveal" onClick={() => setRevealed(true)}>
                Revelar o invertido
              </button>
            )}
          </section>

          <section className="meaning">
            <h2>Na imagem</h2>
            <p>{card.sym}</p>
          </section>

          <section className="meaning">
            <h2>Para reflectir</h2>
            <ul className="questions">
              {card.q.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </section>

          <div className="detail-nav">
            <button
              type="button"
              className="nav-adj"
              disabled={!prev}
              onClick={() => prev && go(prev, "right")}
            >
              {prev ? (
                <>
                  <span className="adj-dir">‹ Anterior</span>
                  <span className="adj-name">{prev.pt}</span>
                </>
              ) : (
                <span className="adj-dir">Início</span>
              )}
            </button>
            <button
              type="button"
              className="nav-adj adj-next"
              disabled={!next}
              onClick={() => next && go(next, "left")}
            >
              {next ? (
                <>
                  <span className="adj-dir">Seguinte ›</span>
                  <span className="adj-name">{next.pt}</span>
                </>
              ) : (
                <span className="adj-dir">Fim</span>
              )}
            </button>
          </div>

          {card.rank ? (
            <p className="detail-foot">
              {RANK_LABEL[String(card.rank)]} · gravura de Pamela Colman Smith, 1909, domínio público
            </p>
          ) : (
            <p className="detail-foot">Gravura de Pamela Colman Smith, 1909, domínio público</p>
          )}
        </article>
      </div>
    </div>
  );
}
