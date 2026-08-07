"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarTarefaCasa, pegarTarefa, concluirTarefa } from "./acoes";
import Seccao, { Vazio } from "@/components/Seccao";

export type TarefaCasa = {
  id: string;
  titulo: string;
  pegou: string | null;
  nomePegou: string | null;
};

export default function TarefasCasa({ tarefas }: { tarefas: TarefaCasa[] }) {
  const router = useRouter();
  const [novo, setNovo] = useState("");
  const [aAdicionar, setAAdicionar] = useState(false);
  const [aProcessar, iniciar] = useTransition();

  function adicionar() {
    const t = novo.trim();
    if (!t) return;
    iniciar(async () => {
      await criarTarefaCasa(t);
      setNovo("");
      setAAdicionar(false);
      router.refresh();
    });
  }

  return (
    <Seccao
      titulo="Tarefas da casa"
      ajuda="Coisas por fazer que não têm dono. Quem puder, carrega em Eu pego. Ninguém atribui nada a ninguém."
    >
      {tarefas.length === 0 && <Vazio>Nada na lista. Fica bem assim.</Vazio>}

      <ul className="flex flex-col gap-2">
        {tarefas.map((t) => (
          <li
            key={t.id}
            className="rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] px-4 py-3 flex items-center gap-3"
          >
            <span className="flex-1 text-base">{t.titulo}</span>
            {t.pegou ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-tinta-fraca)]">{t.nomePegou}</span>
                <button
                  onClick={() => iniciar(async () => { await concluirTarefa(t.id); router.refresh(); })}
                  className="text-sm underline underline-offset-4 text-[var(--color-tinta-fraca)]"
                >
                  Feita
                </button>
              </div>
            ) : (
              <button
                onClick={() => iniciar(async () => { await pegarTarefa(t.id); router.refresh(); })}
                disabled={aProcessar}
                className="min-h-11 px-4 rounded-full border text-base"
                style={{ borderColor: "var(--color-ac-nos)", color: "var(--color-tinta)" }}
              >
                Eu pego
              </button>
            )}
          </li>
        ))}
      </ul>

      {aAdicionar ? (
        <div className="flex flex-col gap-2">
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            autoFocus
            placeholder="O que ha a fazer?"
            className="w-full rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] p-3 text-base text-[var(--color-tinta)] outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={adicionar}
              className="flex-1 min-h-12 rounded-[var(--radius-cartao)]"
              style={{ backgroundColor: "var(--color-ac-nos)", color: "var(--color-breu)" }}
            >
              Juntar
            </button>
            <button
              onClick={() => { setAAdicionar(false); setNovo(""); }}
              className="min-h-12 px-4 text-[var(--color-tinta-fraca)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAAdicionar(true)}
          className="self-start text-[var(--color-tinta-fraca)] text-base underline underline-offset-4"
        >
          Juntar tarefa
        </button>
      )}
    </Seccao>
  );
}
