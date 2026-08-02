"use server";

import { criarClienteServidor } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Candidata = { id: string; texto: string };

export type TarefaAgora = {
  id: string;
  titulo: string;
  passos: string[];
  iniciada_em: string | null;
  duracao_alvo_min: number;
};

// Capturas marcadas como Hoje, candidatas do ecra Agora.
export async function listarHoje(): Promise<Candidata[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("capturas")
    .select("id, texto")
    .eq("estado", "hoje")
    .order("criado_em", { ascending: true })
    .limit(3);
  return (data ?? []) as Candidata[];
}

// Escolher uma captura para trabalhar agora. Cria (ou reutiliza) a
// tarefa ligada, para o temporizador ter onde guardar o inicio.
export async function escolher(capturaId: string): Promise<TarefaAgora | { erro: string }> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "sessao" };

  const { data: existente } = await supabase
    .from("tarefas")
    .select("id, titulo, passos, iniciada_em, duracao_alvo_min")
    .eq("captura_id", capturaId)
    .is("concluida_em", null)
    .maybeSingle();

  if (existente) {
    return {
      id: existente.id as string,
      titulo: existente.titulo as string,
      passos: (existente.passos as string[]) ?? [],
      iniciada_em: (existente.iniciada_em as string | null) ?? null,
      duracao_alvo_min: (existente.duracao_alvo_min as number) ?? 10,
    };
  }

  const { data: captura } = await supabase
    .from("capturas")
    .select("texto")
    .eq("id", capturaId)
    .maybeSingle();
  if (!captura) return { erro: "sem_captura" };

  const { data: nova, error } = await supabase
    .from("tarefas")
    .insert({
      captura_id: capturaId,
      user_id: user.id,
      titulo: captura.texto,
    })
    .select("id, titulo, passos, iniciada_em, duracao_alvo_min")
    .single();
  if (error || !nova) return { erro: "gravacao" };

  return {
    id: nova.id as string,
    titulo: nova.titulo as string,
    passos: (nova.passos as string[]) ?? [],
    iniciada_em: (nova.iniciada_em as string | null) ?? null,
    duracao_alvo_min: (nova.duracao_alvo_min as number) ?? 10,
  };
}

// O temporizador guarda o timestamp de inicio na base de dados e conta
// por diferenca. Nunca depende de setInterval para a contagem real.
export async function iniciarTemporizador(tarefaId: string): Promise<{ iniciada_em: string } | { erro: string }> {
  const supabase = await criarClienteServidor();
  const { data: actual } = await supabase
    .from("tarefas")
    .select("iniciada_em")
    .eq("id", tarefaId)
    .maybeSingle();

  if (actual?.iniciada_em) {
    return { iniciada_em: actual.iniciada_em as string };
  }

  const agora = new Date().toISOString();
  const { error } = await supabase
    .from("tarefas")
    .update({ iniciada_em: agora })
    .eq("id", tarefaId);
  if (error) return { erro: "gravacao" };
  return { iniciada_em: agora };
}

export async function guardarPassos(tarefaId: string, passos: string[]) {
  const supabase = await criarClienteServidor();
  await supabase
    .from("tarefas")
    .update({ passos, duracao_alvo_min: 10 })
    .eq("id", tarefaId);
  return { ok: true };
}

// Nao e hoje. Devolve a captura a um dia. Se a tarefa nao arrancou,
// apaga a tarefa criada.
export async function naoEHoje(capturaId: string, tarefaId?: string) {
  const supabase = await criarClienteServidor();
  await supabase.from("capturas").update({ estado: "um_dia" }).eq("id", capturaId);
  if (tarefaId) {
    await supabase
      .from("tarefas")
      .delete()
      .eq("id", tarefaId)
      .is("iniciada_em", null);
  }
  revalidatePath("/agora");
  return { ok: true };
}

export async function concluir(tarefaId: string, capturaId?: string) {
  const supabase = await criarClienteServidor();
  await supabase
    .from("tarefas")
    .update({ concluida_em: new Date().toISOString() })
    .eq("id", tarefaId);
  if (capturaId) {
    await supabase.from("capturas").update({ estado: "arquivada" }).eq("id", capturaId);
  }
  revalidatePath("/agora");
  return { ok: true };
}
