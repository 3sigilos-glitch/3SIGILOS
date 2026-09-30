// ELM327 de mentira: responde como o chip real (eco, prompt ">", atrasos),
// para se poder testar o driver sem o carro nem o adaptador.

const enc = new TextEncoder();

export class FakeCharacteristic {
  constructor(properties) {
    this.properties = properties;
    this.listeners = [];
    this.notifying = false;
  }
  addEventListener(_type, fn) {
    this.listeners.push(fn);
  }
  removeEventListener(_type, fn) {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }
  async startNotifications() {
    this.notifying = true;
    return this;
  }
  async stopNotifications() {
    this.notifying = false;
    return this;
  }
  emit(text) {
    const value = new DataView(enc.encode(text).buffer);
    for (const fn of this.listeners) fn({ target: { value } });
  }
}

/**
 * Liga um par escrita/notificacao a uma centralina simulada.
 * @param {object} opts
 * @param {number} opts.latency atraso da resposta em ms
 * @param {string[]} opts.noData comandos que devem responder "NO DATA"
 * @param {number} opts.chunk tamanho dos pedacos em que parte a resposta
 */
export function makeElmPair({ latency = 5, noData = [], chunk = 8 } = {}) {
  const notifyChar = new FakeCharacteristic({ notify: true });
  const sent = [];
  let rpm = 0x0bb8; // 750 rpm

  const respond = (cmd) => {
    if (noData.includes(cmd)) return "NO DATA\r\r>";
    if (cmd === "ATZ") return "\rELM327 v1.5\r\r>";
    if (cmd === "ATRV") return "13.9V\r\r>";
    if (cmd === "ATDP") return "ISO 9141-2\r\r>";
    if (cmd.startsWith("AT")) return "OK\r\r>";
    if (cmd === "0100") return "41 00 BE 3E B8 11\r\r>";
    if (cmd === "010C") {
      rpm = (rpm + 400) % 0x4000;
      const a = (rpm >> 8) & 0xff;
      const b = rpm & 0xff;
      return `41 0C ${a.toString(16).padStart(2, "0")} ${b.toString(16).padStart(2, "0")}\r\r>`;
    }
    if (cmd === "010D") return "41 0D 3C\r\r>";
    if (cmd === "0105") return "41 05 7B\r\r>";
    if (cmd === "0104") return "41 04 80\r\r>";
    return "?\r\r>";
  };

  const writeChar = new FakeCharacteristic({ writeWithoutResponse: true });
  let inbox = "";
  writeChar.writeValueWithoutResponse = async (bytes) => {
    inbox += new TextDecoder().decode(bytes);
    const idx = inbox.indexOf("\r");
    if (idx === -1) return;
    const cmd = inbox.slice(0, idx).trim().toUpperCase();
    inbox = inbox.slice(idx + 1);
    sent.push(cmd);
    const reply = respond(cmd);
    setTimeout(() => {
      // O BLE entrega em pedacos; o driver tem de os juntar ate ao ">".
      for (let i = 0; i < reply.length; i += chunk) {
        notifyChar.emit(reply.slice(i, i + chunk));
      }
    }, latency);
  };

  return { writeChar, notifyChar, sent };
}
