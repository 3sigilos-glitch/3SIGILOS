import BotaoSair from "@/app/sair";

// Quem esta la dentro, e como sair.
//
// Antes so havia um link "Terminar sessao" no fundo do ecra, que foi
// ficando soterrado a medida que o Nos cresceu, e nada dizia em que
// conta se estava. Com varias contas Google na mesma pessoa, isso e uma
// duvida real: quem entra pela conta errada nao percebe porque nao ve
// as suas coisas.

export default function Sessao({ email }: { email: string | undefined }) {
  return (
    <section className="w-full rounded-[var(--radius-cartao)] border border-[var(--color-traco)] px-4 py-4 flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-[var(--color-tinta-fraca)]">
          Estás nesta conta
        </span>
        <span className="text-base break-all">{email ?? "conta desconhecida"}</span>
      </div>
      <BotaoSair />
    </section>
  );
}
