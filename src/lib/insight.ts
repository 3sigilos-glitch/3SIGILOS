import { LEITURAS_INTELIGENTES_POR_DIA } from "../config";
import { load, save } from "./storage";

/* Cliente da leitura inteligente. A chave da IA vive só no proxy
   serverless (/api/interpretar); a app envia o material da leitura e
   recebe o texto. O limite que conta é imposto no proxy; o estado
   local serve apenas de primeira indicação visual. */

function anonId(): string {
  let id = load<string>("ts-anon-id", "");
  if (!id) {
    id = crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
    save("ts-anon-id", id);
  }
  return id;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

interface InsightUsage {
  day: string;
  count: number;
}

function usage(): InsightUsage {
  const u = load<InsightUsage>("ts-insight-usage", { day: "", count: 0 });
  return u.day === todayKey() ? u : { day: todayKey(), count: 0 };
}

export function insightsLeftToday(): number {
  return Math.max(0, LEITURAS_INTELIGENTES_POR_DIA - usage().count);
}

function markUsedToday() {
  const u = usage();
  save("ts-insight-usage", { day: todayKey(), count: u.count + 1 });
}

export interface InsightPayload {
  question: string;
  spreadName: string;
  positions: {
    position: string;
    positionAbout: string;
    card: string;
    orientation: string;
    meaning: string;
    keywords: string[];
  }[];
  patterns: string[];
}

export type InsightResult =
  | { ok: true; text: string }
  | { ok: false; reason: "limite-pessoal" | "limite-global" | "indisponivel"; detail?: string };

/* Traduz a causa técnica num diagnóstico curto, só para a mensagem de
   erro (ajuda a perceber o que falta configurar no proxy). */
function diagnose(status: number, error?: string): string {
  if (status === 404) return "o proxy /api/interpretar não foi encontrado (função não publicada)";
  if (error === "por-configurar" || status === 503) return "falta a chave GEMINI_API_KEY no Vercel, ou o redeploy";
  if (error === "gemini") return "a Google recusou o pedido (chave inválida ou facturação por activar)";
  if (error === "rede") return "o proxy não conseguiu falar com a Google";
  if (error === "vazio") return "a Google respondeu vazio";
  return "erro " + status + (error ? " (" + error + ")" : "");
}

export async function requestInsight(payload: InsightPayload): Promise<InsightResult> {
  try {
    const res = await fetch("/api/interpretar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonId: anonId(), ...payload }),
    });
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      if (body?.scope === "global") return { ok: false, reason: "limite-global" };
      markUsedToday();
      return { ok: false, reason: "limite-pessoal" };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        googleStatus?: number;
        googleMessage?: string;
      };
      const detail = body.googleMessage
        ? "Google " + (body.googleStatus ?? "") + ": " + body.googleMessage
        : diagnose(res.status, body.error);
      return { ok: false, reason: "indisponivel", detail };
    }
    const body = (await res.json()) as { text?: string };
    if (!body.text) return { ok: false, reason: "indisponivel", detail: "resposta sem texto" };
    markUsedToday();
    return { ok: true, text: body.text };
  } catch {
    return { ok: false, reason: "indisponivel", detail: "sem ligação ao proxy" };
  }
}
