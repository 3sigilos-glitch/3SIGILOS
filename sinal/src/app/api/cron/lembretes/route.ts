import { NextRequest, NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarPush } from "@/lib/push/vapid";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cron diario, 07:30 Europe/Lisbon (ver vercel.json, em UTC).
// Faz uma so coisa: envia push das obrigacoes da casa que vencem nos
// proximos dias. Nada mais. Nao envia lembretes para registar bateria,
// porque notificacoes de auto monitorizacao geram culpa.
//
// Corre com a chave de servico, sem sessao de utilizador.

const JANELA_DIAS = 2;

export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");
  if (segredo && autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "nao autorizado" }, { status: 401 });
  }

  const admin = criarClienteAdmin();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje);
  limite.setDate(hoje.getDate() + JANELA_DIAS);

  const dataDe = (d: Date) => d.toISOString().slice(0, 10);

  // Obrigacoes por concluir que vencem entre hoje e a janela.
  const { data: obrigacoes } = await admin
    .from("tarefas_casa")
    .select("id, titulo, data_limite, espaco_id")
    .not("data_limite", "is", null)
    .is("concluida_em", null)
    .gte("data_limite", dataDe(hoje))
    .lte("data_limite", dataDe(limite));

  if (!obrigacoes || obrigacoes.length === 0) {
    return NextResponse.json({ enviadas: 0 });
  }

  // Agrupar por espaco, para so ir buscar os membros uma vez.
  const porEspaco = new Map<string, typeof obrigacoes>();
  for (const o of obrigacoes) {
    const lista = porEspaco.get(o.espaco_id) ?? [];
    lista.push(o);
    porEspaco.set(o.espaco_id, lista);
  }

  let enviadas = 0;

  for (const [espacoId, lista] of porEspaco) {
    const { data: membros } = await admin
      .from("espaco_membros")
      .select("user_id")
      .eq("espaco_id", espacoId);
    if (!membros) continue;

    const ids = membros.map((m) => m.user_id);
    const { data: subs } = await admin
      .from("subscricoes_push")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", ids);
    if (!subs) continue;

    for (const o of lista) {
      const corpo =
        o.data_limite === dataDe(hoje)
          ? `Hoje: ${o.titulo}`
          : `Em breve: ${o.titulo}`;
      for (const s of subs) {
        try {
          const vivo = await enviarPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            { titulo: "Obrigacao da casa", corpo, url: "/nos" }
          );
          if (vivo) enviadas++;
          else await admin.from("subscricoes_push").delete().eq("id", s.id);
        } catch {
          // segue para a proxima
        }
      }
    }
  }

  return NextResponse.json({ enviadas });
}
