import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Card, filterCards, metaEyebrow, suitHex } from "../data";
import { usePrefs } from "../lib/prefs";
import { haptic } from "../lib/storage";
import { CardImg } from "../components/CardImg";

function draw(pool: Card[], avoid?: string): Card {
  if (pool.length === 1) return pool[0];
  let c = pool[Math.floor(Math.random() * pool.length)];
  while (c.slug === avoid) c = pool[Math.floor(Math.random() * pool.length)];
  return c;
}

export function Study() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const { cat, rank, favOnly, favorites } = usePrefs();

  // Respeita os filtros activos da vista Cartas, se houver.
  const pool = useMemo(() => {
    const base = filterCards(cat, rank, "");
    const withFavs = favOnly ? base.filter((c) => favorites.includes(c.slug)) : base;
    return withFavs.length > 0 ? withFavs : filterCards("all", "all", "");
  }, [cat, rank, favOnly, favorites]);

  const [card, setCard] = useState<Card>(() => draw(pool));
  const [revealed, setRevealed] = useState(false);
  const [seen, setSeen] = useState(1);

  const filtered = cat !== "all" || rank !== "all" || favOnly;

  function nextCard() {
    haptic(8);
    setCard(draw(pool, card.slug));
    setRevealed(false);
    setSeen((n) => n + 1);
    window.scrollTo(0, 0);
  }

  return (
    <main className="study">
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="detail-pos">Estudo · {seen} nesta sessão</span>
        <span className="detail-bar-spacer" />
      </div>

      {filtered && (
        <p className="study-scope">A sortear dentro do filtro activo ({pool.length} cartas).</p>
      )}

      <m.div
        key={card.slug}
        className="study-card"
        initial={reduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="study-figure">
          <CardImg card={card} width={640} eager />
        </div>
        <p className="eyebrow" style={{ color: suitHex(card.cat) }}>
          {metaEyebrow(card)}
        </p>
        <h1 className="card-title">{card.pt}</h1>
        <p className="card-en">{card.en}</p>

        {revealed ? (
          <m.section
            className="meaning"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2>Direito</h2>
            <p className="dropcap">{card.up}</p>
          </m.section>
        ) : (
          <button
            type="button"
            className="gold-btn study-reveal"
            onClick={() => {
              haptic(8);
              setRevealed(true);
            }}
          >
            Revelar o significado
          </button>
        )}

        <div className="study-actions">
          <button type="button" className="ghost-btn" onClick={nextCard}>
            Próxima carta
          </button>
          <Link to={"/carta/" + card.slug} className="ghost-btn">
            Ver ficha completa
          </Link>
        </div>
      </m.div>
    </main>
  );
}
