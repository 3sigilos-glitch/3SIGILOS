// Se algum dia este ficheiro for importado por engano para codigo que
// corre no browser, a compilacao falha aqui em vez de expor a chave.
import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase com a chave de servico. Contorna RLS.
// Usar APENAS no servidor, e apenas onde e mesmo necessario,
// por exemplo ao ler ou escrever tokens_google, que nao tem policy.
// Nunca importar isto para codigo que corra no browser.
export function criarClienteAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
