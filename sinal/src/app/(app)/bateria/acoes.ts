"use server";

import { criarClienteServidor } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Registar um valor de bateria. Respeita RLS: o cliente de servidor
// esta ligado a sessao do utilizador, e a linha e escrita com o seu
// user_id. O registo completo tem de ser possivel em tres toques.
export async function registarBateria(dados: {
  social: number;
  sensorial: number;
  contexto: string[];
  nota?: string;
}) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { erro: "Sessao expirada. Entra outra vez." };
  }

  const social = Math.min(5, Math.max(1, Math.round(dados.social)));
  const sensorial = Math.min(5, Math.max(1, Math.round(dados.sensorial)));

  const { error } = await supabase.from("registos_bateria").insert({
    user_id: user.id,
    social,
    sensorial,
    contexto: dados.contexto ?? [],
    nota: dados.nota?.trim() || null,
  });

  if (error) {
    return { erro: "Nao foi possivel guardar agora. Tenta outra vez." };
  }

  revalidatePath("/bateria");
  return { ok: true };
}
