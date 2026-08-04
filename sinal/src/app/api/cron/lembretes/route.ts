import { NextRequest, NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarPush } from "@/lib/push/vapid";
import { segredoIgual } from "@/lib/cripto";

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
  // Fecha por omissao. Sem CRON_SECRET definido, ninguem entra, nem
  // sequer a Vercel. Antes, a falta do segredo abria a rota a toda a
  // gente, e esta rota corre com a chave de servico.
  const segredo = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");
  if (!segredo || !autorizacao || !segredoIgual(autorizacao, `Bearer ${segredo}`)) {
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

    // Um aviso por pessoa, nao um por obrigacao. O texto e generico de
    // proposito: o titulo da obrigacao aparecia no ecra bloqueado,
    // visivel a quem pegasse no telemovel. Quem abre a app ve o que e,
    // quem so olha de relance nao ve nada. Como o texto e sempre igual,
    // varios avisos seguidos so davam ruido.
    const alguemHoje = lista.some((o) => o.data_limite === dataDe(hoje));
    const corpo = alguemHoje
      ? "Ver tarefa da casa hoje"
      : "Ver tarefa da casa nos proximos dias";

    for (const s of subs) {
      try {
        const vivo = await enviarPush(
          { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
          { titulo: "Maré", corpo, url: "/nos" }
        );
        if (vivo) enviadas++;
        else await admin.from("subscricoes_push").delete().eq("id", s.id);
      } catch {
        // segue para a proxima subscricao
      }
    }
  }

  return NextResponse.json({ enviadas });
}
