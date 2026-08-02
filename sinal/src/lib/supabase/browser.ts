import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para o browser. So usa a chave anon, nunca a de
// servico. Respeita RLS.
export function criarClienteBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
