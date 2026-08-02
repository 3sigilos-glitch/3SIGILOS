import { criarClienteServidor } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import BotaoEntrar from "./entrar";
import BotaoSair from "./sair";

export const dynamic = "force-dynamic";

// Fase 0. Enquanto os quatro separadores nao existem, esta pagina
// serve para confirmar o essencial: entrar com Google, ficar num
// espaco, e ter o calendario ligado. E o ecra de verificacao da fase.

type Estado = {
  ligado: boolean;
  emEspaco: boolean;
};

async function estadoLigacao(userId: string): Promise<Estado> {
  const admin = criarClienteAdmin();

  const { data: token } = await admin
    .from("tokens_google")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: membro } = await admin
    .from("espaco_membros")
    .select("espaco_id")
    .eq("user_id", userId)
    .maybeSingle();

  return { ligado: !!token, emEspaco: !!membro };
}

export default async function Pagina() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  // Nome do proprio perfil, sujeito a RLS (so ve o proprio).
  const { data: perfil } = await supabase
    .from("perfis")
    .select("nome")
    .eq("id", user.id)
    .maybeSingle();

  const { ligado, emEspaco } = await estadoLigacao(user.id);

  return (
    <main className="min-h-dvh flex flex-col gap-8 px-6 py-12 max-w-md mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">SINAL</h1>
        <p className="text-[var(--color-tinta-fraca)] text-lg">
          Ola, {perfil?.nome ?? "pessoa"}.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <Linha
          rotulo="Sessao Google"
          ok
          texto="Ligada."
        />
        <Linha
          rotulo="Calendario"
          ok={ligado}
          texto={ligado ? "Ligado, pronto a escrever no calendario da casa." : "Ainda por ligar. Entra outra vez para autorizar."}
        />
        <Linha
          rotulo="Espaco"
          ok={emEspaco}
          texto={emEspaco ? "Estas no espaco da casa." : "Ainda sem espaco. Falta correr a semente."}
        />
      </section>

      <p className="text-[var(--color-tinta-fraca)] text-base leading-relaxed">
        Fase 0 pronta. Os separadores Bateria, Despejo, Nos e Agora chegam nas fases seguintes.
      </p>

      <div className="mt-auto pt-8">
        <BotaoSair />
      </div>
    </main>
  );
}

function Linha({
  rotulo,
  texto,
  ok,
}: {
  rotulo: string;
  texto: string;
  ok: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] px-4 py-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: ok ? "var(--color-ac-bateria)" : "var(--color-tinta-fraca)" }}
          aria-hidden
        />
        <span className="text-sm text-[var(--color-tinta-fraca)] uppercase tracking-wide">
          {rotulo}
        </span>
      </div>
      <p className="text-base">{texto}</p>
    </div>
  );
}
