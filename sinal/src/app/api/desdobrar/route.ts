import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { criarClienteServidor } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fase 4. Parte uma tarefa em passos de cerca de 10 minutos, via IA.
// Mostra so o primeiro passo do lado do cliente, com o temporizador
// pronto a arrancar. Chave de API so no servidor.
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ erro: "sessao" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ erro: "sem_ia" }, { status: 503 });
  }

  let corpo: { titulo?: string };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "corpo" }, { status: 400 });
  }
  const titulo = (corpo.titulo ?? "").trim();
  if (!titulo) return NextResponse.json({ erro: "vazio" }, { status: 400 });

  const cliente = new Anthropic();

  try {
    const resposta = await cliente.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              passos: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["passos"],
            additionalProperties: false,
          },
        },
      },
      system:
        "Partes uma tarefa em passos concretos de cerca de 10 minutos cada, para uma pessoa com dificuldades de funcao executiva. Escreve em portugues de Portugal, no maximo cinco passos, cada um comecado por um verbo de accao, curto e sem rodeios. Nunca uses travessao. Nao acrescentes introducao nem conclusao, so os passos.",
      messages: [
        {
          role: "user",
          content: `Tarefa: ${titulo}`,
        },
      ],
    });

    const bloco = resposta.content.find((b) => b.type === "text");
    const texto = bloco && bloco.type === "text" ? bloco.text : "{}";
    let passos: string[] = [];
    try {
      const dados = JSON.parse(texto);
      if (Array.isArray(dados.passos)) {
        passos = dados.passos.filter((p: unknown) => typeof p === "string").slice(0, 5);
      }
    } catch {
      passos = [];
    }

    if (passos.length === 0) {
      return NextResponse.json({ erro: "sem_passos" }, { status: 502 });
    }

    return NextResponse.json({ passos });
  } catch {
    return NextResponse.json({ erro: "ia" }, { status: 502 });
  }
}
