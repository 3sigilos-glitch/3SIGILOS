import React, { useEffect, useRef, useState } from "react";

const COLORS = { tx: "text-ember-400", rx: "text-ice-300", sys: "text-bone/45" };
const PREFIX = { tx: ">>", rx: "<<", sys: "--" };

/** Consola de diagnostico: mostra o dialogo cru com o ELM327. */
export default function DiagPanel({ open, log, onClose, onSend, error, unsupported }) {
  const [cmd, setCmd] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: "end" });
  }, [log, open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-carbon-950">
      <div className="flex items-center gap-3 border-b border-carbon-700 px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ice-300">
          Consola ELM327
        </span>
        {unsupported.length > 0 && (
          <span className="font-mono text-[11px] tracking-[0.12em] text-ember-400">
            sem suporte: {unsupported.join(", ")}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-sm border border-carbon-600 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-bone/70"
        >
          Fechar
        </button>
      </div>

      {error && (
        <p className="border-b border-ember-500/40 bg-ember-500/10 px-3 py-2 font-mono text-[12px] text-ember-300">
          {error}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[12px] leading-5">
        {log.length === 0 && <p className="text-bone/30">Sem tráfego ainda.</p>}
        {log.map((l, i) => (
          <p key={`${l.t}-${i}`} className={COLORS[l.dir] || COLORS.sys}>
            <span className="text-bone/25">{PREFIX[l.dir] || "--"} </span>
            {l.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2 border-t border-carbon-700 px-3 py-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!cmd.trim()) return;
          onSend(cmd);
          setCmd("");
        }}
      >
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="ATDP, 0100, 010C..."
          autoComplete="off"
          spellCheck="false"
          className="min-w-0 flex-1 rounded-sm border border-carbon-600 bg-carbon-850 px-2 py-1.5 font-mono text-[12px] uppercase tracking-[0.1em] text-bone outline-none focus:border-ice-400"
        />
        <button
          type="submit"
          className="rounded-sm border border-ice-400 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ice-300"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
