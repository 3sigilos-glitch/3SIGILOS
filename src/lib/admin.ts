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

/* POST com tempo limite e sem cache, para o service worker nao servir
   uma pagina guardada em vez da resposta do proxy. */
async function postAnalise(payload: unknown, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch("/api/analise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function isJson(res: Response): boolean {
  return (res.headers.get("content-type") ?? "").includes("application/json");
}

export type ValidateResult = "ok" | "wrong" | "unconfigured" | "offline" | "stale";

/* Confirma o token no proxy, sem gastar nada da IA. Distingue os casos
   para o ecra de entrada dizer o que se passa. */
export async function validateAdmin(token: string): Promise<ValidateResult> {
  try {
    const res = await postAnalise({ token: token.trim(), validate: true }, 20000);
    // Resposta que nao e JSON: quase sempre a pagina em cache do service
    // worker, ou seja, a app esta numa versao antiga.
    if (!isJson(res) && res.ok) return "stale";
    if (res.ok) return "ok";
    if (res.status === 401) return "wrong";
    if (res.status === 503 || res.status === 404) return "unconfigured";
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

const STALE =
  "a app parece estar numa versao antiga guardada. Fecha-a por completo e reabre (ou recarrega a pagina) e tenta outra vez.";

/* Envia toda a conversa e devolve a resposta seguinte da app. */
export async function requestAnalise(messages: Msg[]): Promise<AnaliseResult> {
  const token = adminToken();
  if (!token) return { ok: false, detail: "sessao de administrador terminada", unauthorized: true };
  try {
    const res = await postAnalise({ token, messages }, 45000);
    if (res.status === 401) {
      return { ok: false, detail: "token de administrador invalido", unauthorized: true };
    }
    if (!isJson(res)) {
      return { ok: false, detail: STALE };
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        googleStatus?: number;
        googleMessage?: string;
      };
      return { ok: false, detail: diagnose(res.status, body.error, body.googleMessage) };
    }
    const body = (await res.json().catch(() => ({}))) as { text?: string };
    if (!body.text) return { ok: false, detail: "resposta sem texto" };
    return { ok: true, text: body.text };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, detail: "a resposta demorou demasiado. Tenta outra vez." };
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return { ok: false, detail: "estas sem ligacao a internet." };
    }
    return { ok: false, detail: "nao foi possivel falar com o servidor. Tenta outra vez daqui a pouco." };
  }
}
