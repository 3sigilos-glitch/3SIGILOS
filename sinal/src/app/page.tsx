import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import BotaoEntrar from "./entrar";

export const dynamic = "force-dynamic";

// Entrada. Quem ja tem sessao vai direto para a Bateria, o separador
// por omissao. Quem nao tem, ve um so botao.
export default async function Pagina() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/bateria");
  }

  return (
    <main className="min-h-dvh flex flex-col justify-center gap-8 px-6 max-w-md mx-auto">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">SINAL</h1>
        <p className="text-[var(--color-tinta-fraca)] text-lg leading-relaxed">
          A porta de entrada da casa. Entra para comecar.
        </p>
      </div>
      <BotaoEntrar />
    </main>
  );
}
