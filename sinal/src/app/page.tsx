import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { emailPermitido } from "@/lib/supabase/permitido";
import BotaoEntrar from "./entrar";
import BotaoSair from "./sair";
import MareVisual from "@/components/MareVisual";
import Wordmark from "@/components/Wordmark";

export const dynamic = "force-dynamic";

// Entrada. Quem ja tem sessao e esta na lista da casa vai direto para a
// Bateria. Quem nao esta na lista fica aqui, com uma frase clara e um
// botao para sair.
export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const permitido = user ? await emailPermitido(user.email) : false;

  // Cuidado com o ciclo: o layout do grupo autenticado manda para aqui
  // quem nao esta na lista, por isso nao se pode reencaminhar de volta
  // sem verificar a lista tambem.
  if (user && permitido) {
    redirect("/bateria");
  }

  const barrado = erro === "privada" || (!!user && !permitido);

  return (
    <main className="min-h-dvh flex flex-col justify-center gap-10 max-w-md mx-auto">
      <div className="flex flex-col gap-4">
        <div className="px-6 flex flex-col gap-4">
          <h1 className="m-0">
            <Wordmark className="w-44 h-auto text-[var(--color-tinta)]" />
          </h1>
          <p className="text-[var(--color-tinta-fraca)] text-lg leading-relaxed">
            {barrado
              ? "Esta aplicacao e de uma casa em particular, e essa conta nao faz parte dela."
              : "Sobe e desce, sem culpa. A porta de entrada da casa."}
          </p>
        </div>
        <MareVisual />
      </div>

      <div className="px-6 flex flex-col gap-4 items-center">
        {barrado ? <BotaoSair /> : <BotaoEntrar />}
        {erro === "sessao" && (
          <p className="text-base text-[var(--color-alerta)] text-center">
            Nao foi possivel entrar. Tenta outra vez.
          </p>
        )}
      </div>
    </main>
  );
}
