import { NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { criarEventoObrigacao } from "@/lib/google/calendario";
import { ReautenticacaoNecessaria } from "@/lib/google/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cria um evento no calendario do espaco. Documentado na spec. A criacao
// de obrigacoes na interface usa a server action; esta rota existe para
// o mesmo fim, de forma explicita.
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "sessao" }, { status: 401 });

  let corpo: { titulo?: string; data?: string; avisarDias?: number };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo" }, { status: 400 });
  }
  if (!corpo.titulo || !corpo.data) {
    return NextResponse.json({ erro: "incompleto" }, { status: 400 });
  }

  const { data: membro } = await supabase
    .from("espaco_membros")
    .select("espacos(calendario_google_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const calendario =
    (membro?.espacos as unknown as { calendario_google_id: string | null } | null)
      ?.calendario_google_id ?? null;
  if (!calendario) {
    return NextResponse.json({ erro: "sem_calendario" }, { status: 400 });
  }

  try {
    const eventoId = await criarEventoObrigacao(user.id, calendario, {
      titulo: corpo.titulo,
      data: corpo.data,
      avisarDias: corpo.avisarDias ?? 1,
    });
    return NextResponse.json({ ok: true, eventoId });
  } catch (e) {
    if (e instanceof ReautenticacaoNecessaria) {
      return NextResponse.json({ erro: "reautenticar" }, { status: 401 });
    }
    return NextResponse.json({ erro: "calendario" }, { status: 500 });
  }
}
