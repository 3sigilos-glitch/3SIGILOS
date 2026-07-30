/* Proxy da analise de leitura livre, reservada ao administrador.

   Diferente de /api/interpretar (que recebe uma tiragem estruturada da
   app), este aceita texto livre: o administrador descreve o que perguntou
   e que cartas sairam, e a app interpreta com o mesmo tom e conhecimento.
   Permite continuar a conversa (varias mensagens), para afinar a leitura.

   Protecao: so responde a quem enviar o token correcto. Definir no Vercel:
     ADMIN_TOKEN   segredo do administrador (nunca vai no pacote da app)
     GEMINI_API_KEY   a mesma chave paga do Google AI
   Opcional:
     GEMINI_MODEL         forcar um modelo Flash
     ANALISE_GLOBAL_DAY   tecto diario de seguranca (por defeito 80) */

export const config = { runtime: "edge" };

const MODELS = (process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []).concat([
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
]);

const GLOBAL = Number(process.env.ANALISE_GLOBAL_DAY ?? 80);
const memory = { day: "", global: 0 };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function bump(): number {
  if (memory.day !== today()) {
    memory.day = today();
    memory.global = 0;
  }
  return ++memory.global;
}

const SYSTEM =
  "És um intérprete de tarot experiente, honesto e sóbrio, a escrever em Português de " +
  "Portugal. Tratas sempre a pessoa por tu (tu, te, ti, o teu, a tua), nunca por você. " +
  "Quem te fala descreve, por palavras próprias, a pergunta que fez e as cartas que saíram " +
  "numa tiragem feita com um baralho físico (podendo indicar as posições e se as cartas " +
  "estão direitas ou invertidas). A tua tarefa é interpretar essa leitura com base no " +
  "conhecimento do tarot Rider-Waite: liga o significado das cartas à pergunta e às posições, " +
  "reconhece padrões (repetição de naipes, de números, de arcanos maiores) e oferece uma " +
  "reflexão concreta e útil. Podes continuar a conversa, respondendo a perguntas de " +
  "seguimento sobre a mesma leitura ou aprofundando pontos. " +
  "Respeita fielmente o tom de cada carta. As cartas difíceis (como a Torre, a Morte, o " +
  "Diabo, o Enforcado, a Lua, ou os Cincos, o Três, o Nove e o Dez de Espadas) e as cartas " +
  "invertidas trazem sombras, tensões, perdas, avisos ou bloqueios: nomeia-os com franqueza " +
  "e realismo, sem os adoçar, sem os transformar em algo positivo, e sem forçar finais " +
  "felizes. Mantém o equilíbrio: não dramatizes nem catastrofizes, mas também não suavizes o " +
  "desafio. Uma carta pesada deve soar pesada, uma luminosa deve soar luminosa, e uma leitura " +
  "mista deve reconhecer as duas coisas. O teu papel é dar clareza, não conforto fácil. " +
  "Se a descrição for ambígua ou faltar informação, diz o que assumiste e, se ajudar, pede o " +
  "que precisas de saber. Não inventes cartas que não foram referidas, não fazes previsões " +
  "deterministas do futuro, nem afirmações médicas, legais ou financeiras. " +
  "Nunca uses travessões, o carácter longo. Usa vírgula, dois pontos ou ponto final.";

interface Msg {
  role?: string;
  text?: string;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "method" }, { status: 405 });
  }
  const admin = process.env.ADMIN_TOKEN;
  if (!admin) {
    return Response.json({ error: "por-configurar" }, { status: 503 });
  }

  let body: { token?: string; validate?: boolean; messages?: Msg[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "corpo" }, { status: 400 });
  }

  // Comparacao simples do segredo. Sem token certo, nao ha resposta.
  if (String(body.token ?? "") !== admin) {
    return Response.json({ error: "token" }, { status: 401 });
  }
  // Modo validacao: so confirma o token, para o ecra de entrada.
  if (body.validate) {
    return Response.json({ ok: true });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "por-configurar" }, { status: 503 });
  }

  const msgs = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  const contents = msgs
    .filter((m) => (m.text ?? "").trim())
    .map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.text).slice(0, 4000) }],
    }));
  if (contents.length === 0) {
    return Response.json({ error: "dados" }, { status: 400 });
  }

  if (bump() > GLOBAL) {
    return Response.json({ error: "limite", scope: "global" }, { status: 429 });
  }

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 1600,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  try {
    let res: Response | null = null;
    let lastStatus = 0;
    let lastMsg = "";
    for (const model of MODELS) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: requestBody }
      );
      if (r.ok) {
        res = r;
        break;
      }
      const raw = await r.text().catch(() => "");
      try {
        lastMsg = (JSON.parse(raw) as { error?: { message?: string } }).error?.message ?? "";
      } catch {
        lastMsg = raw.slice(0, 160);
      }
      lastStatus = r.status;
      if (r.status !== 404) break;
    }
    if (!res) {
      return Response.json(
        { error: "gemini", googleStatus: lastStatus, googleMessage: lastMsg.slice(0, 200) },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) {
      return Response.json({ error: "vazio" }, { status: 502 });
    }
    return Response.json({ text: text.replaceAll("—", ",") });
  } catch {
    return Response.json({ error: "rede" }, { status: 502 });
  }
}
