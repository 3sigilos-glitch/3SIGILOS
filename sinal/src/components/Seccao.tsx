// Cabecalho de seccao com uma linha a dizer para que serve.
//
// Antes as seccoes tinham so um rotulo em maiusculas pequenas, cinzento,
// do genero "PARQUEADAS". Quem nao tivesse lido o metodo nao fazia ideia
// do que aquilo era, e a duvida chega no pior momento possivel, que e
// quando se abre a app com pouca paciencia.
//
// O titulo passa a ser legivel a serio, na cor do texto principal, e por
// baixo fica uma linha curta que diz o que a seccao faz. Sem acento de
// cor: neste ecra o acento e so da barra inferior, para nao competir.

export default function Seccao({
  titulo,
  ajuda,
  children,
}: {
  titulo: string;
  ajuda: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-medium tracking-tight">{titulo}</h2>
        <p className="text-sm text-[var(--color-tinta-fraca)] leading-relaxed">
          {ajuda}
        </p>
      </header>
      {children}
    </section>
  );
}

// Estado vazio. E um convite, nunca uma acusacao: diz o que ha para
// fazer, nao o que falta ter sido feito.
export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-base text-[var(--color-tinta-fraca)] leading-relaxed">
      {children}
    </p>
  );
}
