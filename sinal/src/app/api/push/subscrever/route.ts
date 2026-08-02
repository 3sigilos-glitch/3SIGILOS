import { NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Guarda a subscricao push do utilizador. Uma por endpoint.
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "sessao" }, { status: 401 });

  let corpo: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo" }, { status: 400 });
  }

  const endpoint = corpo.endpoint;
  const p256dh = corpo.keys?.p256dh;
  const auth = corpo.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ erro: "dados" }, { status: 400 });
  }

  const { error } = await supabase
    .from("subscricoes_push")
    .upsert(
      { user_id: user.id, endpoint, p256dh, auth },
      { onConflict: "endpoint" }
    );
  if (error) return NextResponse.json({ erro: "gravacao" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
