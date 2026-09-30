// Descricao dos PIDs do modo 01 que este painel usa, e o parser das
// respostas hexadecimais da centralina.
//
// Notas para o W203/S203 de 2001: a centralina responde por K-line
// (ISO 9141-2 ou KWP2000) e nao por CAN, o que significa respostas na ordem
// dos 40-120 ms por pergunta. Nao vale a pena pedir os tres PIDs a 200 ms
// cada; o loop de polling pede-os em fila, com a temperatura a entrar so de
// cinco em cinco voltas (ver src/hooks/useTelemetry.js).

export const PIDS = {
  rpm: {
    key: "rpm",
    cmd: "010C",
    mode: 0x41,
    pid: 0x0c,
    bytes: 2,
    // ((A * 256) + B) / 4
    parse: ([a, b]) => ((a * 256) + b) / 4,
    min: 0,
    max: 7000,
    unit: "rpm",
  },
  speed: {
    key: "speed",
    cmd: "010D",
    mode: 0x41,
    pid: 0x0d,
    bytes: 1,
    // A, directamente em km/h
    parse: ([a]) => a,
    min: 0,
    max: 240,
    unit: "km/h",
  },
  coolant: {
    key: "coolant",
    cmd: "0105",
    mode: 0x41,
    pid: 0x05,
    bytes: 1,
    // A - 40, em graus Celsius
    parse: ([a]) => a - 40,
    min: -40,
    max: 130,
    unit: "°C",
  },
  load: {
    key: "load",
    cmd: "0104",
    mode: 0x41,
    pid: 0x04,
    bytes: 1,
    // A * 100 / 255, carga calculada do motor em %
    parse: ([a]) => (a * 100) / 255,
    min: 0,
    max: 100,
    unit: "%",
  },
  intake: {
    key: "intake",
    cmd: "010F",
    mode: 0x41,
    pid: 0x0f,
    bytes: 1,
    parse: ([a]) => a - 40,
    min: -40,
    max: 120,
    unit: "°C",
  },
  throttle: {
    key: "throttle",
    cmd: "0111",
    mode: 0x41,
    pid: 0x11,
    bytes: 1,
    parse: ([a]) => (a * 100) / 255,
    min: 0,
    max: 100,
    unit: "%",
  },
};

// Mensagens de erro que o ELM327 devolve em texto em vez de hexadecimal.
const ERROR_TOKENS = [
  "NODATA",
  "UNABLETOCONNECT",
  "BUSINIT:ERROR",
  "BUSINITERROR",
  "BUSERROR",
  "CANERROR",
  "DATAERROR",
  "BUFFERFULL",
  "FBERROR",
  "LVRESET",
  "STOPPED",
  "ERROR",
  "?",
];

/**
 * Limpa a resposta em bruto do ELM327.
 * Tira o eco do comando, o prompt ">", os "SEARCHING...", os \r e os espacos.
 */
export function cleanResponse(raw) {
  return String(raw)
    .replace(/SEARCHING\.*/gi, "")
    .replace(/[\r\n>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Devolve o token de erro encontrado na resposta, ou null. */
export function responseError(raw) {
  const flat = cleanResponse(raw).toUpperCase().replace(/\s/g, "");
  if (!flat) return "SEM RESPOSTA";
  for (const token of ERROR_TOKENS) {
    if (flat.includes(token)) return token;
  }
  return null;
}

/**
 * Converte a resposta num array de bytes.
 * Aceita cabecalhos CAN ("7E8 03 41 0C 1A F8"), respostas sem cabecalho
 * ("41 0C 1A F8") e respostas coladas sem espacos ("410C1AF8").
 */
export function toBytes(raw) {
  const tokens = cleanResponse(raw)
    .split(" ")
    .filter((t) => /^[0-9A-Fa-f]+$/.test(t));

  // Um token de tres digitos e o cabecalho CAN de 11 bits (ex: "7E8"): fora.
  let flat = tokens.filter((t) => t.length !== 3).join("");

  // Resposta colada e de comprimento impar: quase sempre e um cabecalho de
  // tres digitos agarrado ao resto. Tira-o e tenta outra vez.
  if (flat.length % 2 === 1) flat = flat.slice(3);
  if (flat.length < 2) return [];

  const out = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    out.push(parseInt(flat.slice(i, i + 2), 16));
  }
  return out;
}

/**
 * Extrai os bytes de dados de uma resposta ao modo 01.
 * Procura o par [0x41, pid] e devolve os n bytes seguintes.
 * Devolve null se a resposta nao servir (erro, curta, ou PID trocado).
 */
export function parsePid(raw, def) {
  if (responseError(raw)) return null;
  const bytes = toBytes(raw);
  for (let i = 0; i + 1 < bytes.length; i += 1) {
    if (bytes[i] === def.mode && bytes[i + 1] === def.pid) {
      const data = bytes.slice(i + 2, i + 2 + def.bytes);
      if (data.length < def.bytes) return null;
      if (data.some((b) => Number.isNaN(b))) return null;
      return def.parse(data);
    }
  }
  return null;
}

/** Le a tensao da bateria devolvida por ATRV (ex: "13.8V"). */
export function parseVoltage(raw) {
  const m = cleanResponse(raw).match(/(\d{1,2}(?:\.\d+)?)\s*V/i);
  return m ? Number(m[1]) : null;
}

/** Nome legivel do protocolo devolvido por ATDP. */
export function parseProtocol(raw) {
  const text = cleanResponse(raw).replace(/^AUTO,?\s*/i, "");
  return text || null;
}
