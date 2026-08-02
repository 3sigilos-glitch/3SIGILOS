"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarDecisao, resolverDecisao } from "./acoes";

export type Decisao = { id: string; titulo: string; notas: string | null };

export default function Parqueadas({ decisoes }: { decisoes: Decisao[] }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [notas, setNotas] = useState("");
  const [, iniciar] = useTransition();

  function guardar() {
    const t = titulo.trim();
    if (!t) return;
    iniciar(async () => {
      await criarDecisao({ titulo: t, notas });
      setTitulo("");
      setNotas("");
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base text-[var(--color-tinta-fraca)] uppercase tracking-wide">
        Parqueadas
      </h2>

      {decisoes.length === 0 && (
        <p className="text-[var(--color-tinta-fraca)] text-base">
          Nada a decidir por agora.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {decisoes.map((d) => (
          <li
            key={d.id}
            className="rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] px-4 py-3 flex flex-col gap-1"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-base flex-1">{d.titulo}</span>
              <button
                onClick={() => iniciar(async () => { await resolverDecisao(d.id); router.refresh(); })}
                className="text-sm underline underline-offset-4 text-[var(--color-tinta-fraca)]"
              >
                Resolvida
              </button>
            </div>
            {d.notas && (
              <span className="text-sm text-[var(--color-tinta-fraca)]">{d.notas}</span>
            )}
          </li>
        ))}
      </ul>

      {aberto ? (
        <div className="flex flex-col gap-2 rounded-[var(--radius-cartao)] border border-[var(--color-traco)] p-3">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
            placeholder="O que ha a conversar?"
            className="w-full rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] p-3 text-base text-[var(--color-tinta)] outline-none"
          />
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Nota (opcional)"
            className="w-full rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] p-3 text-base text-[var(--color-tinta)] outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={guardar}
              className="flex-1 min-h-12 rounded-[var(--radius-cartao)]"
              style={{ backgroundColor: "var(--color-ac-nos)", color: "var(--color-breu)" }}
            >
              Parquear
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
          Parquear assunto
        </button>
      )}
    </section>
  );
}
