// Grafico da ultima semana: duas linhas suaves, eixo do tempo em dias.
// Sem numeros por cima dos pontos, por opcao. So a forma interessa.

export type Registo = {
  registado_em: string;
  social: number;
  sensorial: number;
};

type Dia = { rotulo: string; social: number | null; sensorial: number | null };

const DIAS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function agruparPorDia(registos: Registo[], numDias: number): Dia[] {
  const hoje = new Date();
  const dias: Dia[] = [];
  for (let i = numDias - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    const doDia = registos.filter(
      (r) => new Date(r.registado_em).toISOString().slice(0, 10) === chave
    );
    const media = (vals: number[]) =>
      vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    dias.push({
      rotulo: DIAS_PT[d.getDay()],
      social: media(doDia.map((r) => r.social)),
      sensorial: media(doDia.map((r) => r.sensorial)),
    });
  }
  return dias;
}

// Caminho suave (Catmull-Rom convertido em Bezier) ignorando lacunas.
function caminhoSuave(pontos: { x: number; y: number }[]): string {
  if (pontos.length === 0) return "";
  if (pontos.length === 1) return `M ${pontos[0].x} ${pontos[0].y}`;
  let d = `M ${pontos[0].x} ${pontos[0].y}`;
  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] ?? pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function GraficoSemana({
  registos,
  dias = 7,
}: {
  registos: Registo[];
  dias?: number;
}) {
  const dados = agruparPorDia(registos, dias);

  const L = 46; // margem esquerda, com espaco para a escala
  const R = 8; // margem direita
  const T = 10;
  const B = 22;
  const W = 320;
  const H = 150;
  const areaW = W - L - R;
  const areaH = H - T - B;

  const x = (i: number) => L + (areaW * i) / Math.max(1, dias - 1);
  const y = (v: number) => T + areaH * (1 - (v - 1) / 4); // 1 em baixo, 5 em cima

  const pontosDe = (chave: "social" | "sensorial") =>
    dados
      .map((d, i) => ({ v: d[chave], i }))
      .filter((p) => p.v !== null)
      .map((p) => ({ x: x(p.i), y: y(p.v as number) }));

  const social = pontosDe("social");
  const sensorial = pontosDe("sensorial");

  const temDados = social.length > 0 || sensorial.length > 0;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bateria da última semana">
        {/* Grelha, uma linha por valor */}
        {[1, 2, 3, 4, 5].map((v) => (
          <line
            key={v}
            x1={L}
            y1={y(v)}
            x2={W - R}
            y2={y(v)}
            stroke="var(--color-traco)"
            strokeWidth="1"
            opacity={v === 1 || v === 5 ? 0.9 : 0.35}
          />
        ))}

        {/* Escala a esquerda. Sem isto a altura de um ponto nao diz
            nada, e o grafico fica bonito mas ilegivel. As palavras sao
            as mesmas dos arcos, para nao haver dois vocabularios. */}
        {[1, 2, 3, 4, 5].map((v) => (
          <text
            key={`e${v}`}
            x={L - 8}
            y={y(v) + 3}
            textAnchor="end"
            fontSize="9"
            fill="var(--color-tinta-fraca)"
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        ))}
        <text x={L - 8} y={y(5) - 8} textAnchor="end" fontSize="8" fill="var(--color-tinta-fraca)">
          cheia
        </text>
        <text x={L - 8} y={y(1) + 14} textAnchor="end" fontSize="8" fill="var(--color-tinta-fraca)">
          vazia
        </text>
        {/* Serie social */}
        <path d={caminhoSuave(social)} fill="none" stroke="var(--color-ac-bateria)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {social.map((p, i) => (
          <circle key={`so${i}`} cx={p.x} cy={p.y} r="3" fill="var(--color-ac-bateria)" />
        ))}
        {/* Serie sensorial */}
        <path d={caminhoSuave(sensorial)} fill="none" stroke="var(--color-ac-nos)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {sensorial.map((p, i) => (
          <circle key={`se${i}`} cx={p.x} cy={p.y} r="3" fill="var(--color-ac-nos)" />
        ))}
        {/* Rotulos dos dias */}
        {dados.map((d, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="9"
            fill={i === dados.length - 1 ? "var(--color-tinta)" : "var(--color-tinta-fraca)"}
            fontFamily="var(--font-mono)"
          >
            {i === dados.length - 1 ? "hoje" : d.rotulo}
          </text>
        ))}
      </svg>
      <div className="flex gap-5 justify-center mt-2">
        <Legenda cor="var(--color-ac-bateria)" texto="Social" />
        <Legenda cor="var(--color-ac-nos)" texto="Sensorial" />
      </div>
      {!temDados && (
        <p className="text-center text-[var(--color-tinta-fraca)] text-sm mt-3">
          Ainda sem registos nesta semana. São três toques.
        </p>
      )}
    </div>
  );
}

// Legenda com a mesma forma da serie: linha e ponto, na cor da linha.
// Um traco sozinho nao se liga ao grafico tao depressa.
function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-2 text-sm text-[var(--color-tinta)]">
      <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden>
        <line x1="1" y1="5" x2="21" y2="5" stroke={cor} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="11" cy="5" r="3" fill={cor} />
      </svg>
      {texto}
    </span>
  );
}
