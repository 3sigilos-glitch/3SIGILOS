"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { guardarLocal, sincronizarFila, contarLocal } from "@/lib/offline/fila";
import { contarPorTriar } from "./acoes";
import ModoTriagem from "./ModoTriagem";

type Modo = "parado" | "a_ouvir" | "guardado";

export default function Despejo({ contagemInicial }: { contagemInicial: number }) {
  const params = useSearchParams();
  const [modo, setModo] = useState<Modo>("parado");
  const [interim, setInterim] = useState("");
  const [contagem, setContagem] = useState(contagemInicial);
  const [triagem, setTriagem] = useState(false);
  const [tecladoAberto, setTecladoAberto] = useState(false);
  const [textoTeclado, setTextoTeclado] = useState("");
  const [suportaVoz, setSuportaVoz] = useState(true);

  const recRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef("");
  const guardarAoTerminarRef = useRef(false);

  const guardarCaptura = useCallback(async (texto: string, origem: "voz" | "teclado") => {
    const limpo = texto.trim();
    if (!limpo) return;
    const captura = {
      id: crypto.randomUUID(),
      texto: limpo,
      origem,
      criado_em: new Date().toISOString(),
    };
    // Escrita local imediata. Nunca bloquear a interface a espera da rede.
    await guardarLocal(captura);
    setContagem((n) => n + 1);
    setModo("guardado");
    // Sincronizar em segundo plano.
    sincronizarFila().catch(() => {});
    setTimeout(() => setModo("parado"), 1500);
  }, []);

  // Suporte a voz e sincronizacao ao abrir e ao voltar a rede.
  useEffect(() => {
    const C = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSuportaVoz(!!C);

    async function refrescarContagem() {
      try {
        const [servidor, local] = await Promise.all([contarPorTriar(), contarLocal()]);
        setContagem(servidor + local);
      } catch {
        // manter contagem actual
      }
    }
    sincronizarFila().then(refrescarContagem).catch(() => {});

    const aoVoltarRede = () => sincronizarFila().then(refrescarContagem).catch(() => {});
    window.addEventListener("online", aoVoltarRede);
    return () => window.removeEventListener("online", aoVoltarRede);
  }, []);

  const iniciarGravacao = useCallback(() => {
    const C = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!C) {
      setTecladoAberto(true);
      return;
    }
    const rec = new C();
    rec.lang = "pt-PT";
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = "";
    setInterim("");
    guardarAoTerminarRef.current = true;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interina = "";
      for (let k = e.resultIndex; k < e.results.length; k++) {
        const r = e.results[k];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interina += r[0].transcript;
      }
      setInterim(interina);
    };
    rec.onend = () => {
      if (guardarAoTerminarRef.current) {
        guardarAoTerminarRef.current = false;
        const texto = (finalRef.current || interim).trim();
        setInterim("");
        if (texto) guardarCaptura(texto, "voz");
        else setModo("parado");
      }
    };
    rec.onerror = () => {
      // Ignora, o onend trata do fecho.
    };

    try {
      rec.start();
      recRef.current = rec;
      setModo("a_ouvir");
    } catch {
      setModo("parado");
    }
  }, [guardarCaptura, interim]);

  const pararGravacao = useCallback(() => {
    const rec = recRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ja parado
      }
    }
  }, []);

  // Atalho ?gravar=1: tenta arrancar a gravacao sem toque adicional.
  useEffect(() => {
    if (params.get("gravar") === "1" && suportaVoz) {
      // Alguns browsers exigem gesto. Se falhar, fica no estado parado.
      iniciarGravacao();
    }
    // so uma vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suportaVoz]);

  const emGravacao = modo === "a_ouvir";

  return (
    <main className="min-h-[calc(100dvh-6rem)] flex flex-col px-5 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Despejo</h1>
        <p className="text-sm text-[var(--color-tinta-fraca)] leading-relaxed">
          Tira da cabeca e larga aqui. Nao decides nada agora, nem
          categorias nem prazos: isso e noutro dia.
        </p>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            if (suportaVoz) iniciarGravacao();
            else setTecladoAberto(true);
          }}
          onPointerUp={() => {
            if (emGravacao) pararGravacao();
          }}
          onPointerLeave={() => {
            if (emGravacao) pararGravacao();
          }}
          aria-label={suportaVoz ? "Premir e manter para gravar" : "Escrever captura"}
          className="rounded-full flex items-center justify-center touch-none"
          style={{
            width: "min(70vw, 16rem)",
            height: "min(70vw, 16rem)",
            border: `3px solid ${emGravacao ? "var(--color-ac-despejo)" : "var(--color-traco)"}`,
            backgroundColor: emGravacao
              ? "color-mix(in srgb, var(--color-ac-despejo) 18%, transparent)"
              : "var(--color-placa)",
            transition: "background-color .15s, border-color .15s",
          }}
        >
          <span
            className="text-lg"
            style={{ color: emGravacao ? "var(--color-ac-despejo)" : "var(--color-tinta-fraca)" }}
          >
            {modo === "guardado" ? "Guardado" : emGravacao ? "A ouvir" : "Manter para falar"}
          </span>
        </button>

        <div className="min-h-8 text-center text-[var(--color-tinta-fraca)] px-6">
          {interim}
        </div>

        <button
          onClick={() => setTecladoAberto((a) => !a)}
          className="text-[var(--color-tinta-fraca)] text-base underline underline-offset-4"
        >
          Escrever
        </button>

        {tecladoAberto && (
          <div className="w-full max-w-sm flex flex-col gap-3">
            <textarea
              value={textoTeclado}
              onChange={(e) => setTextoTeclado(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Escreve e guarda."
              className="w-full rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] p-3 text-lg text-[var(--color-tinta)] outline-none"
            />
            <button
              onClick={async () => {
                await guardarCaptura(textoTeclado, "teclado");
                setTextoTeclado("");
                setTecladoAberto(false);
              }}
              className="min-h-14 rounded-[var(--radius-cartao)] text-lg"
              style={{ backgroundColor: "var(--color-ac-despejo)", color: "var(--color-breu)" }}
            >
              Guardar
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setTriagem(true)}
        className="py-4 flex flex-col items-center gap-0.5"
      >
        <span className="mono text-base text-[var(--color-tinta-fraca)]">
          {contagem} por triar
        </span>
        <span className="text-xs text-[var(--color-tinta-fraca)]">
          toca para decidir uma de cada vez
        </span>
      </button>

      {triagem && (
        <ModoTriagem
          aoFechar={async () => {
            setTriagem(false);
            try {
              const [servidor, local] = await Promise.all([contarPorTriar(), contarLocal()]);
              setContagem(servidor + local);
            } catch {
              // manter
            }
          }}
        />
      )}
    </main>
  );
}
