import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import BotaoEntrar from "./entrar";
import MareVisual from "@/components/MareVisual";
import Wordmark from "@/components/Wordmark";

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
        <div className="px-6 flex flex-col gap-4">
          <h1 className="m-0">
            <Wordmark className="w-44 h-auto text-[var(--color-tinta)]" />
          </h1>
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
