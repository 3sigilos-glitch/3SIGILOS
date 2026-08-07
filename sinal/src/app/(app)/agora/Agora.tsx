"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Temporizador from "@/components/Temporizador";
import Ecra from "@/components/Ecra";
import {
  escolher,
  iniciarTemporizador,
  guardarPassos,
  naoEHoje,
  concluir,
  type Candidata,
  type TarefaAgora,
} from "./acoes";

export default function Agora({ candidatas }: { candidatas: Candidata[] }) {
  const router = useRouter();
  const [tarefa, setTarefa] = useState<TarefaAgora | null>(null);
  const [capturaId, setCapturaId] = useState<string | null>(null);
  const [passoActual, setPassoActual] = useState(0);
  const [aDesdobrar, setADesdobrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  function escolherCaptura(id: string) {
    setErro(null);
    iniciar(async () => {
      const r = await escolher(id);
      if ("erro" in r) {
        setErro("Não foi possível abrir a tarefa. Tenta outra vez.");
        return;
      }
      setCapturaId(id);
      setTarefa(r);
      setPassoActual(0);
    });
  }

  function escolheTu() {
    if (candidatas.length === 0) return;
    const sorteada = candidatas[Math.floor(Math.random() * candidatas.length)];
    escolherCaptura(sorteada.id);
  }

  function arrancar() {
    if (!tarefa || tarefa.iniciada_em) return;
    iniciar(async () => {
      const r = await iniciarTemporizador(tarefa.id);
      if ("iniciada_em" in r) {
        setTarefa({ ...tarefa, iniciada_em: r.iniciada_em });
      }
    });
  }

  async function desdobrar() {
    if (!tarefa) return;
    setADesdobrar(true);
    setErro(null);
    try {
      const resposta = await fetch("/api/desdobrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: tarefa.titulo }),
      });
      const dados = await resposta.json();
      if (!resposta.ok || !Array.isArray(dados.passos)) {
        setErro(
          dados.erro === "sem_ia"
            ? "O desdobramento por IA ainda não está configurado."
            : "Não foi possível desdobrar agora."
        );
        setADesdobrar(false);
        return;
      }
      await guardarPassos(tarefa.id, dados.passos);
      setTarefa({ ...tarefa, passos: dados.passos });
      setPassoActual(0);
      // Temporizador ja pronto a arrancar: arranca automaticamente.
      if (!tarefa.iniciada_em) {
        const r = await iniciarTemporizador(tarefa.id);
        if ("iniciada_em" in r) {
          setTarefa((t) => (t ? { ...t, passos: dados.passos, iniciada_em: r.iniciada_em } : t));
        }
      }
    } catch {
      setErro("Não foi possível desdobrar agora.");
    } finally {
      setADesdobrar(false);
    }
  }

  function voltar(estado: "um_dia" | "concluida") {
    if (!tarefa) return;
    iniciar(async () => {
      if (estado === "um_dia") {
        await naoEHoje(capturaId ?? "", tarefa.id);
      } else {
        await concluir(tarefa.id, capturaId ?? undefined);
      }
      setTarefa(null);
      setCapturaId(null);
      router.refresh();
    });
  }

  // Ecra de escolha: tres cartoes.
  if (!tarefa) {
    return (
      <Ecra
        titulo="Agora"
        proposito="Uma coisa só, começada já. Escolhe uma, ou deixa a app escolher por ti."
      >
        {candidatas.length === 0 ? (
          <p className="text-[var(--color-tinta-fraca)] text-base leading-relaxed">
            Nada marcado para hoje. Na triagem do Despejo, põe algo em Hoje.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {candidatas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => escolherCaptura(c.id)}
                  className="text-left rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] px-4 py-4 text-lg"
                >
                  {c.texto}
                </button>
              ))}
            </div>
            <button
              onClick={escolheTu}
              className="self-center text-[var(--color-tinta-fraca)] text-base underline underline-offset-4"
            >
              Escolhe tu
            </button>
          </>
        )}
        {erro && <p className="text-[var(--color-alerta)] text-base">{erro}</p>}
      </Ecra>
    );
  }

  // Ecra de foco: titulo, temporizador, passo, accoes.
  const passo = tarefa.passos[passoActual];
  return (
    <main className="px-5 pt-6 flex flex-col items-center gap-8">
      <h1 className="text-xl font-medium text-center leading-relaxed">{tarefa.titulo}</h1>

      <button onClick={arrancar} aria-label="Arrancar temporizador" className="touch-none flex flex-col items-center gap-1">
        <Temporizador iniciadaEm={tarefa.iniciada_em} duracaoMin={tarefa.duracao_alvo_min} />
        {!tarefa.iniciada_em && (
          <span className="text-sm text-[var(--color-tinta-fraca)]">
            toca no círculo para começar
          </span>
        )}
      </button>

      {passo && (
        <div className="w-full rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] px-4 py-4 flex flex-col gap-3">
          <span className="text-sm text-[var(--color-tinta-fraca)] uppercase tracking-wide">
            Passo {passoActual + 1} de {tarefa.passos.length}
          </span>
          <p className="text-lg">{passo}</p>
          {passoActual < tarefa.passos.length - 1 && (
            <button
              onClick={() => setPassoActual((n) => n + 1)}
              className="self-start text-[var(--color-ac-agora)] text-base underline underline-offset-4"
            >
              Passo seguinte
            </button>
          )}
        </div>
      )}

      <div className="w-full flex flex-col gap-3">
        {tarefa.passos.length === 0 && (
          <button
            onClick={desdobrar}
            disabled={aDesdobrar}
            className="min-h-14 rounded-[var(--radius-cartao)] text-lg disabled:opacity-60"
            style={{ backgroundColor: "var(--color-ac-agora)", color: "var(--color-breu)" }}
          >
            {aDesdobrar ? "A desdobrar..." : "Desdobrar"}
          </button>
        )}
        {tarefa.iniciada_em && (
          <button
            onClick={() => voltar("concluida")}
            className="min-h-14 rounded-[var(--radius-cartao)] border text-lg"
            style={{ borderColor: "var(--color-ac-bateria)", color: "var(--color-tinta)" }}
          >
            Concluir
          </button>
        )}
        <button
          onClick={() => voltar("um_dia")}
          className="min-h-14 rounded-[var(--radius-cartao)] text-[var(--color-tinta-fraca)]"
        >
          Não é hoje
        </button>
      </div>

      {erro && <p className="text-[var(--color-alerta)] text-base text-center">{erro}</p>}
    </main>
  );
}
