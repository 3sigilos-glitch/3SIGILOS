// A mare do ecra de entrada. Duas ondas suaves, social e sensorial, que
// sobem e descem devagar. So aparece na entrada, e o movimento respeita
// prefers-reduced-motion (a regra global anula a animacao).

const LARGURA = 800; // o dobro do viewBox, para a deriva ser continua
const ALTURA = 160;

// Area preenchida por baixo de uma onda sinusoidal.
function areaOnda(cy: number, amp: number, comprimento: number, fase: number): string {
  const passos = 120;
  let d = "";
  for (let i = 0; i <= passos; i++) {
    const x = (LARGURA * i) / passos;
    const y = cy + amp * Math.sin((2 * Math.PI * x) / comprimento + fase);
    d += (i === 0 ? `M${x.toFixed(1)} ${y.toFixed(1)}` : ` L${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  d += ` L${LARGURA} ${ALTURA} L0 ${ALTURA} Z`;
  return d;
}

export default function MareVisual() {
  const cy = 92;
  // comprimento divide 400 em partes inteiras, para a deriva de -50% fechar certo
  const comprimento = 200;

  return (
    <div className="w-full overflow-hidden" aria-hidden>
      <svg viewBox="0 0 400 160" className="w-full" preserveAspectRatio="none" style={{ height: "9rem" }}>
        {/* Linha de agua */}
        <line x1="0" y1={cy} x2="400" y2={cy} stroke="var(--color-traco)" strokeWidth="1" opacity="0.7" />

        {/* Sensorial, malva, mais lenta atras */}
        <g className="mare-onda mare-onda-a">
          <path d={areaOnda(cy + 10, 13, comprimento, Math.PI * 0.65)} fill="var(--color-ac-nos)" fillOpacity="0.16" />
          <path
            d={areaOnda(cy + 10, 13, comprimento, Math.PI * 0.65).replace(/ L800 160 L0 160 Z$/, "")}
            fill="none"
            stroke="var(--color-ac-nos)"
            strokeWidth="2"
            strokeOpacity="0.7"
          />
        </g>

        {/* Social, musgo, a frente */}
        <g className="mare-onda mare-onda-b">
          <path d={areaOnda(cy, 16, comprimento, 0)} fill="var(--color-ac-bateria)" fillOpacity="0.18" />
          <path
            d={areaOnda(cy, 16, comprimento, 0).replace(/ L800 160 L0 160 Z$/, "")}
            fill="none"
            stroke="var(--color-ac-bateria)"
            strokeWidth="2.5"
          />
        </g>
      </svg>
    </div>
  );
}
