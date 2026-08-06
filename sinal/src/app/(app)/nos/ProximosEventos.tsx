import Seccao, { Vazio } from "@/components/Seccao";
import type { EventoVista } from "@/lib/google/calendario";

// O que ja esta marcado, vindo dos calendarios partilhados. So leitura.
//
// Nao substitui a roda do Sectograph, que continua a ser o sitio para
// ver a forma do dia. Aqui ve se a semana em lista, para o ponto a dois
// e para saber o que ai vem sem ter de sair da app.

const DIAS = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

function rotuloDia(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(d);
  alvo.setHours(0, 0, 0, 0);
  const diff = Math.round((+alvo - +hoje) / 86400000);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanha";
  return `${DIAS[alvo.getDay()]}, ${alvo.getDate()}`;
}

function hora(e: EventoVista): string {
  if (e.diaInteiro) return "dia todo";
  return new Date(e.inicio).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProximosEventos({
  eventos,
  falhou,
}: {
  eventos: EventoVista[];
  falhou: boolean;
}) {
  // Agrupar por dia, mantendo a ordem.
  const porDia = new Map<string, EventoVista[]>();
  for (const e of eventos) {
    const chave = rotuloDia(e.inicio);
    porDia.set(chave, [...(porDia.get(chave) ?? []), e]);
  }

  return (
    <Seccao
      titulo="Os proximos dias"
      ajuda="O que ja esta marcado nos calendarios partilhados. So para veres, nao se mexe daqui."
    >
      {falhou && (
        <Vazio>
          Nao foi possivel ler os calendarios agora. A app continua a funcionar.
        </Vazio>
      )}

      {!falhou && eventos.length === 0 && (
        <Vazio>Nada marcado para os proximos dias.</Vazio>
      )}

      <div className="flex flex-col gap-4">
        {[...porDia.entries()].map(([dia, lista]) => (
          <div key={dia} className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--color-tinta-fraca)]">{dia}</span>
            <ul className="flex flex-col gap-1.5">
              {lista.map((e) => (
                <li
                  key={e.calendario + e.id}
                  className="flex items-baseline gap-3 rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] px-4 py-2.5"
                >
                  <span className="mono text-sm text-[var(--color-tinta-fraca)] shrink-0 w-16">
                    {hora(e)}
                  </span>
                  <span className="text-base">{e.titulo}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Seccao>
  );
}
