import { google } from "googleapis";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { cifrar, decifrar, porCifrar } from "@/lib/cripto";

// Erro lancado quando o refresh token deixa de ser valido e e preciso
// pedir nova autenticacao ao utilizador.
export class ReautenticacaoNecessaria extends Error {
  constructor(mensagem = "A ligacao a Google expirou. Entra outra vez para voltar a ligar o calendario.") {
    super(mensagem);
    this.name = "ReautenticacaoNecessaria";
  }
}

// Cria um cliente OAuth2 da Google configurado com as credenciais da app.
export function criarOAuth2() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  );
}

// Guarda ou actualiza o refresh token de um utilizador.
// So corre no servidor, com a chave de servico, porque tokens_google
// nao tem qualquer politica RLS.
export async function guardarRefreshToken(
  userId: string,
  refreshToken: string,
  scope: string | null
) {
  const admin = criarClienteAdmin();
  const { error } = await admin.from("tokens_google").upsert(
    {
      user_id: userId,
      // Nunca gravamos o token em claro.
      refresh_token: cifrar(refreshToken),
      scope,
      actualizado_em: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

// Troca o refresh token guardado por um access token fresco.
// Trata o erro invalid_grant pedindo nova autenticacao.
// Devolve um cliente OAuth2 pronto a usar com as APIs da Google.
export async function obterClienteAutenticado(userId: string) {
  const admin = criarClienteAdmin();
  const { data, error } = await admin
    .from("tokens_google")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.refresh_token) throw new ReautenticacaoNecessaria();

  const guardado = data.refresh_token as string;
  let token: string;
  try {
    token = decifrar(guardado);
  } catch {
    // Chave errada ou valor adulterado. Nao da para recuperar aqui, so
    // voltando a autorizar na Google.
    throw new ReautenticacaoNecessaria();
  }

  // Ligacao criada antes da cifra: passa a cifrada, sem incomodar o
  // utilizador.
  if (porCifrar(guardado)) {
    await admin
      .from("tokens_google")
      .update({ refresh_token: cifrar(token) })
      .eq("user_id", userId);
  }

  const oauth2 = criarOAuth2();
  oauth2.setCredentials({ refresh_token: token });

  try {
    const { credentials } = await oauth2.refreshAccessToken();
    oauth2.setCredentials(credentials);
    return oauth2;
  } catch (e: unknown) {
    const erro = e as { response?: { data?: { error?: string } }; message?: string };
    const codigo = erro?.response?.data?.error ?? erro?.message;
    if (codigo === "invalid_grant") {
      throw new ReautenticacaoNecessaria();
    }
    throw e;
  }
}
