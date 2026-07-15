/* Proxy da leitura inteligente (Vercel Serverless Function).

   A chave do Gemini vive AQUI, nunca na app. Definir em Vercel:
     GEMINI_API_KEY          chave do Google AI (serviço pago)
   Limites (podem ser afinados por variáveis de ambiente):
     INSIGHT_PER_USER_DAY    por pessoa por dia (por defeito 1)
     INSIGHT_GLOBAL_DAY      total por dia em toda a app (por defeito 50)
   Contagem persistente opcional (recomendada) com Upstash Redis:
     UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
   Sem Upstash, a contagem vive na memória da instância (best effort:
   pode reiniciar; o limite por pessoa continua a ser verificado). */

export const config = { runtime: "edge" };

// Modelos Flash a tentar por ordem. Se a Google reformar um nome (404),
// o proxy passa ao seguinte sozinho. Pode forçar-se um com a variável
// GEMINI_MODEL no Vercel. gemini-flash-latest aponta sempre para o Flash
// estável mais recente.
const MODELS = (process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : []).concat([
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
]);

const memory: { day: string; users: Map<string, number>; global: number } = {
  day: "",
  users: new Map(),
  global: 0,
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const PER_USER = Number(process.env.INSIGHT_PER_USER_DAY ?? 2);
const GLOBAL = Number(process.env.INSIGHT_GLOBAL_DAY ?? 50);

async function upstash(cmd: (string | number)[]): Promise<number | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { result: number };
  return body.result;
}

/* Incrementa e devolve o valor, com expiração à meia-noite UTC. */
async function count(key: string): Promise<number> {
  const redisKey = `tarot:${today()}:${key}`;
  const viaRedis = await upstash(["INCR", redisKey]);
  if (viaRedis !== null) {
    await upstash(["EXPIRE", redisKey, 60 * 60 * 26]);
    return viaRedis;
  }
  if (memory.day !== today()) {
    memory.day = today();
    memory.users = new Map();
    memory.global = 0;
  }
  if (key === "global") return ++memory.global;
  const v = (memory.users.get(key) ?? 0) + 1;
  memory.users.set(key, v);
  return v;
}

const SYSTEM =
  "És um intérprete de tarot experiente, caloroso e sóbrio, a escrever em Português de " +
  "Portugal. Tratas sempre a pessoa por tu (tu, te, ti, o teu, a tua), nunca por você. " +
  "Recebes as cartas de uma leitura, as suas posições, os significados já definidos e os " +
  "padrões detetados. Escreve uma interpretação fluida e pessoal, dirigida diretamente a " +
  "quem consulta, que ligue o significado das cartas à pergunta e às posições, e ofereça " +
  "uma reflexão concreta e útil. Não te limites a repetir o enunciado nem a descrever a " +
  "tiragem: interpreta o que ela sugere para a pessoa. Apoia-te apenas no material " +
  "fornecido, sem inventar significados novos, sem previsões deterministas do futuro, e " +
  "sem afirmações médicas, legais ou financeiras. Escreve dois a três parágrafos, com " +
  "serenidade e respeito, e termina com uma nota de abertura ou conselho suave. " +
  "Nunca uses travessões, o carácter longo. Usa vírgula, dois pontos ou ponto final.";

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return Response.json({ error: "method" }, { status: 405 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return Response.json({ error: "por-configurar" }, { status: 503 });
  }

  let body: {
    anonId?: string;
    question?: string;
    spreadName?: string;
    positions?: {
      position: string;
      positionAbout: string;
      card: string;
      orientation: string;
      meaning: string;
      keywords: string[];
    }[];
    patterns?: string[];
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "corpo" }, { status: 400 });
  }
  const anonId = String(body.anonId ?? "").slice(0, 64);
  const positions = Array.isArray(body.positions) ? body.positions.slice(0, 10) : [];
  if (!anonId || positions.length === 0) {
    return Response.json({ error: "dados" }, { status: 400 });
  }

  // Limites: primeiro o global, depois o pessoal.
  if ((await count("global")) > GLOBAL) {
    return Response.json({ error: "limite", scope: "global" }, { status: 429 });
  }
  if ((await count("u:" + anonId)) > PER_USER) {
    return Response.json({ error: "limite", scope: "pessoal" }, { status: 429 });
  }

  const material = [
    body.question ? `Pergunta do consulente: ${String(body.question).slice(0, 500)}` : "Sem pergunta explícita.",
    `Esquema: ${String(body.spreadName ?? "").slice(0, 80)}`,
    "Cartas:",
    ...positions.map(
      (p, i) =>
        `${i + 1}. Posição "${p.position}" (${p.positionAbout}). Carta: ${p.card}, ${p.orientation}. ` +
        `Palavras-chave: ${(p.keywords ?? []).join(", ")}. Significado: ${String(p.meaning).slice(0, 900)}`
    ),
    "Padrões detetados:",
    ...(Array.isArray(body.patterns) ? body.patterns.slice(0, 10).map((p) => "- " + String(p).slice(0, 300)) : []),
  ].join("\n");

  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: material }] }],
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 1400,
      // Desliga os "tokens de pensamento" (2.5/3), que consumiam o limite
      // e cortavam a resposta a meio. A interpretação não precisa deles.
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  try {
    let res: Response | null = null;
    let lastStatus = 0;
    let lastMsg = "";
    // Tenta os modelos por ordem; se um foi reformado (404), passa ao
    // seguinte. Qualquer outro erro (429, 400) pára e é reportado.
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
      if (r.status !== 404) break; // só o 404 (modelo indisponível) faz tentar o próximo
    }
    if (!res) {
      // Devolve a razão real da Google (mensagem e estado), sem a chave.
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
