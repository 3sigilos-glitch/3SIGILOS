// Cabecalho de ecra: nome e uma linha a dizer para que serve.
//
// Os ecras tinham so o nome ("Bateria", "Nos", "Agora"). Um nome sozinho
// obriga a lembrar o que aquilo faz, e essa memoria e exactamente o que
// falha nos dias maus. Uma linha por baixo resolve, e deixa de ser
// preciso lembrar seja o que for.

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
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="text-sm text-[var(--color-tinta-fraca)] leading-relaxed">
          {proposito}
        </p>
      </header>
      {children}
    </main>
  );
}
