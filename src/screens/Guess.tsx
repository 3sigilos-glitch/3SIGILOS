import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import { ChevronLeft, Layers } from "lucide-react";
import { Card, cardBySlug, filterCards, metaEyebrow, suitHex } from "../data";
import { usePrefs } from "../lib/prefs";
import { haptic } from "../lib/storage";
import { CardImg } from "../components/CardImg";
import { CardPicker } from "../components/CardPicker";

/* Sorteia a carta alvo, evitando repetir a anterior. */
function drawTarget(pool: Card[], avoid?: string): Card {
  const usable = pool.length > 0 ? pool : filterCards("all", "all", "");
  if (usable.length === 1) return usable[0];
  let c = usable[Math.floor(Math.random() * usable.length)];
  while (c.slug === avoid) c = usable[Math.floor(Math.random() * usable.length)];
  return c;
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

  const [answer, setAnswer] = useState<Card>(() => drawTarget(pool));
  const [picked, setPicked] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [score, setScore] = useState({ hits: 0, total: 0 });

  const filtered = cat !== "all" || rank !== "all" || favOnly;
  const answered = picked !== null;
  const correct = picked === answer.slug;
  const pickedCard = picked ? cardBySlug(picked) : null;

  function choose(card: Card) {
    if (answered) return;
    const hit = card.slug === answer.slug;
    haptic(hit ? 18 : 8);
    setPicked(card.slug);
    setPickerOpen(false);
    setScore((s) => ({ hits: s.hits + (hit ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    haptic(8);
    setAnswer(drawTarget(pool, answer.slug));
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
        <p className="study-scope">O alvo é sorteado dentro do filtro activo ({pool.length} cartas).</p>
      )}

      <m.div
        key={answer.slug + String(answered)}
        className="guess-body"
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
      >
        {!answered ? (
          <>
            <p className="guess-lead">Que carta é esta?</p>
            <ul className="kw-row guess-kw" aria-label="Palavras-chave">
              {answer.kw.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
            <p className="guess-meaning">{answer.up}</p>

            <button type="button" className="gold-btn guess-choose" onClick={() => setPickerOpen(true)}>
              <Layers size={17} /> Escolher entre as 78 cartas
            </button>
          </>
        ) : (
          <div className="guess-reveal">
            <div className="guess-figure">
              <CardImg card={answer} width={480} eager />
            </div>
            <p className={"guess-verdict " + (correct ? "hit" : "miss")}>
              {correct ? "Certo!" : "Não era essa"}
            </p>
            <p className="eyebrow" style={{ color: suitHex(answer.cat) }}>
              {metaEyebrow(answer)}
            </p>
            <h1 className="card-title">{answer.pt}</h1>
            <p className="card-en">{answer.en}</p>
            {!correct && pickedCard && (
              <p className="guess-your-pick">
                Escolheste <strong>{pickedCard.pt}</strong>.
              </p>
            )}

            <div className="guess-actions">
              <button type="button" className="gold-btn" onClick={next}>
                Próxima carta
              </button>
              <Link to={"/carta/" + answer.slug} className="ghost-btn">
                Ver ficha completa
              </Link>
            </div>
          </div>
        )}
      </m.div>

      {pickerOpen && (
        <CardPicker
          title="Qual é a carta?"
          usedSlugs={[]}
          onPick={choose}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </main>
  );
}
