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

export function usedInsightToday(): boolean {
  return load<string>("ts-insight-day", "") === todayKey();
}

function markUsedToday() {
  save("ts-insight-day", todayKey());
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
  | { ok: false; reason: "limite-pessoal" | "limite-global" | "indisponivel" };

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
    if (!res.ok) return { ok: false, reason: "indisponivel" };
    const body = (await res.json()) as { text?: string };
    if (!body.text) return { ok: false, reason: "indisponivel" };
    markUsedToday();
    return { ok: true, text: body.text };
  } catch {
    return { ok: false, reason: "indisponivel" };
  }
}
