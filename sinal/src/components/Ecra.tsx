import BotaoSair from "@/app/sair";

// Cabecalho de ecra: nome, uma linha a dizer para que serve, e a saida.
//
// Os ecras tinham so o nome ("Bateria", "Nós", "Agora"). Um nome sozinho
// obriga a lembrar o que aquilo faz, e essa memoria e exactamente o que
// falha nos dias maus. Uma linha por baixo resolve, e deixa de ser
// preciso lembrar seja o que for.
//
// O "Sair" fica aqui, no mesmo canto em todos os ecras, para nunca ter de
// ser procurado.

export default function Ecra({
  titulo,
  proposito,
  children,
}: {
  titulo: string;
  proposito: string;
  children: React.ReactNode;
}) {
  return (
    <main className="px-5 pt-6 flex flex-col gap-8 pb-4">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          <BotaoSair variante="compacta" />
        </div>
        <p className="text-sm text-[var(--color-tinta-fraca)] leading-relaxed">
          {proposito}
        </p>
      </header>
      {children}
    </main>
  );
}
