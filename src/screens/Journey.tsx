import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { m, useReducedMotion } from "framer-motion";
import { Pause, Play, SkipBack, SkipForward, Infinity as InfinityIcon } from "lucide-react";
import { CARDS, Card } from "../data";
import { FOOL_JOURNEY } from "../data/fool-journey";
import { useSpeech } from "../lib/speech";
import { haptic } from "../lib/storage";
import { CardImg } from "../components/CardImg";

const MAJORS: Card[] = CARDS.filter((c) => c.cat === "major");
const RATES = [0.75, 1, 1.25, 1.5];

interface Point {
  x: number;
  y: number;
}

/* Constrói um caminho suave que passa por todos os nós do trilho. */
function buildPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY}, ${p1.x} ${midY}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export function Journey() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [points, setPoints] = useState<Point[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(reduced ?? false);
  const suppressObserver = useRef(false);

  const speech = useSpeech((index) => {
    goTo(index, false);
  });

  const tracks = useMemo(
    () =>
      FOOL_JOURNEY.map((ch) => ({
        id: ch.cardEn,
        title: ch.roman === "0" ? ch.title : ch.roman + ". " + ch.title,
        text: ch.text,
      })),
    []
  );

  // Mede as posições dos nós para desenhar o caminho e posicionar o orbe.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const cRect = container.getBoundingClientRect();
      const pts = nodeRefs.current.map((el, i) => {
        if (!el) return { x: 0, y: 0 };
        const r = el.getBoundingClientRect();
        // Âncora na margem interior da carta (o lado do texto), para o
        // caminho serpentear entre as cartas sem o orbe as tapar.
        const x = i % 2 === 0 ? r.right - cRect.left + 14 : r.left - cRect.left - 14;
        return { x, y: r.top - cRect.top + r.height / 2 };
      });
      setPoints(pts);
      setSize({ w: container.offsetWidth, h: container.offsetHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Sincroniza o capítulo activo com o scroll.
  useEffect(() => {
    const sections = nodeRefs.current.filter(Boolean) as HTMLDivElement[];
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (suppressObserver.current) return;
        for (const e of entries) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index);
            setActive(i);
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [entered]);

  useEffect(() => {
    if (reduced) {
      setEntered(true);
      return;
    }
    const t = window.setTimeout(() => setEntered(true), 3400);
    return () => window.clearTimeout(t);
  }, [reduced]);

  function goTo(index: number, fromTap: boolean) {
    setActive(index);
    if (fromTap) haptic(8);
    suppressObserver.current = true;
    nodeRefs.current[index]?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
    window.setTimeout(() => {
      suppressObserver.current = false;
    }, 900);
  }

  function onPlayPause() {
    haptic(10);
    if (speech.status === "idle") {
      speech.playTracks(tracks, active);
    } else {
      speech.toggle();
    }
  }

  const pathD = buildPath(points);
  const orb = points[active];

  return (
    <main className="journey">
      <div className="stars stars-far" aria-hidden="true" />
      <div className="stars stars-near" aria-hidden="true" />
      <div className="candle-glow" aria-hidden="true" />

      <header className="journey-head">
        <h1>A Jornada do Louco</h1>
        <p>
          Os 22 Arcanos Maiores contam uma única viagem: a do Louco, do salto inicial à dança
          final do Mundo. Percorre o caminho, ou deixa que a voz o conte.
        </p>
      </header>

      <div className="trail" ref={containerRef}>
        {size.h > 0 && (
          <svg
            className="trail-svg"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="trailGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e7cf92" stopOpacity="0.9" />
                <stop offset="1" stopColor="#b89344" stopOpacity="0.45" />
              </linearGradient>
            </defs>
            <m.path
              d={pathD}
              fill="none"
              stroke="url(#trailGold)"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.75"
              initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : 2.6, delay: reduced ? 0 : 0.7, ease: "easeInOut" }}
            />
          </svg>
        )}

        {!reduced && orb && (
          <m.div
            className="orb"
            aria-hidden="true"
            initial={false}
            animate={{ left: orb.x, top: orb.y }}
            transition={{ type: "spring", stiffness: 42, damping: 15 }}
          />
        )}

        {FOOL_JOURNEY.map((ch, i) => {
          const card = MAJORS[i];
          const isActive = i === active;
          return (
            <m.section
              key={ch.cardEn}
              className={"chapter" + (isActive ? " active" : "") + (i % 2 ? " right" : " left")}
              initial={reduced ? false : { opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: reduced ? 0 : 0.55 + i * 0.09, ease: "easeOut" }}
            >
              <div
                className="chapter-node"
                data-index={i}
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
              >
                <button
                  type="button"
                  className="chapter-card"
                  onClick={() => goTo(i, true)}
                  aria-label={"Ir para o capítulo " + ch.title}
                >
                  <CardImg card={card} width={240} />
                </button>
              </div>
              <div className="chapter-text">
                <p className="eyebrow">{ch.roman} · {card.pt}</p>
                <h2>{ch.title}</h2>
                <ChapterBody
                  text={ch.text}
                  highlightChar={
                    speech.status !== "idle" && speech.trackIndex === i
                      ? speech.charIndex - (tracks[i].title.length + 2)
                      : -1
                  }
                />
              </div>
            </m.section>
          );
        })}
      </div>

      <div className="audio-bar" role="group" aria-label="Áudio da jornada">
        <button
          type="button"
          className="icon-btn"
          aria-label="Capítulo anterior"
          onClick={() => (speech.status === "idle" ? goTo(Math.max(0, active - 1), true) : speech.prev())}
        >
          <SkipBack size={19} />
        </button>
        <button
          type="button"
          className="icon-btn play-btn"
          aria-label={speech.status === "playing" ? "Pausa" : "Ouvir"}
          onClick={onPlayPause}
          disabled={!speech.supported}
        >
          {speech.status === "playing" ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Capítulo seguinte"
          onClick={() => (speech.status === "idle" ? goTo(Math.min(21, active + 1), true) : speech.next())}
        >
          <SkipForward size={19} />
        </button>
        <span className="audio-pos">
          {FOOL_JOURNEY[speech.status === "idle" ? active : speech.trackIndex]?.roman ?? "0"} de XXII
        </span>
        <button
          type="button"
          className="rate-btn"
          aria-label="Velocidade da voz"
          onClick={() => speech.setRate(RATES[(RATES.indexOf(speech.rate) + 1) % RATES.length])}
        >
          {speech.rate}x
        </button>
        <button
          type="button"
          className={"icon-btn" + (speech.autoAdvance ? " on" : "")}
          aria-pressed={speech.autoAdvance}
          aria-label="Avançar capítulos automaticamente"
          title="Auto-avanço"
          onClick={() => speech.setAutoAdvance(!speech.autoAdvance)}
        >
          <InfinityIcon size={19} />
        </button>
      </div>

      {!speech.hasPtVoice && speech.supported && (
        <p className="voice-note">
          Este dispositivo não tem voz em português instalada: a leitura usa a voz por defeito.
        </p>
      )}
    </main>
  );
}

/* Texto do capítulo com destaque da frase a ser lida, quando o
   dispositivo suporta eventos de fronteira da síntese de voz. */
function ChapterBody({ text, highlightChar }: { text: string; highlightChar: number }) {
  const sentences = useMemo(() => {
    const parts = text.split(/(?<=\.)\s+/);
    let offset = 0;
    return parts.map((s) => {
      const start = offset;
      offset += s.length + 1;
      return { s, start, end: offset };
    });
  }, [text]);

  if (highlightChar < 0) return <p>{text}</p>;
  return (
    <p>
      {sentences.map(({ s, start, end }, i) => (
        <span key={i} className={highlightChar >= start && highlightChar < end ? "reading" : undefined}>
          {s}{" "}
        </span>
      ))}
    </p>
  );
}
