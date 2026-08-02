import { NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Cria uma captura. Idempotente: aceita o id gerado no cliente, para
// que uma repeticao de sincronizacao nao duplique. Respeita RLS.
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ erro: "sessao" }, { status: 401 });
  }

  let corpo: {
    id?: string;
    texto?: string;
    origem?: string;
    criado_em?: string;
  };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo" }, { status: 400 });
  }

  const texto = (corpo.texto ?? "").trim();
  if (!texto) {
    return NextResponse.json({ erro: "texto vazio" }, { status: 400 });
  }

  const origem = corpo.origem === "teclado" ? "teclado" : "voz";

  const linha: Record<string, unknown> = {
    user_id: user.id,
    texto,
    origem,
    estado: "por_triar",
  };
  if (corpo.id) linha.id = corpo.id;
  if (corpo.criado_em) linha.criado_em = corpo.criado_em;

  const { error } = await supabase
    .from("capturas")
    .upsert(linha, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ erro: "gravacao" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
