import React, { useState } from "react";
import { describeDtc, needsDealerTool } from "../lib/dtc.js";

function CodeRow({ code, kind }) {
  const dealer = needsDealerTool(code);
  return (
    <li className="flex items-baseline gap-3 border-b border-carbon-800 py-2 last:border-b-0">
      <span
        className={`font-mono text-[15px] font-bold tracking-[0.1em] ${
          kind === "pending" ? "text-ice-300" : "text-ember-400"
        }`}
      >
        {code}
      </span>
      <span className="text-[13px] text-bone/70">{describeDtc(code)}</span>
      {dealer && (
        <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-bone/35">
          exige XENTRY
        </span>
      )}
    </li>
  );
}

/**
 * Codigos de avaria do OBD2 normalizado: modo 03 (guardados) e 07 (pendentes).
 * Nao cobre ESP, ABS, BAS, airbag nem SAM, que sao modulos proprios da
 * Mercedes fora do ambito do OBD2 generico.
 */
export default function DtcPanel({ open, onClose, dtc, busy, onRead, onClear, live }) {
  const [confirmClear, setConfirmClear] = useState(false);
  if (!open) return null;

  const stored = dtc?.stored || [];
  const pending = dtc?.pending || [];
  const lido = dtc && !dtc.error;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-carbon-950">
      <div className="flex shrink-0 items-center gap-3 border-b border-carbon-700 px-3 py-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ice-300">
          Codigos de avaria
        </span>
        {lido && (
          <span className="font-mono text-[11px] tracking-[0.12em] text-bone/45">
            luz do motor: {dtc.mil === null ? "?" : dtc.mil ? "ACESA" : "apagada"}
            {dtc.count !== null ? ` · ${dtc.count} guardado(s)` : ""}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRead}
            disabled={busy}
            className="rounded-sm border border-ice-400 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ice-300 disabled:opacity-35"
          >
            {busy ? "A ler..." : "Ler"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirmClear) {
                setConfirmClear(false);
                onClear();
              } else {
                setConfirmClear(true);
              }
            }}
            disabled={!live || busy || stored.length === 0 || dtc?.demo}
            className="rounded-sm border border-ember-500 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ember-400 disabled:opacity-35"
          >
            {confirmClear ? "Confirmar?" : "Apagar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-carbon-600 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-bone/70"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {dtc?.demo && (
          <p className="mb-3 border border-ice-400/40 bg-ice-400/5 px-3 py-2 text-[13px] text-ice-300">
            Exemplo simulado, para se ver o aspecto do painel. Liga-te ao carro para ler os
            codigos a serio.
          </p>
        )}

        {!live && !dtc && (
          <p className="text-[13px] text-bone/50">
            Carrega em Ler para ver um exemplo, ou liga-te ao carro para ler codigos a serio.
          </p>
        )}

        {dtc?.error && (
          <p className="mb-3 border border-ember-500/40 bg-ember-500/10 px-3 py-2 font-mono text-[12px] text-ember-300">
            {dtc.error}
          </p>
        )}

        {confirmClear && (
          <p className="mb-3 border border-ember-500/40 bg-ember-500/10 px-3 py-2 text-[13px] text-ember-300">
            Apagar os codigos tambem apaga os monitores de prontidao. O carro tem de rodar
            algumas dezenas de quilometros antes de voltar a passar na inspeccao. Carrega
            outra vez em Apagar para confirmar.
          </p>
        )}

        {live && !dtc && !busy && (
          <p className="text-[13px] text-bone/50">Carrega em Ler para interrogar a centralina.</p>
        )}

        {lido && (
          <>
            <h3 className="label mb-1 mt-1">Guardados (modo 03)</h3>
            {stored.length === 0 ? (
              <p className="mb-4 text-[13px] text-bone/45">
                Nenhum codigo guardado.{dtc.note ? ` ${dtc.note}` : ""}
              </p>
            ) : (
              <ul className="mb-4">
                {stored.map((c) => (
                  <CodeRow key={`s-${c}`} code={c} kind="stored" />
                ))}
              </ul>
            )}

            <h3 className="label mb-1">Pendentes (modo 07)</h3>
            {pending.length === 0 ? (
              <p className="mb-4 text-[13px] text-bone/45">Nenhum codigo pendente.</p>
            ) : (
              <ul className="mb-4">
                {pending.map((c) => (
                  <CodeRow key={`p-${c}`} code={c} kind="pending" />
                ))}
              </ul>
            )}
          </>
        )}

        <div className="mt-4 border-t border-carbon-700 pt-3">
          <h3 className="label mb-2">O que fica de fora</h3>
          <p className="max-w-[70ch] text-[12.5px] leading-relaxed text-bone/45">
            O OBD2 normalizado so obriga a centralina a expor o que diz respeito a emissoes,
            ou seja motor e caixa (codigos P). No W203 o ESP, o ABS, o BAS, o airbag e os
            modulos SAM sao unidades proprias no barramento CAN interno da Mercedes, com
            codigos C e B que se leem por protocolo proprietario. Para esses e preciso
            XENTRY/DAS, um iCarsoft MB II ou equivalente. Um ELM327 generico nao os alcanca,
            por muito que a luz do ESP esteja acesa no painel.
          </p>
        </div>
      </div>
    </div>
  );
}
