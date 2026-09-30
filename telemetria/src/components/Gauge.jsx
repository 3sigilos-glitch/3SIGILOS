import React, { useMemo } from "react";
import { useAnimatedValue } from "./useAnimatedValue.js";

const CX = 200;
const CY = 200;
const R_ARC = 160; // raio do arco de progresso
const R_TICK = 150; // raio exterior dos tracos
const R_LABEL = 115; // raio dos numeros da escala
const START = 135; // graus, canto inferior esquerdo
const SWEEP = 270; // abertura total do mostrador
const PATH_LEN = 1000; // comprimento normalizado, para o stroke-dashoffset

const polar = (r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};

const arcPath = (r, fromDeg, toDeg) => {
  const a = polar(r, fromDeg);
  const b = polar(r, toDeg);
  const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

/**
 * Mostrador circular ao estilo dos paineis Mercedes do inicio dos anos 2000,
 * com o arco de progresso animado por stroke-dashoffset e o ponteiro rodado
 * por transform="rotate(...)".
 */
export default function Gauge({
  value = 0,
  min = 0,
  max = 100,
  redline = null,
  majorStep = 10,
  minorStep = 5,
  label = "",
  unit = "",
  scaleDivisor = 1,
  digits = 0,
  digitalValue = null,
  accent = "#ff6a00",
  sub = null,
  available = true,
}) {
  const uid = label.replace(/[^a-zA-Z0-9]/g, "") || "g";
  const animated = useAnimatedValue(value, 0.1);
  const clamped = Math.max(min, Math.min(max, animated));
  const frac = (clamped - min) / (max - min);
  const angle = START + frac * SWEEP;

  const ticks = useMemo(() => {
    const out = [];
    for (let v = min; v <= max + 1e-6; v += minorStep) {
      const isMajor = Math.abs((v - min) % majorStep) < 1e-6;
      const a = START + ((v - min) / (max - min)) * SWEEP;
      const outer = polar(R_TICK, a);
      const inner = polar(R_TICK - (isMajor ? 20 : 10), a);
      const hot = redline !== null && v >= redline;
      out.push({ v, isMajor, hot, x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y });
      if (isMajor) {
        const t = polar(R_LABEL, a);
        out[out.length - 1].labelX = t.x;
        out[out.length - 1].labelY = t.y;
      }
    }
    return out;
  }, [min, max, majorStep, minorStep, redline]);

  const redFrom = redline === null ? null : START + ((redline - min) / (max - min)) * SWEEP;
  const shown = digitalValue !== null ? digitalValue : value;

  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id={`dial-${uid}`} cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#141b25" />
          <stop offset="62%" stopColor="#0a0e14" />
          <stop offset="100%" stopColor="#04060a" />
        </radialGradient>
        <linearGradient id={`needle-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* aro e fundo do mostrador */}
      <circle cx={CX} cy={CY} r="190" fill={`url(#dial-${uid})`} />
      <circle cx={CX} cy={CY} r="190" fill="none" stroke="#1d2734" strokeWidth="3" />
      <circle cx={CX} cy={CY} r="183" fill="none" stroke="#0c1119" strokeWidth="8" />

      {/* calha do arco */}
      <path d={arcPath(R_ARC, START, START + SWEEP)} fill="none" stroke="#161d27" strokeWidth="12" strokeLinecap="butt" />

      {/* zona vermelha */}
      {redFrom !== null && (
        <path
          d={arcPath(R_ARC, redFrom, START + SWEEP)}
          fill="none"
          stroke="#7c1f12"
          strokeWidth="12"
          strokeLinecap="butt"
        />
      )}

      {/* arco de progresso, animado por stroke-dashoffset */}
      <path
        d={arcPath(R_ARC, START, START + SWEEP)}
        fill="none"
        stroke={accent}
        strokeWidth="12"
        strokeLinecap="butt"
        pathLength={PATH_LEN}
        strokeDasharray={PATH_LEN}
        strokeDashoffset={PATH_LEN * (1 - (available ? frac : 0))}
        filter={`url(#glow-${uid})`}
        opacity={available ? 0.95 : 0.15}
      />

      {/* escala */}
      <g>
        {ticks.map((t) => (
          <line
            key={t.v}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.hot ? "#ff3b21" : t.isMajor ? "#d9d5cc" : "#5d6675"}
            strokeWidth={t.isMajor ? 3.5 : 1.6}
            strokeLinecap="butt"
          />
        ))}
        {ticks
          .filter((t) => t.isMajor)
          .map((t) => (
            <text
              key={`l-${t.v}`}
              x={t.labelX}
              y={t.labelY}
              fill={t.hot ? "#ff5b3b" : "#cdc8bd"}
              fontSize="20"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Rajdhani, sans-serif"
            >
              {Math.round(t.v / scaleDivisor)}
            </text>
          ))}
      </g>

      {/* etiquetas */}
      <text
        x={CX}
        y={CY - 70}
        fill="#7d8698"
        fontSize="13"
        letterSpacing="3"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
      >
        {label}
      </text>
      <text
        x={CX}
        y={CY - 48}
        fill="#5c6472"
        fontSize="11.5"
        letterSpacing="2"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
      >
        {unit}
      </text>

      {/* leitura digital, deslocada para baixo do pivo para nao bater
          com os numeros da escala nem ficar debaixo do ponteiro */}
      <text
        x={CX}
        y={CY + 64}
        fill={available ? "#f2efe9" : "#4a5260"}
        fontSize="58"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="Rajdhani, sans-serif"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {available ? Number(shown).toFixed(digits) : "--"}
      </text>

      {sub && (
        <text
          x={CX}
          y={CY + 100}
          fill={accent}
          fontSize="14"
          letterSpacing="3"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
        >
          {sub}
        </text>
      )}

      {/* ponteiro */}
      <g transform={`rotate(${angle} ${CX} ${CY})`} opacity={available ? 1 : 0.25}>
        <polygon
          points={`${CX - 14},${CY} ${CX + 12},${CY - 5.5} ${CX + R_TICK - 6},${CY - 1.6} ${CX + R_TICK - 6},${CY + 1.6} ${CX + 12},${CY + 5.5}`}
          fill={`url(#needle-${uid})`}
          filter={`url(#glow-${uid})`}
        />
      </g>
      <circle cx={CX} cy={CY} r="17" fill="#0c1119" stroke="#2a3443" strokeWidth="2" />
      <circle cx={CX} cy={CY} r="5" fill={accent} />
    </svg>
  );
}
