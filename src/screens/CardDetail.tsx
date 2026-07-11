import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import { ChevronLeft, Heart, Share2, Volume2, Square } from "lucide-react";
import { RANK_LABEL, cardBySlug, filterCards, metaEyebrow, suitHex } from "../data";
import { usePrefs } from "../lib/prefs";
import { useSpeech } from "../lib/speech";
import { haptic } from "../lib/storage";
import { share } from "../share";
import { CardImg } from "../components/CardImg";

const SWIPE_MIN = 56;

export function CardDetail() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { reversed, cat, rank, query, isFavorite, toggleFavorite, getNote, setNote } = usePrefs();
  const card = cardBySlug(slug);
  const reduced = useReducedMotion();

  // O deslizar percorre a lista do filtro activo; num link directo
  // fora do filtro, percorre as 78.
  const list = useMemo(() => {
    const filtered = filterCards(cat, rank, query);
    return card && filtered.some((c) => c.slug === card.slug)
      ? filtered
      : filterCards("all", "all", "");
  }, [cat, rank, query, card]);

  const [dir, setDir] = useState<1 | -1 | 0>(0);
  const [revealed, setRevealed] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const touch = useRef({ x: 0, y: 0, active: false });
  const speech = useSpeech();

  const idx = card ? list.findIndex((c) => c.slug === card.slug) : -1;
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  useEffect(() => {
    setRevealed(false);
    window.scrollTo(0, 0);
    speech.stop();
    setNoteDraft(card ? getNote(card.slug) : "");
    setNoteSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Guarda o diário com atraso curto depois de parar de escrever.
  useEffect(() => {
    if (!card) return;
    const t = window.setTimeout(() => {
      if (noteDraft !== getNote(card.slug)) {
        setNote(card.slug, noteDraft);
        setNoteSaved(true);
        window.setTimeout(() => setNoteSaved(false), 1600);
      }
    }, 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteDraft, card?.slug]);

  if (!card) {
    return (
      <main className="detail-page">
        <p className="empty">Carta não encontrada.</p>
      </main>
    );
  }

  function go(toSlug: string, d: 1 | -1) {
    setDir(d);
    haptic(8);
    navigate("/carta/" + toSlug, { replace: true });
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
    if (dx < 0 && next) go(next.slug, 1);
    if (dx > 0 && prev) go(prev.slug, -1);
  }

  function speakCard() {
    if (speech.status !== "idle") {
      speech.stop();
      return;
    }
    const parts = [
      card!.pt + ". " + card!.en + ".",
      "Palavras-chave: " + card!.kw.join(", ") + ".",
      "Direito. " + card!.up,
      ...(reversed || revealed ? ["Invertido. " + card!.rev] : []),
      "Na imagem. " + card!.sym,
      "Para reflectir. " + card!.q.join(" "),
    ];
    speech.playTracks([{ id: card!.slug, title: "", text: parts.join(" ") }]);
  }

  const fav = isFavorite(card.slug);

  return (
    <main
      className="detail-page"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="detail-pos">
          {idx + 1} de {list.length}
        </span>
        <div className="detail-actions">
          <button
            type="button"
            className={"icon-btn" + (speech.status !== "idle" ? " on" : "")}
            aria-label={speech.status !== "idle" ? "Parar leitura" : "Ouvir a carta"}
            onClick={speakCard}
            disabled={!speech.supported}
          >
            {speech.status !== "idle" ? <Square size={19} /> : <Volume2 size={21} />}
          </button>
          <button
            type="button"
            className={"icon-btn fav" + (fav ? " on" : "")}
            aria-pressed={fav}
            aria-label={fav ? "Tirar dos favoritos" : "Marcar como favorita"}
            onClick={() => {
              haptic(14);
              toggleFavorite(card.slug);
            }}
          >
            <Heart size={21} fill={fav ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Partilhar"
            onClick={() =>
              share(card.pt + " · Tarot by 3SIGILOS", card.pt + " (" + card.en + "): " + card.kw.join(", "))
            }
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <m.article
        key={card.slug}
        className="detail-body"
        initial={reduced || dir === 0 ? { opacity: 0 } : { opacity: 0, x: dir * 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.26, ease: "easeOut" }}
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

        <section className="meaning meaning-rev">
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

        <section className="meaning">
          <h2>
            Diário {noteSaved && <em className="saved-flag">guardado</em>}
          </h2>
          <textarea
            className="diary"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="As tuas notas sobre esta carta ficam guardadas só neste dispositivo."
            rows={4}
            aria-label="Notas pessoais sobre esta carta"
          />
        </section>

        <div className="detail-nav">
          <button
            type="button"
            className="nav-adj"
            disabled={!prev}
            onClick={() => prev && go(prev.slug, -1)}
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
            onClick={() => next && go(next.slug, 1)}
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

        <p className="detail-foot">
          {card.rank ? RANK_LABEL[String(card.rank)] + " · " : ""}
          gravura de Pamela Colman Smith, 1909, domínio público
        </p>
      </m.article>
    </main>
  );
}
