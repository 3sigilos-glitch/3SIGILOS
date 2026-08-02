"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarObrigacao } from "./acoes";

export type Obrigacao = { id: string; titulo: string; data_limite: string };

const MENSAGENS: Record<string, string> = {
  sem_calendario: "Falta ligar o calendario da casa. Fala com quem configurou.",
  reautenticar: "A ligacao a Google expirou. Entra outra vez para religar o calendario.",
  calendario: "Nao foi possivel escrever no calendario agora. Tenta outra vez.",
  incompleto: "Falta o titulo ou a data.",
};

export default function Obrigacoes({ obrigacoes }: { obrigacoes: Obrigacao[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [avisar, setAvisar] = useState(1);
  const [resultado, setResultado] = useState<string | null>(null);
  const [aGuardar, iniciar] = useTransition();

  function guardar() {
    setResultado(null);
    iniciar(async () => {
      const r = await criarObrigacao({ titulo, data, avisarDias: avisar });
      if (r?.erro) {
        setResultado(MENSAGENS[r.erro] ?? "Nao foi possivel guardar agora.");
        return;
      }
      setResultado("Guardado no calendario da casa.");
      setTitulo("");
      setData("");
      setAvisar(1);
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base text-[var(--color-tinta-fraca)] uppercase tracking-wide">
        Obrigacoes com data
      </h2>

      <ul className="flex flex-col gap-2">
        {obrigacoes.map((o) => (
          <li
            key={o.id}
            className="rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] px-4 py-3 flex items-center justify-between gap-3"
          >
            <span className="text-base">{o.titulo}</span>
            <span className="mono text-sm text-[var(--color-tinta-fraca)]">
              {new Date(o.data_limite + "T00:00:00").toLocaleDateString("pt-PT", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </li>
        ))}
      </ul>

      {aberto ? (
        <div className="flex flex-col gap-3 rounded-[var(--radius-cartao)] border border-[var(--color-traco)] p-3">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="O que e?"
            className="w-full rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] p-3 text-base text-[var(--color-tinta)] outline-none"
          />
          <label className="flex items-center justify-between gap-3 text-base">
            <span className="text-[var(--color-tinta-fraca)]">Data</span>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] p-2 text-base text-[var(--color-tinta)] mono outline-none"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-base">
            <span className="text-[var(--color-tinta-fraca)]">Avisar com</span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={30}
                value={avisar}
                onChange={(e) => setAvisar(Number(e.target.value))}
                className="w-16 rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] p-2 text-base text-[var(--color-tinta)] mono text-center outline-none"
              />
              <span className="text-[var(--color-tinta-fraca)]">dias</span>
            </span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={aGuardar}
              className="flex-1 min-h-12 rounded-[var(--radius-cartao)] disabled:opacity-60"
              style={{ backgroundColor: "var(--color-ac-nos)", color: "var(--color-breu)" }}
            >
              {aGuardar ? "A guardar..." : "Guardar"}
            </button>
            <button
              onClick={() => setAberto(false)}
              className="min-h-12 px-4 text-[var(--color-tinta-fraca)]"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAberto(true)}
          className="self-start text-[var(--color-tinta-fraca)] text-base underline underline-offset-4"
        >
          Marcar obrigacao
        </button>
      )}

      {resultado && (
        <p className="text-base text-[var(--color-tinta-fraca)]" aria-live="polite">
          {resultado}
        </p>
      )}
    </section>
  );
}
