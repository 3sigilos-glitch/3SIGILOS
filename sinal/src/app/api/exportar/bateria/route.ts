import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { criarClienteServidor } from "@/lib/supabase/server";
import { documentoBateria, type RegistoPdf } from "./documento";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Devolve o PDF da bateria do periodo pedido (7, 30 ou 90 dias).
export async function GET(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Sessao necessaria.", { status: 401 });
  }

  const pedido = new URL(request.url).searchParams.get("dias");
  const dias = [7, 30, 90].includes(Number(pedido)) ? Number(pedido) : 30;

  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const { data } = await supabase
    .from("registos_bateria")
    .select("registado_em, social, sensorial, contexto")
    .gte("registado_em", desde.toISOString())
    .order("registado_em", { ascending: true });

  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("id", user.id)
    .maybeSingle();

  const registos = (data ?? []) as RegistoPdf[];

  const doc = documentoBateria({
    nome: perfil?.nome ?? "",
    dias,
    inicio: desde.toLocaleDateString("pt-PT"),
    fim: new Date().toLocaleDateString("pt-PT"),
    registos,
  });

  const buffer = await renderToBuffer(doc as never);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="bateria-${dias}-dias.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
