"use client";

import { useCallback, useRef } from "react";

// O arco. Elemento assinatura da app. Um mostrador de 1 a 5, arrastavel
// com o polegar, deliberadamente parecido com a roda do Sectograph.
// Movimento so onde transporta informacao: o arco segue o dedo.

const R = 80;
const CX = 100;
const CY = 100;

// Uma palavra por valor. So um numero de 1 a 5 obriga a decidir o que
// significa cada ponto, e a decisao muda de dia para dia, o que torna o
// registo inutil para comparar. A palavra fixa o significado.
const NIVEIS = ["", "no fundo", "fraca", "media", "boa", "cheia"];

// Angulo (graus) para um valor. Valor 1 a esquerda (180), 5 a direita (0).
function anguloDe(valor: number): number {
  const f = (valor - 1) / 4; // 0..1
  return 180 - f * 180;
}

function ponto(anguloGraus: number): [number, number] {
  const r = (anguloGraus * Math.PI) / 180;
  return [CX + R * Math.cos(r), CY - R * Math.sin(r)];
}

// Constroi um caminho amostrado entre dois valores. Simples e sempre
// correcto, sem ter de acertar large-arc nem sweep.
function caminho(vInicio: number, vFim: number): string {
  const passos = 48;
  const a0 = anguloDe(vInicio);
  const a1 = anguloDe(vFim);
  let d = "";
  for (let i = 0; i <= passos; i++) {
    const a = a0 + ((a1 - a0) * i) / passos;
    const [x, y] = ponto(a);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2) + " ";
  }
  return d.trim();
}

export default function Arco({
  rotulo,
  valor,
  aoMudar,
  acento,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (v: number) => void;
  acento: string;
}) {
  const refSvg = useRef<SVGSVGElement>(null);

  const valorDeEvento = useCallback((clientX: number, clientY: number): number => {
    const svg = refSvg.current;
    if (!svg) return valor;
    const rect = svg.getBoundingClientRect();
    // Converter para unidades do viewBox (200 x 120).
    const x = ((clientX - rect.left) / rect.width) * 200;
    const y = ((clientY - rect.top) / rect.height) * 120;
    const dx = x - CX;
    const dy = CY - y; // para cima positivo
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180
    if (ang < 0) ang = 0;
    if (ang > 180) ang = 180;
    const f = (180 - ang) / 180; // 0 a esquerda, 1 a direita
    const v = Math.round(1 + f * 4);
    return Math.min(5, Math.max(1, v));
  }, [valor]);

  function aoApontar(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    aoMudar(valorDeEvento(e.clientX, e.clientY));
  }

  function aoMover(e: React.PointerEvent<SVGSVGElement>) {
    if (e.buttons === 0 && e.pointerType === "mouse") return;
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    aoMudar(valorDeEvento(e.clientX, e.clientY));
  }

  const [tx, ty] = ponto(anguloDe(valor));

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="flex items-baseline gap-3 w-full max-w-xs justify-between px-2">
        <span className="text-base text-[var(--color-tinta)]">{rotulo}</span>
        <span className="flex items-baseline gap-2">
          <span className="text-sm text-[var(--color-tinta-fraca)]">
            {NIVEIS[valor]}
          </span>
          <span className="mono text-2xl" style={{ color: acento }}>
            {valor}
          </span>
        </span>
      </div>
      <svg
        ref={refSvg}
        viewBox="0 0 200 120"
        className="w-full max-w-xs touch-none"
        role="slider"
        aria-label={rotulo}
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={valor}
        aria-valuetext={`${valor} de 5, ${NIVEIS[valor]}`}
        tabIndex={0}
        onPointerDown={aoApontar}
        onPointerMove={aoMover}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") aoMudar(Math.min(5, valor + 1));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") aoMudar(Math.max(1, valor - 1));
        }}
      >
        {/* Trilho neutro */}
        <path d={caminho(1, 5)} fill="none" stroke="var(--color-traco)" strokeWidth="10" strokeLinecap="round" />
        {/* Preenchimento ate ao valor */}
        <path d={caminho(1, valor)} fill="none" stroke={acento} strokeWidth="10" strokeLinecap="round" />
        {/* Marcas dos cinco pontos */}
        {[1, 2, 3, 4, 5].map((v) => {
          const [mx, my] = ponto(anguloDe(v));
          return <circle key={v} cx={mx} cy={my} r="2.5" fill="var(--color-breu)" />;
        })}
        {/* Agulha */}
        <circle cx={tx} cy={ty} r="11" fill={acento} />
        <circle cx={tx} cy={ty} r="4" fill="var(--color-breu)" />
        {/* Extremos nomeados. Sem isto nao se sabe de que lado e pouco. */}
        <text
          x={CX - R}
          y="118"
          textAnchor="middle"
          fontSize="11"
          fill="var(--color-tinta-fraca)"
        >
          vazia
        </text>
        <text
          x={CX + R}
          y="118"
          textAnchor="middle"
          fontSize="11"
          fill="var(--color-tinta-fraca)"
        >
          cheia
        </text>
      </svg>
    </div>
  );
}
