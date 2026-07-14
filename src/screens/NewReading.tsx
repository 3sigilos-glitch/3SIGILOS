import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { m, useReducedMotion } from "framer-motion";
import { ChevronLeft, RotateCcw, X } from "lucide-react";
import { Card, cardBySlug } from "../data";
import { positionsFor, spreadById } from "../data/spreads";
import { readPatterns, yesNoFor } from "../lib/patterns";
import { Reading, newReadingId, saveReading } from "../lib/readings";
import { haptic } from "../lib/storage";
import { CardImg } from "../components/CardImg";
import { CardPicker } from "../components/CardPicker";

interface Slot {
  slug: string;
  reversed: boolean;
}

export function NewReading() {
  const { spreadId = "" } = useParams();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const spread = spreadById(spreadId);

  const [framingId, setFramingId] = useState(spread?.framings?.[0]?.id);
  const [question, setQuestion] = useState("");
  const [slots, setSlots] = useState<(Slot | null)[]>(() =>
    spread ? new Array(positionsFor(spread, framingId).length).fill(null) : []
  );
  const [picking, setPicking] = useState<number | null>(null);

  const positions = useMemo(
    () => (spread ? positionsFor(spread, framingId) : []),
    [spread, framingId]
  );

  if (!spread) {
    return (
      <main className="readings">
        <p className="empty">Esquema não encontrado.</p>
      </main>
    );
  }

  const usedSlugs = slots.filter(Boolean).map((s) => s!.slug);
  const complete = slots.length === positions.length && slots.every(Boolean);

  function chooseFraming(id: string) {
    setFramingId(id);
    setSlots(new Array(positionsFor(spread!, id).length).fill(null));
  }

  function assign(index: number, card: Card) {
    haptic(10);
    setSlots((s) => {
      const next = [...s];
      next[index] = { slug: card.slug, reversed: false };
      return next;
    });
    setPicking(null);
  }

  function flip(index: number) {
    haptic(8);
    setSlots((s) => {
      const next = [...s];
      if (next[index]) next[index] = { ...next[index]!, reversed: !next[index]!.reversed };
      return next;
    });
  }

  function clear(index: number) {
    setSlots((s) => {
      const next = [...s];
      next[index] = null;
      return next;
    });
  }

  function finish() {
    const drawn = slots.map((s) => ({ card: cardBySlug(s!.slug)!, reversed: s!.reversed }));
    const reading: Reading = {
      id: newReadingId(),
      createdAt: Date.now(),
      spreadId: spread!.id,
      framingId,
      question: question.trim(),
      cards: slots.map((s) => ({ slug: s!.slug, reversed: s!.reversed })),
      patterns: readPatterns(drawn),
      yesNo: spread!.yesNo ? yesNoFor(drawn[0]) : undefined,
      notes: "",
    };
    saveReading(reading);
    haptic(16);
    navigate("/leituras/" + reading.id, { replace: true });
  }

  return (
    <main className="readings new-reading">
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="detail-pos">{spread.name}</span>
        <span className="detail-bar-spacer" />
      </div>

      <div className="new-reading-body">
        {spread.framings && (
          <div className="framing-row" role="tablist" aria-label="Enquadramento">
            {spread.framings.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={framingId === f.id}
                className={"guide-tab" + (framingId === f.id ? " active" : "")}
                onClick={() => chooseFraming(f.id)}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        <textarea
          className="diary question-field"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={
            spread.yesNo
              ? "A tua pergunta fechada (opcional)…"
              : "A tua pergunta ou intenção (opcional)…"
          }
          rows={2}
          aria-label="Pergunta ou intenção"
        />

        <p className="insert-hint">
          Tira as cartas no baralho e insere-as aqui, pela ordem das posições. Marca as que
          saíram invertidas.
        </p>

        <ul className="pos-list">
          {positions.map((pos, i) => {
            const slot = slots[i];
            const card = slot ? cardBySlug(slot.slug) : null;
            return (
              <li key={pos.name + i} className="pos-row">
                <div className="pos-info">
                  <span className="pos-num">{i + 1}</span>
                  <span>
                    <strong>{pos.name}</strong>
                    <small>{pos.about}</small>
                  </span>
                </div>
                {card ? (
                  <m.div
                    className="pos-card"
                    initial={reduced ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <span className={"pos-thumb" + (slot!.reversed ? " flip-rev" : "")}>
                      <CardImg card={card} width={96} />
                    </span>
                    <span className="pos-names">
                      <strong>{card.pt}</strong>
                      <small>{slot!.reversed ? "Invertida" : "Direita"}</small>
                    </span>
                    <span className="pos-actions">
                      <button
                        type="button"
                        className={"icon-btn" + (slot!.reversed ? " on" : "")}
                        aria-pressed={slot!.reversed}
                        aria-label="Marcar como invertida"
                        title="Invertida"
                        onClick={() => flip(i)}
                      >
                        <RotateCcw size={18} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label="Tirar esta carta"
                        onClick={() => clear(i)}
                      >
                        <X size={18} />
                      </button>
                    </span>
                  </m.div>
                ) : (
                  <button type="button" className="ghost-btn pos-add" onClick={() => setPicking(i)}>
                    Escolher carta
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="gold-btn finish-btn"
          disabled={!complete}
          onClick={finish}
        >
          Concluir leitura
        </button>
      </div>

      {picking !== null && (
        <CardPicker
          title={positions[picking].name}
          usedSlugs={usedSlugs}
          onPick={(c) => assign(picking, c)}
          onClose={() => setPicking(null)}
        />
      )}
    </main>
  );
}
