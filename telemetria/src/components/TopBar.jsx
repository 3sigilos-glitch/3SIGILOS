import React from "react";

const STATUS_TEXT = {
  desligado: "SEM LIGACAO",
  "a-procurar": "A PROCURAR",
  "a-ligar": "A LIGAR",
  "a-inicializar": "ELM327 A ARRANCAR",
  "a-ligar-centralina": "A FALAR COM A CENTRALINA",
  ligado: "EM LINHA",
};

const PROTOCOLS = [
  { v: "0", t: "AUTO" },
  { v: "3", t: "ISO 9141-2" },
  { v: "4", t: "KWP 5-BAUD" },
  { v: "5", t: "KWP FAST" },
  { v: "6", t: "CAN 11/500" },
];

function Btn({ children, onClick, tone = "ghost", disabled }) {
  const tones = {
    ghost: "border-carbon-600 text-bone/70 hover:border-ice-400 hover:text-ice-300",
    hot: "border-ember-500 text-ember-400 hover:bg-ember-500 hover:text-carbon-950",
    live: "border-ice-400 text-ice-300 hover:bg-ice-400 hover:text-carbon-950",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors disabled:opacity-35 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export default function TopBar({
  source,
  status,
  deviceName,
  stats,
  protocolChoice,
  setProtocolChoice,
  onConnect,
  onConnectAll,
  onDisconnect,
  onToggleDiag,
  onToggleDtc,
  onFullscreen,
  bluetoothAvailable,
  mil = false,
}) {
  const live = source === "live";
  const busy = status !== "desligado" && status !== "ligado";

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-carbon-700 bg-carbon-900/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            live ? "bg-ice-400 shadow-[0_0_10px_2px_rgba(95,215,230,0.6)]" : "bg-ember-500"
          } ${busy ? "animate-pulse" : ""}`}
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-bone/70">
          {live ? STATUS_TEXT.ligado : STATUS_TEXT[status] || status}
        </span>
      </div>

      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-bone/35">
        {live ? deviceName || "ELM327" : "SIMULACAO"}
      </span>

      {live && (
        <span className="font-mono text-[11px] tracking-[0.12em] text-ice-300/60">
          {stats.hz} Hz &middot; {stats.rtt} ms
          {stats.protocol ? ` · ${stats.protocol}` : ""}
          {stats.errors ? ` · ${stats.errors} err` : ""}
        </span>
      )}

      {mil && (
        <span className="flex items-center gap-1.5 rounded-sm border border-ember-500/60 bg-ember-500/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ember-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember-500" />
          Check engine
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {!live && (
          <label className="flex items-center gap-1.5">
            <span className="label">PROT</span>
            <select
              value={protocolChoice}
              onChange={(e) => setProtocolChoice(e.target.value)}
              className="rounded-sm border border-carbon-600 bg-carbon-850 px-1.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-bone/70 outline-none"
            >
              {PROTOCOLS.map((p) => (
                <option key={p.v} value={p.v}>
                  {p.t}
                </option>
              ))}
            </select>
          </label>
        )}

        <Btn onClick={onToggleDtc}>Codigos</Btn>
        <Btn onClick={onToggleDiag}>Diag</Btn>
        <Btn onClick={onFullscreen}>Ecra</Btn>

        {live ? (
          <Btn tone="hot" onClick={onDisconnect}>
            Desligar
          </Btn>
        ) : (
          <>
            <Btn tone="ghost" onClick={onConnectAll} disabled={!bluetoothAvailable || busy}>
              Ver todos
            </Btn>
            <Btn tone="live" onClick={onConnect} disabled={!bluetoothAvailable || busy}>
              Ligar OBD2
            </Btn>
          </>
        )}
      </div>
    </header>
  );
}
