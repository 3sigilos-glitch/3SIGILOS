"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { criarObrigacao } from "./acoes";
import Seccao, { Vazio } from "@/components/Seccao";

export type Obrigacao = { id: string; titulo: string; data_limite: string };

const MENSAGENS: Record<string, string> = {
  sem_calendario: "Falta ligar o calendário da casa. Fala com quem configurou.",
  reautenticar:
    "A ligação à Google expirou. Termina sessão e entra outra vez para religar o calendário.",
  api_desligada:
    "A Google Calendar API não está ligada no projeto Google desta app. Quem a configurou tem de a ligar na Google Cloud Console. Nada aqui está mal.",
  sem_ambito:
    "Esta conta entrou sem dar permissão ao calendário. Termina sessão, entra outra vez e aceita o pedido do calendário.",
  sem_acesso:
    "Esta conta não consegue escrever no calendário da casa. Confirma que o calendário está partilhado com ela, com permissão de fazer alterações a eventos, e que o convite foi aceite.",
  desconhecido: "Não foi possível escrever no calendário agora. Tenta outra vez.",
  calendario: "Não foi possível escrever no calendário agora. Tenta outra vez.",
  incompleto: "Falta o título ou a data.",
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
        setResultado(MENSAGENS[r.erro] ?? "Não foi possível guardar agora.");
        return;
      }
      setResultado("Guardado no calendário da casa.");
      setTitulo("");
      setData("");
      setAvisar(1);
      setAberto(false);
      router.refresh();
    });
  }

  return (
    <Seccao
      titulo="Obrigações com data"
      ajuda="Coisas marcadas: consultas, revisões, prazos. Vão para o calendário da casa e aparecem sozinhas na roda dos dois telemóveis."
    >
      {obrigacoes.length === 0 && (
        <Vazio>Nada marcado. O que tiver data entra aqui e vai para o calendário.</Vazio>
      )}

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
            placeholder="O que é?"
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
          Marcar obrigação
        </button>
      )}

      {resultado && (
        <p className="text-base text-[var(--color-tinta-fraca)]" aria-live="polite">
          {resultado}
        </p>
      )}
    </Seccao>
  );
}
