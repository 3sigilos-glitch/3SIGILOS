import { useCallback, useEffect, useRef, useState } from "react";
import { Elm327, bluetoothAvailable } from "../lib/elm327.js";
import { PIDS, parsePid, parseVoltage, parseProtocol, responseError, toBytes } from "../lib/obd.js";
import { parseDtcBytes, parseMilStatus } from "../lib/dtc.js";
import { createMockSource } from "../lib/mock.js";

const EMPTY = {
  rpm: 0,
  speed: 0,
  coolant: null,
  throttle: null,
  load: null,
  intake: null,
  voltage: null,
  gear: null,
};

// Ordem do polling. RPM e velocidade sao os que precisam de cadencia alta;
// a temperatura do liquido mexe-se devagar e entra so de cinco em cinco.
const SCHEDULE = ["rpm", "speed", "rpm", "speed", "rpm", "speed", "coolant", "load"];

const MAX_LOG = 120;

export function useTelemetry() {
  const [source, setSource] = useState("mock"); // "mock" | "live"
  const [status, setStatus] = useState("desligado");
  const [error, setError] = useState(null);
  const [deviceName, setDeviceName] = useState(null);
  const [data, setData] = useState(EMPTY);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ hz: 0, rtt: 0, errors: 0, protocol: null });
  const [unsupported, setUnsupported] = useState([]);
  const [protocolChoice, setProtocolChoice] = useState("0");
  const [dtc, setDtc] = useState(null);
  const [dtcBusy, setDtcBusy] = useState(false);

  const elmRef = useRef(null);
  const liveRef = useRef(false);
  const dataRef = useRef(EMPTY);

  const pushLog = useCallback((entry) => {
    setLog((prev) => {
      const next = [...prev, entry];
      return next.length > MAX_LOG ? next.slice(next.length - MAX_LOG) : next;
    });
  }, []);

  const commit = useCallback((patch) => {
    dataRef.current = { ...dataRef.current, ...patch };
    setData(dataRef.current);
  }, []);

  // ---------------------------------------------------------------- mock ---
  useEffect(() => {
    if (source !== "mock") return undefined;
    const tick = createMockSource();
    let raf = 0;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      commit(tick(dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [source, commit]);

  // ---------------------------------------------------------------- live ---
  const runPollLoop = useCallback(
    async (elm) => {
      let i = 0;
      let samples = 0;
      let windowStart = performance.now();
      let rttSum = 0;
      let errors = 0;
      const failures = {};
      const dead = new Set();
      let sinceVoltage = 0;

      while (liveRef.current && elm.connected) {
        const key = SCHEDULE[i % SCHEDULE.length];
        i += 1;

        if (dead.has(key)) continue;

        const def = PIDS[key];
        const started = performance.now();
        try {
          const raw = await elm.send(def.cmd, { timeout: 4000 });
          const value = parsePid(raw, def);
          if (value === null) {
            errors += 1;
            failures[key] = (failures[key] || 0) + 1;
            // Tres respostas invalidas seguidas: a centralina nao suporta
            // este PID (acontece em motores anteriores ao EOBD completo).
            if (failures[key] >= 3) {
              dead.add(key);
              setUnsupported((prev) => (prev.includes(key) ? prev : [...prev, key]));
              pushLog({
                dir: "sys",
                t: Date.now(),
                text: `${def.cmd} sem dados uteis (${responseError(raw) || "resposta invalida"}). A deixar de perguntar.`,
              });
            }
          } else {
            failures[key] = 0;
            commit({ [key]: key === "rpm" ? Math.round(value) : Math.round(value) });
          }
        } catch (err) {
          errors += 1;
          pushLog({ dir: "sys", t: Date.now(), text: err.message });
          if (!elm.connected) break;
        }

        rttSum += performance.now() - started;
        samples += 1;

        // Tensao da bateria de 5 em 5 segundos: nao e um PID, e um comando
        // do proprio adaptador, e por isso e barato.
        sinceVoltage += 1;
        if (sinceVoltage >= 40) {
          sinceVoltage = 0;
          try {
            const raw = await elm.send("ATRV", { timeout: 2000 });
            const v = parseVoltage(raw);
            if (v !== null) commit({ voltage: v });
          } catch {
            /* ignora */
          }
        }

        const elapsed = performance.now() - windowStart;
        if (elapsed >= 1000) {
          setStats((prev) => ({
            ...prev,
            hz: Math.round((samples / elapsed) * 1000 * 10) / 10,
            rtt: Math.round(rttSum / Math.max(1, samples)),
            errors: prev.errors + errors,
          }));
          samples = 0;
          rttSum = 0;
          errors = 0;
          windowStart = performance.now();
        }
      }
    },
    [commit, pushLog],
  );

  const connect = useCallback(
    async ({ acceptAll = false } = {}) => {
      setError(null);
      if (!bluetoothAvailable()) {
        setError(
          "Este browser nao tem Web Bluetooth. Precisas do Chrome (ou Edge) numa pagina https.",
        );
        return;
      }

      const elm = new Elm327({
        onLog: pushLog,
        onStatus: setStatus,
        onDisconnect: () => {
          liveRef.current = false;
          setSource("mock");
          setDeviceName(null);
        },
      });
      elmRef.current = elm;

      try {
        const name = await elm.connect({ acceptAll });
        setDeviceName(name);
        const { protocol } = await elm.init({ protocol: protocolChoice });
        setStats((prev) => ({ ...prev, protocol: parseProtocol(protocol) }));
        setUnsupported([]);
        dataRef.current = EMPTY;
        setData(EMPTY);
        liveRef.current = true;
        setSource("live");
        runPollLoop(elm);
      } catch (err) {
        setError(err.message);
        pushLog({ dir: "sys", t: Date.now(), text: err.message });
        liveRef.current = false;
        await elm.disconnect().catch(() => {});
        elmRef.current = null;
        setSource("mock");
      }
    },
    [protocolChoice, pushLog, runPollLoop],
  );

  const disconnect = useCallback(async () => {
    liveRef.current = false;
    if (elmRef.current) {
      await elmRef.current.disconnect().catch(() => {});
      elmRef.current = null;
    }
    setDeviceName(null);
    setSource("mock");
  }, []);

  // Le os codigos de avaria. So devolve o que o OBD2 normalizado expoe:
  // motor e transmissao. ESP, ABS, airbag e SAM ficam de fora (ver
  // src/lib/dtc.js).
  const readDtcs = useCallback(async () => {
    const elm = elmRef.current;
    if (!elm || !elm.connected) {
      // Sem carro a frente, mostra um exemplo para se poder ver o painel.
      setDtc({
        demo: true,
        mil: true,
        count: 2,
        stored: ["P0171", "P0133"],
        pending: ["P0455"],
        readAt: Date.now(),
      });
      return;
    }
    setDtcBusy(true);
    try {
      const statusRaw = await elm.send("0101", { timeout: 6000 });
      const status = parseMilStatus(toBytes(statusRaw));

      const storedRaw = await elm.send("03", { timeout: 9000 });
      const storedErr = responseError(storedRaw);
      const stored = storedErr ? [] : parseDtcBytes(toBytes(storedRaw), 0x43, status?.count ?? null);

      const pendingRaw = await elm.send("07", { timeout: 9000 });
      const pending = responseError(pendingRaw) ? [] : parseDtcBytes(toBytes(pendingRaw), 0x47);

      setDtc({
        mil: status ? status.mil : null,
        count: status ? status.count : null,
        stored,
        pending,
        note: storedErr === "NODATA" ? "A centralina respondeu NO DATA ao modo 03." : null,
        readAt: Date.now(),
      });
    } catch (err) {
      setDtc({ error: err.message });
    } finally {
      setDtcBusy(false);
    }
  }, []);

  // Apagar os codigos tambem apaga os monitores de prontidao: o carro precisa
  // de rodar uns tantos quilometros antes de voltar a passar na inspeccao.
  const clearDtcs = useCallback(async () => {
    const elm = elmRef.current;
    if (!elm || !elm.connected) return;
    setDtcBusy(true);
    try {
      await elm.send("04", { timeout: 9000 });
      pushLog({ dir: "sys", t: Date.now(), text: "Modo 04 enviado: codigos e prontidao apagados." });
    } catch (err) {
      pushLog({ dir: "sys", t: Date.now(), text: err.message });
    } finally {
      setDtcBusy(false);
    }
    await readDtcs();
  }, [pushLog, readDtcs]);

  // Envia um comando a mao, a partir da consola de diagnostico.
  const sendRaw = useCallback(
    async (cmd) => {
      if (!elmRef.current || !elmRef.current.connected) {
        pushLog({ dir: "sys", t: Date.now(), text: "Sem ligacao." });
        return;
      }
      try {
        await elmRef.current.send(cmd.trim().toUpperCase(), { timeout: 8000 });
      } catch (err) {
        pushLog({ dir: "sys", t: Date.now(), text: err.message });
      }
    },
    [pushLog],
  );

  useEffect(() => () => {
    liveRef.current = false;
    if (elmRef.current) elmRef.current.disconnect().catch(() => {});
  }, []);

  return {
    data,
    source,
    status,
    error,
    deviceName,
    log,
    stats,
    unsupported,
    protocolChoice,
    setProtocolChoice,
    dtc,
    dtcBusy,
    readDtcs,
    clearDtcs,
    connect,
    disconnect,
    sendRaw,
    bluetoothAvailable: bluetoothAvailable(),
  };
}
