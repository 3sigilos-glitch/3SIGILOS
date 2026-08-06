"use server";

import { criarClienteServidor } from "@/lib/supabase/server";
import { criarEventoObrigacao, ErroCalendario } from "@/lib/google/calendario";
import { ReautenticacaoNecessaria } from "@/lib/google/tokens";
import { revalidatePath } from "next/cache";

async function contexto() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, espaco: null };

  const { data: membro } = await supabase
    .from("espaco_membros")
    .select("espaco_id, espacos(id, calendario_google_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const espaco = membro
    ? {
        id: membro.espaco_id as string,
        calendario:
          (membro.espacos as unknown as { calendario_google_id: string | null } | null)
            ?.calendario_google_id ?? null,
      }
    : null;

  return { supabase, user, espaco };
}

// Sinal do dia. Um toque define o estado. Expira sozinho ao fim de 10h
// (por omissao na base de dados).
export async function definirSinal(nivel: "verde" | "amarelo" | "vermelho") {
  const { supabase, user, espaco } = await contexto();
  if (!user || !espaco) return { erro: "sem espaco" };

  const { error } = await supabase.from("sinais").insert({
    user_id: user.id,
    espaco_id: espaco.id,
    nivel,
  });
  if (error) return { erro: "gravacao" };
  revalidatePath("/nos");
  return { ok: true };
}

// Nova tarefa da casa, sem dono.
export async function criarTarefaCasa(titulo: string) {
  const { supabase, user, espaco } = await contexto();
  if (!user || !espaco) return { erro: "sem espaco" };
  const limpo = titulo.trim();
  if (!limpo) return { erro: "vazio" };

  const { error } = await supabase.from("tarefas_casa").insert({
    espaco_id: espaco.id,
    titulo: limpo,
    criado_por: user.id,
  });
  if (error) return { erro: "gravacao" };
  revalidatePath("/nos");
  return { ok: true };
}

// Eu pego. Ninguem atribui nada a ninguem, e a propria pessoa que pega.
export async function pegarTarefa(id: string) {
  const { supabase, user } = await contexto();
  if (!user) return { erro: "sessao" };

  const { error } = await supabase
    .from("tarefas_casa")
    .update({ pegou: user.id, pegou_em: new Date().toISOString() })
    .eq("id", id)
    .is("pegou", null);
  if (error) return { erro: "gravacao" };
  revalidatePath("/nos");
  return { ok: true };
}

export async function concluirTarefa(id: string) {
  const { supabase, user } = await contexto();
  if (!user) return { erro: "sessao" };
  await supabase
    .from("tarefas_casa")
    .update({ concluida_em: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/nos");
  return { ok: true };
}

// Obrigacao com data. Ao guardar, cria evento no calendario partilhado
// da casa via API e guarda o evento_google_id.
export async function criarObrigacao(dados: {
  titulo: string;
  data: string;
  avisarDias: number;
}) {
  const { supabase, user, espaco } = await contexto();
  if (!user || !espaco) return { erro: "sem espaco" };
  const titulo = dados.titulo.trim();
  if (!titulo || !dados.data) return { erro: "incompleto" };

  if (!espaco.calendario) {
    return { erro: "sem_calendario" };
  }

  let eventoId = "";
  try {
    eventoId = await criarEventoObrigacao(user.id, espaco.calendario, {
      titulo,
      data: dados.data,
      avisarDias: dados.avisarDias,
    });
  } catch (e) {
    if (e instanceof ReautenticacaoNecessaria) {
      return { erro: "reautenticar" };
    }
    if (e instanceof ErroCalendario) {
      return { erro: e.motivo };
    }
    return { erro: "calendario" };
  }

  const { error } = await supabase.from("tarefas_casa").insert({
    espaco_id: espaco.id,
    titulo,
    criado_por: user.id,
    data_limite: dados.data,
    evento_google_id: eventoId || null,
  });
  if (error) return { erro: "gravacao" };

  revalidatePath("/nos");
  return { ok: true };
}

// Parqueadas: coisas que precisam de conversa a dois.
export async function criarDecisao(dados: { titulo: string; notas?: string }) {
  const { supabase, user, espaco } = await contexto();
  if (!user || !espaco) return { erro: "sem espaco" };
  const titulo = dados.titulo.trim();
  if (!titulo) return { erro: "vazio" };

  const { error } = await supabase.from("decisoes").insert({
    espaco_id: espaco.id,
    titulo,
    notas: dados.notas?.trim() || null,
    criado_por: user.id,
  });
  if (error) return { erro: "gravacao" };
  revalidatePath("/nos");
  return { ok: true };
}

export async function resolverDecisao(id: string) {
  const { supabase, user } = await contexto();
  if (!user) return { erro: "sessao" };
  await supabase
    .from("decisoes")
    .update({ resolvida_em: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/nos");
  return { ok: true };
}
