import React from "react";
import { useAnimatedValue } from "./useAnimatedValue.js";

const CX = 150;
const CY = 150;
const R = 112;
const START = 150;
const SWEEP = 240;
const LEN = 1000;

const polar = (r, deg) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
};
const arc = (r, from, to) => {
  const a = polar(r, from);
  const b = polar(r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
};

const MIN = 40;
const MAX = 130;

/** Temperatura do liquido de refrigeracao. Frio em azul, acima de 105 em vermelho. */
export default function TempGauge({ value, available = true }) {
  const animated = useAnimatedValue(available ? value ?? MIN : MIN, 0.4);
  const clamped = Math.max(MIN, Math.min(MAX, animated));
  const frac = (clamped - MIN) / (MAX - MIN);
  const angle = START + frac * SWEEP;

  const cold = available && value !== null && value < 60;
  const hot = available && value !== null && value >= 105;
  const accent = hot ? "#ff3b21" : cold ? "#5fd7e6" : "#ff8419";

  const ticks = [];
  for (let v = MIN; v <= MAX; v += 10) {
    const a = START + ((v - MIN) / (MAX - MIN)) * SWEEP;
    const o = polar(R + 12, a);
    const i = polar(R + 12 - (v % 20 === 0 ? 14 : 8), a);
    ticks.push({ v, x1: o.x, y1: o.y, x2: i.x, y2: i.y, major: v % 20 === 0 });
  }

  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="tglow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path d={arc(R, START, START + SWEEP)} fill="none" stroke="#161d27" strokeWidth="14" />
      <path
        d={arc(R, START, START + (60 - MIN) / (MAX - MIN) * SWEEP)}
        fill="none"
        stroke="#11343d"
        strokeWidth="14"
      />
      <path
        d={arc(R, START + ((105 - MIN) / (MAX - MIN)) * SWEEP, START + SWEEP)}
        fill="none"
        stroke="#7c1f12"
        strokeWidth="14"
      />
      <path
        d={arc(R, START, START + SWEEP)}
        fill="none"
        stroke={accent}
        strokeWidth="14"
        pathLength={LEN}
        strokeDasharray={LEN}
        strokeDashoffset={LEN * (1 - (available ? frac : 0))}
        filter="url(#tglow)"
        opacity={available ? 0.95 : 0.12}
      />

      {ticks.map((t) => (
        <line
          key={t.v}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.major ? "#cdc8bd" : "#59616f"}
          strokeWidth={t.major ? 2.6 : 1.4}
        />
      ))}

      <text
        x={CX}
        y={CY - 34}
        fill="#7d8698"
        fontSize="13"
        letterSpacing="4"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
      >
        LIQUIDO
      </text>

      {/* O arco vai de 150&deg; a 390&deg;, por isso a base do mostrador esta
          sempre livre: e ai que vive a leitura digital. */}
      <text
        x={CX - 10}
        y={CY + 78}
        fill={available ? "#f2efe9" : "#4a5260"}
        fontSize="58"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="Rajdhani, sans-serif"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {available && value !== null ? Math.round(value) : "--"}
      </text>
      <text
        x={CX + 34}
        y={CY + 78}
        fill="#6b7383"
        fontSize="20"
        textAnchor="start"
        fontFamily="JetBrains Mono, monospace"
      >
        &#176;C
      </text>
      {(cold || hot) && (
        <text
          x={CX}
          y={CY + 106}
          fill={accent}
          fontSize="13"
          letterSpacing="2.5"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
        >
          {hot ? "SOBREAQUECIMENTO" : "MOTOR FRIO"}
        </text>
      )}

      <g transform={`rotate(${angle} ${CX} ${CY})`} opacity={available ? 1 : 0.25}>
        <polygon
          points={`${CX - 10},${CY} ${CX + 8},${CY - 4} ${CX + R - 4},${CY - 1.3} ${CX + R - 4},${CY + 1.3} ${CX + 8},${CY + 4}`}
          fill={accent}
          filter="url(#tglow)"
        />
      </g>
      <circle cx={CX} cy={CY} r="12" fill="#0c1119" stroke="#2a3443" strokeWidth="2" />
      <circle cx={CX} cy={CY} r="4" fill={accent} />
    </svg>
  );
}
