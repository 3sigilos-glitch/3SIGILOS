import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import { Check, ChevronLeft, X } from "lucide-react";
import { Card, filterCards, metaEyebrow, suitHex } from "../data";
import { usePrefs } from "../lib/prefs";
import { haptic } from "../lib/storage";
import { CardImg } from "../components/CardImg";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Monta uma ronda: a carta certa mais tres distractoras, baralhadas. */
function makeRound(pool: Card[], avoid?: string): { answer: Card; options: Card[] } {
  const usable = pool.length >= 4 ? pool : filterCards("all", "all", "");
  let answer = usable[Math.floor(Math.random() * usable.length)];
  if (avoid && usable.length > 1) {
    while (answer.slug === avoid) answer = usable[Math.floor(Math.random() * usable.length)];
  }
  const distract = shuffle(usable.filter((c) => c.slug !== answer.slug)).slice(0, 3);
  return { answer, options: shuffle([answer, ...distract]) };
}

export function Guess() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { cat, rank, favOnly, favorites } = usePrefs();

  const pool = useMemo(() => {
    const base = filterCards(cat, rank, "");
    const withFavs = favOnly ? base.filter((c) => favorites.includes(c.slug)) : base;
    return withFavs.length > 0 ? withFavs : filterCards("all", "all", "");
  }, [cat, rank, favOnly, favorites]);

  const [round, setRound] = useState(() => makeRound(pool));
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ hits: 0, total: 0 });

  const filtered = cat !== "all" || rank !== "all" || favOnly;
  const answered = picked !== null;
  const correct = picked === round.answer.slug;

  function pick(slug: string) {
    if (answered) return;
    const hit = slug === round.answer.slug;
    haptic(hit ? 18 : 8);
    setPicked(slug);
    setScore((s) => ({ hits: s.hits + (hit ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    haptic(8);
    setRound(makeRound(pool, round.answer.slug));
    setPicked(null);
    window.scrollTo(0, 0);
  }

  return (
    <main className="guess">
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="detail-pos">
          Adivinha · {score.hits}/{score.total}
        </span>
        <span className="detail-bar-spacer" />
      </div>

      {filtered && (
        <p className="study-scope">A sortear dentro do filtro activo ({pool.length} cartas).</p>
      )}

      <m.div
        key={round.answer.slug + String(answered)}
        className="guess-body"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {!answered ? (
          <>
            <p className="guess-lead">Que carta é esta?</p>
            <ul className="kw-row guess-kw" aria-label="Palavras-chave">
              {round.answer.kw.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
            <p className="guess-meaning">{round.answer.up}</p>
          </>
        ) : (
          <div className="guess-reveal">
            <div className="guess-figure">
              <CardImg card={round.answer} width={480} eager />
            </div>
            <p className={"guess-verdict " + (correct ? "hit" : "miss")}>
              {correct ? "Certo!" : "Era esta"}
            </p>
            <p className="eyebrow" style={{ color: suitHex(round.answer.cat) }}>
              {metaEyebrow(round.answer)}
            </p>
            <h1 className="card-title">{round.answer.pt}</h1>
            <p className="card-en">{round.answer.en}</p>
          </div>
        )}

        <div className="guess-options">
          {round.options.map((o) => {
            const isAnswer = o.slug === round.answer.slug;
            const isPicked = o.slug === picked;
            let cls = "guess-option";
            if (answered && isAnswer) cls += " correct";
            else if (answered && isPicked) cls += " wrong";
            else if (answered) cls += " dim";
            return (
              <button
                key={o.slug}
                type="button"
                className={cls}
                onClick={() => pick(o.slug)}
                disabled={answered}
              >
                <span className="guess-option-name">{o.pt}</span>
                {answered && isAnswer && <Check size={17} />}
                {answered && isPicked && !isAnswer && <X size={17} />}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="guess-actions">
            <button type="button" className="gold-btn" onClick={next}>
              Próxima carta
            </button>
            <Link to={"/carta/" + round.answer.slug} className="ghost-btn">
              Ver ficha completa
            </Link>
          </div>
        )}
      </m.div>
    </main>
  );
}
