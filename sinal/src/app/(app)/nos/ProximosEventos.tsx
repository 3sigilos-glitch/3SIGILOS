import Seccao, { Vazio } from "@/components/Seccao";
import type { EventoVista } from "@/lib/google/calendario";

// O que ja esta marcado, vindo dos calendarios que cada um tem ligados
// no seu Google Calendar. So leitura.
//
// Nao substitui a roda do Sectograph, que continua a ser o sitio para
// ver a forma do dia. Aqui ve se a semana em lista, para o ponto a dois
// e para saber o que ai vem sem ter de sair da app.
//
// Cada evento leva um ponto com a cor do calendario a que pertence, a
// mesma cor que ja escolheram no Google. Serve para distinguir de
// relance a que parte da vida pertence, sem ler. E so um ponto pequeno:
// as cores da Google sao saturadas e nao devem tomar conta do ecra.

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
  precisaReentrar,
}: {
  eventos: EventoVista[];
  falhou: boolean;
  precisaReentrar: boolean;
}) {
  const porDia = new Map<string, EventoVista[]>();
  for (const e of eventos) {
    const chave = rotuloDia(e.inicio);
    porDia.set(chave, [...(porDia.get(chave) ?? []), e]);
  }

  return (
    <Seccao
      titulo="Os proximos dias"
      ajuda="O que ja esta marcado nos calendarios que tens ligados no Google. So para veres, nao se mexe daqui."
    >
      {precisaReentrar && !falhou && (
        <Vazio>
          Estas a ver so o calendario da casa. Termina sessao e entra outra
          vez para veres tambem os teus.
        </Vazio>
      )}

      {falhou && (
        <Vazio>
          Nao foi possivel ler os calendarios agora. O resto da app continua
          a funcionar.
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
                  <span
                    className="shrink-0 w-2 h-2 rounded-full translate-y-[-1px]"
                    style={{
                      backgroundColor: e.cor ?? "var(--color-traco)",
                      opacity: 0.85,
                    }}
                    aria-hidden
                  />
                  <span className="mono text-sm text-[var(--color-tinta-fraca)] shrink-0 w-16">
                    {hora(e)}
                  </span>
                  <span className="text-base flex-1">{e.titulo}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Seccao>
  );
}
