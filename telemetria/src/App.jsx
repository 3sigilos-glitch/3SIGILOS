import React, { useCallback, useEffect, useState } from "react";
import Gauge from "./components/Gauge.jsx";
import TempGauge from "./components/TempGauge.jsx";
import TopBar from "./components/TopBar.jsx";
import DiagPanel from "./components/DiagPanel.jsx";
import DtcPanel from "./components/DtcPanel.jsx";
import { useTelemetry } from "./hooks/useTelemetry.js";

const REDLINE = 6000;

function Bar({ label, value, unit = "%", max = 100, accent = "#ff6a00", available = true }) {
  const frac = available && value !== null ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="label">{label}</span>
        <span
          className="font-mono text-[13px] tabular-nums text-bone/80"
          style={{ color: available ? undefined : "#4a5260" }}
        >
          {available && value !== null ? Math.round(value) : "--"}
          <span className="ml-0.5 text-bone/35">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-sm bg-carbon-800">
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{ width: `${frac * 100}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

function Cell({ label, value, unit }) {
  return (
    <div className="flex flex-col items-center justify-center border-l border-carbon-700 px-2 first:border-l-0">
      <span className="label">{label}</span>
      <span className="font-mono text-[15px] tabular-nums text-bone/85">
        {value}
        {unit && <span className="ml-0.5 text-[11px] text-bone/35">{unit}</span>}
      </span>
    </div>
  );
}

export default function App() {
  const t = useTelemetry();
  const [diag, setDiag] = useState(false);
  const [dtcOpen, setDtcOpen] = useState(false);
  const { data, source, unsupported } = t;
  const live = source === "live";

  const has = useCallback(
    (key) => !live || (!unsupported.includes(key) && data[key] !== null),
    [live, unsupported, data],
  );

  // Mantem o ecra aceso: o painel so serve de alguma coisa se ficar visivel.
  useEffect(() => {
    let lock = null;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator && document.visibilityState === "visible") {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        /* o browser pode recusar; nao e critico */
      }
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      document.removeEventListener("visibilitychange", acquire);
      lock?.release?.().catch(() => {});
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  const rpm = data.rpm ?? 0;
  const speed = data.speed ?? 0;

  return (
    <div className="carbon scanlines relative flex h-dvh w-full flex-col overflow-hidden">
      <TopBar
        source={source}
        status={t.status}
        deviceName={t.deviceName}
        stats={t.stats}
        protocolChoice={t.protocolChoice}
        setProtocolChoice={t.setProtocolChoice}
        onConnect={() => t.connect()}
        onConnectAll={() => t.connect({ acceptAll: true })}
        onDisconnect={t.disconnect}
        onToggleDiag={() => setDiag((v) => !v)}
        onToggleDtc={() => {
          setDtcOpen((v) => !v);
          if (!dtcOpen && !t.dtc) t.readDtcs();
        }}
        mil={t.dtc?.mil === true}
        onFullscreen={toggleFullscreen}
        bluetoothAvailable={t.bluetoothAvailable}
      />

      <main className="grid min-h-0 flex-1 grid-cols-[1fr_0.86fr_1fr] items-stretch gap-1 px-2 py-1">
        {/* ---------------------------------------------------------- RPM */}
        <section className="relative min-h-0">
          <Gauge
            label="ROTACOES"
            unit="x1000 RPM"
            value={rpm}
            min={0}
            max={7000}
            majorStep={1000}
            minorStep={250}
            scaleDivisor={1000}
            redline={REDLINE}
            accent={rpm >= REDLINE ? "#ff3b21" : "#ff6a00"}
            digitalValue={rpm}
            digits={0}
            available={has("rpm")}
            sub={live ? null : "SIMULADO"}
          />
        </section>

        {/* ------------------------------------------------------- CENTRO */}
        <section className="flex min-h-0 flex-col justify-between gap-1 py-1">
          <div className="min-h-0 flex-1">
            <TempGauge value={data.coolant} available={has("coolant")} />
          </div>

          <div className="flex flex-col gap-2 rounded-sm border border-carbon-700 bg-carbon-900/60 px-3 py-2 shadow-bezel">
            <Bar label="Carga" value={data.load} available={has("load")} accent="#ff8419" />
            <Bar
              label="Acelerador"
              value={data.throttle}
              available={has("throttle") && data.throttle !== null}
              accent="#5fd7e6"
            />
          </div>
        </section>

        {/* ----------------------------------------------------- VELOCIDADE */}
        <section className="relative min-h-0">
          <Gauge
            label="VELOCIDADE"
            unit="KM/H"
            value={speed}
            min={0}
            max={240}
            majorStep={40}
            minorStep={10}
            accent="#ff6a00"
            digitalValue={speed}
            digits={0}
            available={has("speed")}
            sub={data.gear ? `${data.gear}a MUDANCA` : null}
          />
        </section>
      </main>

      {/* ------------------------------------------------------------ RODAPE */}
      <footer className="grid shrink-0 grid-cols-5 border-t border-carbon-700 bg-carbon-900/80 py-1.5">
        <Cell
          label="Bateria"
          value={data.voltage !== null ? data.voltage.toFixed(1) : "--"}
          unit="V"
        />
        <Cell
          label="Admissao"
          value={has("intake") && data.intake !== null ? Math.round(data.intake) : "--"}
          unit="&#176;C"
        />
        <Cell label="Fonte" value={live ? "OBD2" : "MOCK"} />
        <Cell label="Taxa" value={live ? `${t.stats.hz}` : "60"} unit="Hz" />
        <Cell label="Protocolo" value={t.stats.protocol || (live ? "?" : "-")} />
      </footer>

      <DtcPanel
        open={dtcOpen}
        onClose={() => setDtcOpen(false)}
        dtc={t.dtc}
        busy={t.dtcBusy}
        onRead={t.readDtcs}
        onClear={t.clearDtcs}
        live={live}
      />

      <DiagPanel
        open={diag}
        log={t.log}
        error={t.error}
        unsupported={t.unsupported}
        onClose={() => setDiag(false)}
        onSend={t.sendRaw}
      />

      {/* Aviso de orientacao: o painel foi desenhado para 16:9 deitado. */}
      <div className="absolute inset-0 z-40 hidden flex-col items-center justify-center gap-3 bg-carbon-950/95 portrait:flex">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ff6a00" strokeWidth="1.5">
          <rect x="3" y="7" width="18" height="10" rx="2" />
          <path d="M7 3.5 A 9 9 0 0 1 17 3.5" strokeLinecap="round" />
        </svg>
        <p className="font-mono text-[12px] uppercase tracking-[0.25em] text-bone/70">
          Roda o ecra na horizontal
        </p>
      </div>
    </div>
  );
}
