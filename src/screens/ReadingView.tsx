import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import { ChevronLeft, ImageDown, Loader2, Sparkles, Trash2 } from "lucide-react";
import { cardBySlug, suitHex } from "../data";
import { positionsFor, spreadById } from "../data/spreads";
import { insightsLeftToday, requestInsight } from "../lib/insight";
import { Reading, deleteReading, getReading, updateReading } from "../lib/readings";
import { shareReadingImage } from "../lib/shareReading";
import { haptic } from "../lib/storage";
import { CardImg } from "../components/CardImg";

export function ReadingView() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const [reading, setReading] = useState<Reading | undefined>(() => getReading(id));
  const [notes, setNotes] = useState(reading?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [sharing, setSharing] = useState(false);

  const spread = reading ? spreadById(reading.spreadId) : undefined;
  const positions = useMemo(
    () => (spread ? positionsFor(spread, reading?.framingId) : []),
    [spread, reading?.framingId]
  );

  // Guarda as notas com atraso curto.
  useEffect(() => {
    if (!reading) return;
    const t = window.setTimeout(() => {
      if (notes !== reading.notes) {
        updateReading(reading.id, { notes });
        setReading({ ...reading, notes });
        setNotesSaved(true);
        window.setTimeout(() => setNotesSaved(false), 1600);
      }
    }, 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  if (!reading || !spread) {
    return (
      <main className="readings">
        <p className="empty">Leitura não encontrada.</p>
      </main>
    );
  }

  const date = new Date(reading.createdAt).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function onInsight() {
    haptic(10);
    setAiBusy(true);
    setAiMessage("");
    const payload = {
      question: reading!.question,
      spreadName: spread!.name,
      positions: reading!.cards.map((entry, i) => {
        const card = cardBySlug(entry.slug)!;
        return {
          position: positions[i]?.name ?? "Posição " + (i + 1),
          positionAbout: positions[i]?.about ?? "",
          card: card.pt + " (" + card.en + ")",
          orientation: entry.reversed ? "invertida" : "direita",
          meaning: entry.reversed ? card.rev : card.up,
          keywords: card.kw,
        };
      }),
      patterns: reading!.patterns,
    };
    const result = await requestInsight(payload);
    setAiBusy(false);
    if (result.ok) {
      updateReading(reading!.id, { aiText: result.text });
      setReading({ ...reading!, aiText: result.text });
    } else if (result.reason === "limite-pessoal") {
      setAiMessage("Já usaste as leituras inteligentes de hoje. Volta amanhã: a leitura por padrões acima continua válida.");
    } else if (result.reason === "limite-global") {
      setAiMessage("As leituras inteligentes de hoje esgotaram para toda a app. A leitura por padrões acima continua válida.");
    } else {
      setAiMessage(
        "A leitura inteligente não está disponível neste momento. Fica com a leitura por padrões acima, que é sempre tua." +
          (result.detail ? " (Diagnóstico: " + result.detail + ".)" : "")
      );
    }
  }

  async function onShare() {
    haptic(10);
    setSharing(true);
    try {
      await shareReadingImage(reading!, spread!.name, positions);
    } finally {
      setSharing(false);
    }
  }

  function onDelete() {
    if (!window.confirm("Apagar esta leitura do registo?")) return;
    deleteReading(reading!.id);
    navigate("/leituras", { replace: true });
  }

  const insightsLeft = insightsLeftToday();

  return (
    <main className="readings reading-view">
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="detail-pos">{spread.name} · {date}</span>
        <div className="detail-actions">
          <button type="button" className="icon-btn" aria-label="Partilhar como imagem" onClick={onShare} disabled={sharing}>
            {sharing ? <Loader2 size={19} className="spin" /> : <ImageDown size={19} />}
          </button>
          <button type="button" className="icon-btn" aria-label="Apagar leitura" onClick={onDelete}>
            <Trash2 size={19} />
          </button>
        </div>
      </div>

      <div className="new-reading-body">
        {reading.question && <p className="reading-question">"{reading.question}"</p>}

        {reading.yesNo && (
          <div className={"verdict verdict-" + reading.yesNo.verdict.replace("ã", "a")}>
            <strong>{reading.yesNo.verdict.toUpperCase()}</strong>
            <p>{reading.yesNo.note}</p>
          </div>
        )}

        <ul className="pos-list result-list">
          {reading.cards.map((entry, i) => {
            const card = cardBySlug(entry.slug);
            if (!card) return null;
            const pos = positions[i];
            return (
              <m.li
                key={i}
                className="result-row"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: reduced ? 0 : i * 0.06, ease: "easeOut" }}
              >
                <div className="result-head">
                  <Link to={"/carta/" + card.slug} className={"pos-thumb" + (entry.reversed ? " flip-rev" : "")}>
                    <CardImg card={card} width={128} />
                  </Link>
                  <div>
                    <p className="eyebrow" style={{ color: suitHex(card.cat), textAlign: "left" }}>
                      {i + 1} · {pos?.name}
                    </p>
                    <h2 className="result-name">{card.pt}</h2>
                    <p className="result-en">
                      {card.en} · {entry.reversed ? "invertida" : "direita"}
                    </p>
                    <p className="result-posabout">{pos?.about}</p>
                  </div>
                </div>
                <p className="result-meaning">{entry.reversed ? card.rev : card.up}</p>
              </m.li>
            );
          })}
        </ul>

        <section className="meaning">
          <h2>Padrões do conjunto</h2>
          <ul className="questions">
            {reading.patterns.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>

        <section className="meaning">
          <h2>Leitura inteligente</h2>
          {reading.aiText ? (
            <p className="ai-text">{reading.aiText}</p>
          ) : (
            <>
              <p className="ai-status">
                {insightsLeft === 0
                  ? "Já usaste as leituras inteligentes de hoje, volta amanhã."
                  : insightsLeft === 1
                    ? "Tens 1 leitura inteligente hoje."
                    : "Tens " + insightsLeft + " leituras inteligentes hoje."}
              </p>
              <button
                type="button"
                className="gold-btn"
                onClick={onInsight}
                disabled={aiBusy || insightsLeft === 0}
              >
                {aiBusy ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
                {aiBusy ? "A interpretar…" : "Leitura inteligente"}
              </button>
              {aiMessage && <p className="ai-status ai-fallback">{aiMessage}</p>}
              <p className="ai-privacy">
                A pergunta e as cartas são enviadas de forma segura, apenas para gerar esta
                interpretação. São tratadas como informação confidencial e não são usadas para
                treinar modelos.
              </p>
            </>
          )}
        </section>

        <section className="meaning">
          <h2>
            Notas {notesSaved && <em className="saved-flag">guardado</em>}
          </h2>
          <textarea
            className="diary"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="As tuas notas sobre esta leitura ficam guardadas só neste dispositivo."
            rows={4}
            aria-label="Notas sobre esta leitura"
          />
        </section>
      </div>
    </main>
  );
}
