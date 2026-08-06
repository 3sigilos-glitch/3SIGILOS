"use client";

import { useEffect, useState, useTransition } from "react";
import { listarPorTriar, triarCaptura, type CapturaTriagem } from "./acoes";

// Modo de triagem: um item de cada vez, em ecra cheio, quatro botoes
// grandes. Nunca mostrar a lista completa.
export default function ModoTriagem({ aoFechar }: { aoFechar: () => void }) {
  const [itens, setItens] = useState<CapturaTriagem[] | null>(null);
  const [i, setI] = useState(0);
  const [aProcessar, iniciar] = useTransition();

  useEffect(() => {
    listarPorTriar().then(setItens);
  }, []);

  function decidir(destino: "hoje" | "um_dia" | "casa" | "apagar") {
    if (!itens) return;
    const item = itens[i];
    if (!item) return;
    iniciar(async () => {
      await triarCaptura(item.id, destino);
      setI((n) => n + 1);
    });
  }

  const carregado = itens !== null;
  const item = itens?.[i];
  const acabou = carregado && !item;

  return (
    <div className="fixed inset-0 z-30 bg-[var(--color-breu)] flex flex-col">
      <div className="flex justify-end p-4">
        <button
          onClick={aoFechar}
          className="text-[var(--color-tinta-fraca)] text-base underline underline-offset-4"
        >
          Fechar
        </button>
      </div>

      {!carregado && (
        <div className="flex-1 flex items-center justify-center text-[var(--color-tinta-fraca)]">
          A carregar.
        </div>
      )}

      {acabou && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 text-center">
          <p className="text-xl">Triado.</p>
          <p className="text-[var(--color-tinta-fraca)] leading-relaxed">
            Passaste tudo o que estava a espera. Nada por triar de momento.
          </p>
          <button
            onClick={aoFechar}
            className="min-h-14 px-8 rounded-[var(--radius-cartao)] border border-[var(--color-traco)] text-[var(--color-tinta)] text-lg"
          >
            Voltar
          </button>
        </div>
      )}

      {item && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center px-8">
            <p className="text-2xl leading-relaxed text-center">{item.texto}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4" style={{ opacity: aProcessar ? 0.6 : 1 }}>
            <BotaoTriagem rotulo="Hoje" ajuda="fazer hoje" acento="var(--color-ac-agora)" onClick={() => decidir("hoje")} />
            <BotaoTriagem rotulo="Um dia" ajuda="fica para depois" acento="var(--color-ac-despejo)" onClick={() => decidir("um_dia")} />
            <BotaoTriagem rotulo="Casa" ajuda="passa para os dois" acento="var(--color-ac-nos)" onClick={() => decidir("casa")} />
            <BotaoTriagem rotulo="Apagar" ajuda="ja nao interessa" acento="var(--color-tinta-fraca)" onClick={() => decidir("apagar")} />
          </div>
        </div>
      )}
    </div>
  );
}

// Cada botao diz o que faz. "Um dia" e "Casa" sozinhos nao se explicam,
// e a triagem e para correr depressa, sem parar a pensar no que cada
// palavra queria dizer.
function BotaoTriagem({
  rotulo,
  ajuda,
  acento,
  onClick,
}: {
  rotulo: string;
  ajuda: string;
  acento: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="min-h-24 rounded-[var(--radius-cartao)] border flex flex-col items-center justify-center gap-1 px-2"
      style={{ borderColor: acento, color: "var(--color-tinta)" }}
    >
      <span className="text-xl font-medium">{rotulo}</span>
      <span className="text-xs text-[var(--color-tinta-fraca)]">{ajuda}</span>
    </button>
  );
}
