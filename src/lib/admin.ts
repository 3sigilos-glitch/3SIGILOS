import { load, save } from "./storage";

/* Cliente da area do administrador. O segredo do administrador fica so
   neste dispositivo (localStorage) e viaja em cada pedido para o proxy
   /api/analise, que o compara com ADMIN_TOKEN. O segredo nunca esta no
   pacote da app. */

const KEY = "ts-admin-token";

export function adminToken(): string {
  return load<string>(KEY, "");
}
export function isAdmin(): boolean {
  return adminToken().trim().length > 0;
}
export function setAdmin(token: string) {
  save(KEY, token.trim());
}
export function clearAdmin() {
  save(KEY, "");
}

export interface Msg {
  role: "user" | "model";
  text: string;
}

export type ValidateResult = "ok" | "wrong" | "unconfigured" | "offline";

/* Confirma o token no proxy, sem gastar nada da IA. Distingue os casos
   para o ecra de entrada dizer o que se passa. */
export async function validateAdmin(token: string): Promise<ValidateResult> {
  try {
    const res = await fetch("/api/analise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim(), validate: true }),
    });
    if (res.ok) return "ok";
    if (res.status === 401) return "wrong";
    if (res.status === 503) return "unconfigured";
    if (res.status === 404) return "unconfigured";
    return "offline";
  } catch {
    return "offline";
  }
}

export type AnaliseResult =
  | { ok: true; text: string }
  | { ok: false; detail: string; unauthorized?: boolean };

function diagnose(status: number, error?: string, googleMessage?: string): string {
  if (googleMessage) return "Google " + status + ": " + googleMessage;
  if (status === 404) return "o proxy /api/analise nao foi encontrado (funcao nao publicada)";
  if (error === "por-configurar" || status === 503) return "falta ADMIN_TOKEN ou GEMINI_API_KEY no Vercel";
  if (error === "gemini") return "a Google recusou o pedido (chave invalida ou facturacao por activar)";
  if (error === "limite") return "atingido o tecto diario de seguranca da analise";
  if (error === "rede") return "o proxy nao conseguiu falar com a Google";
  if (error === "vazio") return "a Google respondeu vazio";
  return "erro " + status + (error ? " (" + error + ")" : "");
}

/* Envia toda a conversa e devolve a resposta seguinte da app. */
export async function requestAnalise(messages: Msg[]): Promise<AnaliseResult> {
  const token = adminToken();
  if (!token) return { ok: false, detail: "sessao de administrador terminada", unauthorized: true };
  try {
    const res = await fetch("/api/analise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, messages }),
    });
    if (res.status === 401) {
      return { ok: false, detail: "token de administrador invalido", unauthorized: true };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        googleStatus?: number;
        googleMessage?: string;
      };
      return { ok: false, detail: diagnose(res.status, body.error, body.googleMessage) };
    }
    const body = (await res.json()) as { text?: string };
    if (!body.text) return { ok: false, detail: "resposta sem texto" };
    return { ok: true, text: body.text };
  } catch {
    return { ok: false, detail: "sem ligacao ao proxy" };
  }
}
