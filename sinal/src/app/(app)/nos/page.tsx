import { criarClienteServidor } from "@/lib/supabase/server";
import SinalDia from "./SinalDia";
import TarefasCasa, { type TarefaCasa } from "./TarefasCasa";
import Obrigacoes, { type Obrigacao } from "./Obrigacoes";
import Parqueadas, { type Decisao } from "./Parqueadas";
import AvisosPush from "./AvisosPush";
import BotaoSair from "../../sair";
import Ecra from "@/components/Ecra";
import ProximosEventos from "./ProximosEventos";
import {
  eventosProximos,
  calendariosVisiveis,
  type EventoVista,
  type CalendarioVisivel,
} from "@/lib/google/calendario";

export const dynamic = "force-dynamic";

type Nivel = "verde" | "amarelo" | "vermelho";

// Nos, a camada partilhada. Tudo o que tem data escreve no calendario.
export default async function PaginaNos() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membro } = await supabase
    .from("espaco_membros")
    .select("espaco_id, espacos(calendario_google_id, calendarios_vista)")
    .eq("user_id", user!.id)
    .maybeSingle();

  const espacoId = membro?.espaco_id as string | undefined;
  const dadosEspaco = membro?.espacos as unknown as {
    calendario_google_id: string | null;
    calendarios_vista: string[] | null;
  } | null;

  // Sem espaco ainda: mensagem sobria, sem alarme.
  if (!espacoId) {
    return (
      <main className="px-5 pt-6 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Nos</h1>
        <p className="text-[var(--color-tinta-fraca)]">
          Ainda sem espaco da casa. Falta a configuracao inicial.
        </p>
        <BotaoSair />
      </main>
    );
  }

  // Mapa de nomes dos membros do espaco.
  const { data: membros } = await supabase
    .from("espaco_membros")
    .select("user_id, perfis(nome)")
    .eq("espaco_id", espacoId);

  const nomePor = new Map<string, string>();
  (membros ?? []).forEach((m) => {
    const nome = (m.perfis as unknown as { nome: string } | null)?.nome ?? "";
    nomePor.set(m.user_id as string, nome);
  });

  // Sinais activos (nao expirados).
  const { data: sinais } = await supabase
    .from("sinais")
    .select("user_id, nivel, criado_em")
    .gt("expira_em", new Date().toISOString())
    .order("criado_em", { ascending: false });

  const meu = (sinais ?? []).find((s) => s.user_id === user!.id);
  const outroSinal = (sinais ?? []).find((s) => s.user_id !== user!.id);
  const outro = outroSinal
    ? {
        nivel: outroSinal.nivel as Nivel,
        hora: new Date(outroSinal.criado_em).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }
    : null;

  // Tarefas da casa e obrigacoes vivem na mesma tabela.
  const { data: linhas } = await supabase
    .from("tarefas_casa")
    .select("id, titulo, pegou, data_limite, concluida_em")
    .is("concluida_em", null)
    .order("criado_em", { ascending: true });

  const hoje = new Date().toISOString().slice(0, 10);

  const tarefas: TarefaCasa[] = (linhas ?? [])
    .filter((l) => !l.data_limite)
    .map((l) => ({
      id: l.id as string,
      titulo: l.titulo as string,
      pegou: (l.pegou as string | null) ?? null,
      nomePegou: l.pegou ? nomePor.get(l.pegou as string) ?? "" : null,
    }));

  const obrigacoes: Obrigacao[] = (linhas ?? [])
    .filter((l) => l.data_limite && (l.data_limite as string) >= hoje)
    .sort((a, b) => (a.data_limite as string).localeCompare(b.data_limite as string))
    .map((l) => ({
      id: l.id as string,
      titulo: l.titulo as string,
      data_limite: l.data_limite as string,
    }));

  const { data: decisoesData } = await supabase
    .from("decisoes")
    .select("id, titulo, notas")
    .is("resolvida_em", null)
    .order("criado_em", { ascending: true });

  const decisoes: Decisao[] = (decisoesData ?? []).map((d) => ({
    id: d.id as string,
    titulo: d.titulo as string,
    notas: (d.notas as string | null) ?? null,
  }));

  // Os calendarios sao os que esta pessoa tem ligados no seu Google
  // Calendar. Nao ha lista a manter na app.
  //
  // Quem tiver entrado antes de a app pedir esta permissao ainda nao a
  // tem no token. Nesse caso recuamos para os calendarios guardados no
  // espaco, para continuar a mostrar alguma coisa, e assinalamos que
  // basta voltar a entrar para ver tudo.
  let eventos: EventoVista[] = [];
  let falhouCalendario = false;
  let precisaReentrar = false;

  try {
    const meus = await calendariosVisiveis(user!.id);
    eventos = await eventosProximos(user!.id, meus, 7);
  } catch {
    precisaReentrar = true;
    const recuo: CalendarioVisivel[] = [
      ...(dadosEspaco?.calendario_google_id
        ? [{ id: dadosEspaco.calendario_google_id, nome: "Casa", cor: null }]
        : []),
      ...(dadosEspaco?.calendarios_vista ?? []).map((id) => ({
        id,
        nome: "",
        cor: null,
      })),
    ];
    if (recuo.length > 0) {
      try {
        eventos = await eventosProximos(user!.id, recuo, 7);
      } catch {
        falhouCalendario = true;
      }
    } else {
      falhouCalendario = true;
    }
  }

  return (
    <Ecra
      titulo="Nos"
      proposito="O que e dos dois. Tudo o que tem data vai parar ao calendario da casa."
    >
      <SinalDia meuNivel={(meu?.nivel as Nivel) ?? null} outro={outro} />

      <div className="border-t border-[var(--color-traco)]" />
      <ProximosEventos
        eventos={eventos}
        falhou={falhouCalendario}
        precisaReentrar={precisaReentrar}
      />

      <div className="border-t border-[var(--color-traco)]" />
      <TarefasCasa tarefas={tarefas} />

      <div className="border-t border-[var(--color-traco)]" />
      <Obrigacoes obrigacoes={obrigacoes} />

      <div className="border-t border-[var(--color-traco)]" />
      <Parqueadas decisoes={decisoes} />

      <div className="border-t border-[var(--color-traco)] pt-6 flex flex-col gap-4 items-center">
        <AvisosPush />
        <BotaoSair />
      </div>
    </Ecra>
  );
}
