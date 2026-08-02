"use server";

import { criarClienteServidor } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type CapturaTriagem = { id: string; texto: string; criado_em: string };

// Devolve as capturas por triar, uma leitura de cada vez no modo de
// triagem. Mais antigas primeiro.
export async function listarPorTriar(): Promise<CapturaTriagem[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("capturas")
    .select("id, texto, criado_em")
    .eq("estado", "por_triar")
    .order("criado_em", { ascending: true });
  return (data ?? []) as CapturaTriagem[];
}

// Conta as capturas por triar no servidor.
export async function contarPorTriar(): Promise<number> {
  const supabase = await criarClienteServidor();
  const { count } = await supabase
    .from("capturas")
    .select("id", { count: "exact", head: true })
    .eq("estado", "por_triar");
  return count ?? 0;
}

type Destino = "hoje" | "um_dia" | "casa" | "apagar";

// Tria uma captura. Um item, uma decisao. Apagar e uma resposta
// legitima e deve ser a mais usada.
export async function triarCaptura(id: string, destino: Destino) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "sessao" };

  if (destino === "apagar") {
    await supabase.from("capturas").delete().eq("id", id);
    revalidatePath("/despejo");
    return { ok: true };
  }

  if (destino === "hoje" || destino === "um_dia") {
    await supabase
      .from("capturas")
      .update({ estado: destino === "hoje" ? "hoje" : "um_dia" })
      .eq("id", id);
    revalidatePath("/despejo");
    return { ok: true };
  }

  // destino === "casa": move para as tarefas partilhadas do espaco.
  const { data: captura } = await supabase
    .from("capturas")
    .select("texto")
    .eq("id", id)
    .maybeSingle();

  const { data: membro } = await supabase
    .from("espaco_membros")
    .select("espaco_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!captura || !membro) {
    return { erro: "sem espaco" };
  }

  const { error } = await supabase.from("tarefas_casa").insert({
    espaco_id: membro.espaco_id,
    titulo: captura.texto,
    criado_por: user.id,
  });
  if (error) return { erro: "gravacao" };

  await supabase.from("capturas").update({ estado: "arquivada" }).eq("id", id);
  revalidatePath("/despejo");
  revalidatePath("/nos");
  return { ok: true };
}
