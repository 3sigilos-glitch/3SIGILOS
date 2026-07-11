import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import { Footprints, GraduationCap, History, ImageDown, Loader2 } from "lucide-react";
import { cardBySlug, metaEyebrow, suitHex } from "../data";
import { usePrefs } from "../lib/prefs";
import { dailyCard, dayMessage, dailyHistory, recordDaily } from "../lib/dailyCard";
import { shareDailyImage } from "../lib/shareCard";
import { haptic } from "../lib/storage";
import { CardImg } from "../components/CardImg";

export function Home() {
  const { reversed } = usePrefs();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [sharing, setSharing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const daily = useMemo(() => {
    const d = dailyCard(reversed);
    recordDaily(d);
    return d;
  }, [reversed]);

  const message = useMemo(() => dayMessage(daily.card), [daily.card]);
  const history = useMemo(() => dailyHistory(), []);

  async function onShareImage() {
    haptic(10);
    setSharing(true);
    try {
      await shareDailyImage(daily.card, message, daily.reversed);
    } finally {
      setSharing(false);
    }
  }

  const today = new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main className="home">
      <p className="home-date">{today}</p>
      <h1 className="home-heading">Carta do dia</h1>

      <m.section
        className="daily"
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <button
          type="button"
          className="daily-figure"
          onClick={() => navigate("/carta/" + daily.card.slug)}
          aria-label={"Abrir a ficha de " + daily.card.pt}
        >
          <div className={daily.reversed ? "flip-rev" : undefined}>
            <CardImg card={daily.card} width={640} eager />
          </div>
        </button>
        <p className="eyebrow" style={{ color: suitHex(daily.card.cat) }}>
          {metaEyebrow(daily.card)}
          {daily.reversed ? " · invertida" : ""}
        </p>
        <h2 className="daily-name">{daily.card.pt}</h2>
        <p className="card-en">{daily.card.en}</p>
        <p className="daily-msg">{message}</p>
        {daily.reversed && (
          <p className="daily-rev-note">Saiu invertida: lê também o sentido invertido na ficha.</p>
        )}

        <div className="daily-actions">
          <Link to={"/carta/" + daily.card.slug} className="gold-btn">
            Abrir a ficha
          </Link>
          <button type="button" className="ghost-btn" onClick={onShareImage} disabled={sharing}>
            {sharing ? <Loader2 size={16} className="spin" /> : <ImageDown size={16} />}
            Partilhar imagem
          </button>
        </div>
      </m.section>

      <nav className="home-shortcuts" aria-label="Atalhos">
        <Link to="/jornada" className="shortcut">
          <Footprints size={20} />
          <span>
            <strong>Jornada do Louco</strong>
            <small>Os 22 Arcanos Maiores, capítulo a capítulo</small>
          </span>
        </Link>
        <Link to="/estudo" className="shortcut">
          <GraduationCap size={20} />
          <span>
            <strong>Modo estudo</strong>
            <small>Flashcards para treinar os significados</small>
          </span>
        </Link>
        <button type="button" className="shortcut" onClick={() => setShowHistory((v) => !v)}>
          <History size={20} />
          <span>
            <strong>Cartas dos últimos dias</strong>
            <small>{history.length === 0 ? "Ainda sem histórico" : history.length + " registos"}</small>
          </span>
        </button>
      </nav>

      {showHistory && history.length > 0 && (
        <ul className="history-list">
          {history.slice(0, 14).map((h) => {
            const c = cardBySlug(h.slug);
            if (!c) return null;
            return (
              <li key={h.dateKey}>
                <Link to={"/carta/" + c.slug} className="history-row">
                  <span className="history-date">
                    {new Date(h.dateKey + "T12:00:00").toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className="history-name">
                    {c.pt}
                    {h.reversed ? " (invertida)" : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
