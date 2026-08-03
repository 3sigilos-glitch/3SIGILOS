import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import BotaoEntrar from "./entrar";
import MareVisual from "@/components/MareVisual";

export const dynamic = "force-dynamic";

// Entrada. Quem ja tem sessao vai direto para a Bateria, o separador
// por omissao. Quem nao tem, ve a mare e um so botao.
export default async function Pagina() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/bateria");
  }

  return (
    <main className="min-h-dvh flex flex-col justify-center gap-10 max-w-md mx-auto">
      <div className="flex flex-col gap-4">
        <div className="px-6 flex flex-col gap-2">
          <h1 className="text-5xl font-semibold tracking-tight">maré</h1>
          <p className="text-[var(--color-tinta-fraca)] text-lg leading-relaxed">
            Sobe e desce, sem culpa. A porta de entrada da casa.
          </p>
        </div>
        <MareVisual />
      </div>
      <div className="px-6">
        <BotaoEntrar />
      </div>
    </main>
  );
}
