import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { eventosDeHoje } from "@/lib/google/calendario";
import { ReautenticacaoNecessaria } from "@/lib/google/tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Eventos de hoje do calendario da casa.
export async function GET() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "sessao" }, { status: 401 });

  const { data: membro } = await supabase
    .from("espaco_membros")
    .select("espacos(calendario_google_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const calendario =
    (membro?.espacos as unknown as { calendario_google_id: string | null } | null)
      ?.calendario_google_id ?? null;
  if (!calendario) return NextResponse.json({ eventos: [] });

  try {
    const eventos = await eventosDeHoje(user.id, calendario);
    return NextResponse.json({ eventos });
  } catch (e) {
    if (e instanceof ReautenticacaoNecessaria) {
      return NextResponse.json({ erro: "reautenticar" }, { status: 401 });
    }
    return NextResponse.json({ erro: "calendario" }, { status: 500 });
  }
}
