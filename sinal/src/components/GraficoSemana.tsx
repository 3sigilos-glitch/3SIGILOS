// Grafico da ultima semana. Dois paineis empilhados, um por escala.
// Sem numeros por cima dos pontos, por opcao. So a forma interessa.
//
// Antes era um so painel com as duas linhas. Deixou de dar quando a
// escala sensorial passou a medir carga em vez de bateria: as duas
// linhas passaram a subir por motivos opostos, e um eixo so nao pode
// dizer "cheia" em cima para uma e "saturado" em cima para a outra.
// Dois paineis alinhados na mesma coluna de dias resolvem sem obrigar a
// segurar duas regras ao mesmo tempo.

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

const L = 66; // margem esquerda, com espaco para as palavras da escala
const R = 22; // espaco para o rotulo "hoje" nao sair pela borda
const W = 320;
const ALTURA_PAINEL = 78;
const ESPACO = 30; // entre o fim de um painel e o titulo do seguinte
const TOPO = 16; // do titulo ate a primeira linha da grelha
const BASE_DIAS = 18; // altura reservada aos nomes dos dias
const H = TOPO + ALTURA_PAINEL + ESPACO + TOPO + ALTURA_PAINEL + BASE_DIAS;

const areaW = W - L - R;

export default function GraficoSemana({
  registos,
  dias = 7,
}: {
  registos: Registo[];
  dias?: number;
}) {
  const dados = agruparPorDia(registos, dias);
  const x = (i: number) => L + (areaW * i) / Math.max(1, dias - 1);

  // Topo de cada painel, dentro do SVG
  const topoSocial = TOPO;
  const topoSensorial = TOPO + ALTURA_PAINEL + ESPACO + TOPO;

  const temDados = dados.some((d) => d.social !== null || d.sensorial !== null);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Social e sensorial da última semana"
      >
        <Painel
          topo={topoSocial}
          cor="var(--color-ac-bateria)"
          titulo="Social, quanto restou"
          escala={[
            { v: 5, rotulo: "cheia 5" },
            { v: 3, rotulo: "3" },
            { v: 1, rotulo: "vazia 1" },
          ]}
          pontos={dados
            .map((d, i) => ({ v: d.social, i }))
            .filter((p) => p.v !== null)
            .map((p) => ({ x: x(p.i), y: yEm(topoSocial, p.v as number) }))}
        />

        <Painel
          topo={topoSensorial}
          cor="var(--color-ac-nos)"
          titulo="Sensorial, quanto entrou"
          escala={[
            { v: 5, rotulo: "saturado 5" },
            { v: 3, rotulo: "3" },
            { v: 1, rotulo: "calmo 1" },
          ]}
          pontos={dados
            .map((d, i) => ({ v: d.sensorial, i }))
            .filter((p) => p.v !== null)
            .map((p) => ({ x: x(p.i), y: yEm(topoSensorial, p.v as number) }))}
        />

        {/* Nomes dos dias, uma vez so. Os dois paineis partilham a
            mesma coluna, por isso um eixo chega para os dois. */}
        {dados.map((d, i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 5}
            textAnchor="middle"
            fontSize="9"
            fill={i === dados.length - 1 ? "var(--color-tinta)" : "var(--color-tinta-fraca)"}
            fontFamily="var(--font-mono)"
          >
            {i === dados.length - 1 ? "hoje" : d.rotulo}
          </text>
        ))}
      </svg>

      {!temDados && (
        <p className="text-center text-[var(--color-tinta-fraca)] text-sm mt-3">
          Ainda sem registos nesta semana. São três toques.
        </p>
      )}
    </div>
  );
}

// Posicao vertical de um valor dentro de um painel que comeca em `topo`.
function yEm(topo: number, valor: number): number {
  return topo + ALTURA_PAINEL * (1 - (valor - 1) / 4);
}

function Painel({
  topo,
  cor,
  titulo,
  escala,
  pontos,
}: {
  topo: number;
  cor: string;
  titulo: string;
  escala: { v: number; rotulo: string }[];
  pontos: { x: number; y: number }[];
}) {
  return (
    <g>
      {/* Titulo do painel, com a cor da linha ao lado. A legenda vive
          aqui em cima e nao no fundo: assim le se antes do grafico e nao
          e preciso voltar atras para saber o que se esta a ver. */}
      <circle cx={L + 4} cy={topo - 9} r="3.5" fill={cor} />
      <text
        x={L + 13}
        y={topo - 9}
        dominantBaseline="middle"
        fontSize="10"
        fill="var(--color-tinta)"
      >
        {titulo}
      </text>

      {[1, 2, 3, 4, 5].map((v) => (
        <line
          key={v}
          x1={L}
          y1={yEm(topo, v)}
          x2={W - R}
          y2={yEm(topo, v)}
          stroke="var(--color-traco)"
          strokeWidth="1"
          opacity={v === 1 || v === 5 ? 0.9 : 0.3}
        />
      ))}

      {escala.map(({ v, rotulo }) => (
        <text
          key={`e${v}`}
          x={L - 8}
          y={yEm(topo, v)}
          textAnchor="end"
          dominantBaseline="middle"
          fontSize="9"
          fill="var(--color-tinta-fraca)"
        >
          {rotulo}
        </text>
      ))}

      <path
        d={caminhoSuave(pontos)}
        fill="none"
        stroke={cor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pontos.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={cor} />
      ))}
    </g>
  );
}
