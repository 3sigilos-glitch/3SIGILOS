// Driver Web Bluetooth para adaptadores ELM327 BLE (Bluetooth Low Energy).
//
// IMPORTANTE: a Web Bluetooth API so fala GATT/BLE. Adaptadores ELM327 de
// "Bluetooth classico" (SPP, os mais baratos de 5 euros) NAO sao vistos pelo
// Chrome, por muito que emparelhem com o telemovel. E preciso um adaptador
// BLE 4.0+ (Vgate iCar Pro BLE, OBDLink CX, Veepeak OBDCheck BLE, etc).

// Perfis de servico usados pelos adaptadores BLE mais comuns.
export const UART_PROFILES = [
  {
    name: "ELM327 BLE (FFE0)",
    service: "0000ffe0-0000-1000-8000-00805f9b34fb",
  },
  {
    name: "Vgate / ZAKVOP (FFF0)",
    service: "0000fff0-0000-1000-8000-00805f9b34fb",
  },
  {
    name: "Nordic UART (OBDLink CX)",
    service: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  },
  {
    name: "OBD BLE (18F0)",
    service: "000018f0-0000-1000-8000-00805f9b34fb",
  },
];

const ALL_SERVICES = UART_PROFILES.map((p) => p.service);

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function bluetoothAvailable() {
  return typeof navigator !== "undefined" && !!navigator.bluetooth;
}

export class Elm327 {
  constructor({ onLog = () => {}, onStatus = () => {}, onDisconnect = () => {} } = {}) {
    this.onLog = onLog;
    this.onStatus = onStatus;
    this.onDisconnect = onDisconnect;

    this.device = null;
    this.server = null;
    this.writeChar = null;
    this.notifyChar = null;
    this.profileName = null;

    this.buffer = "";
    this.pending = null; // { resolve, reject, timer }
    this.queue = Promise.resolve(); // serializa os comandos
    this.connected = false;
    this._onNotify = this._onNotify.bind(this);
    this._onGattDisconnect = this._onGattDisconnect.bind(this);
  }

  log(line, dir = "sys") {
    this.onLog({ dir, text: line, t: Date.now() });
  }

  /**
   * Abre o selector de dispositivos do Chrome e liga-se ao adaptador.
   * @param {boolean} acceptAll - true mostra todos os dispositivos BLE a volta
   *   (util quando o adaptador nao anuncia o servico UART no advertising).
   */
  async connect({ acceptAll = false } = {}) {
    if (!bluetoothAvailable()) {
      throw new Error(
        "Este browser nao tem Web Bluetooth. Usa o Chrome (Android/desktop) numa pagina https.",
      );
    }

    this.onStatus("a-procurar");
    const options = acceptAll
      ? { acceptAllDevices: true, optionalServices: ALL_SERVICES }
      : {
          filters: ALL_SERVICES.map((service) => ({ services: [service] })),
          optionalServices: ALL_SERVICES,
        };

    this.device = await navigator.bluetooth.requestDevice(options);
    this.device.addEventListener("gattserverdisconnected", this._onGattDisconnect);
    this.log(`Dispositivo: ${this.device.name || "(sem nome)"}`);

    this.onStatus("a-ligar");
    this.server = await this.device.gatt.connect();

    // Descobre qual dos perfis conhecidos o adaptador expoe.
    let service = null;
    for (const profile of UART_PROFILES) {
      try {
        service = await this.server.getPrimaryService(profile.service);
        this.profileName = profile.name;
        break;
      } catch {
        /* perfil seguinte */
      }
    }
    if (!service) {
      // Ultimo recurso: percorre tudo o que o adaptador tenha.
      const services = await this.server.getPrimaryServices();
      for (const s of services) {
        const chars = await s.getCharacteristics();
        const hasWrite = chars.some((c) => c.properties.write || c.properties.writeWithoutResponse);
        const hasNotify = chars.some((c) => c.properties.notify || c.properties.indicate);
        if (hasWrite && hasNotify) {
          service = s;
          this.profileName = `Generico (${s.uuid.slice(4, 8)})`;
          break;
        }
      }
    }
    if (!service) {
      await this.disconnect();
      throw new Error("Nao encontrei um servico serie (UART) neste dispositivo.");
    }

    const chars = await service.getCharacteristics();
    this.writeChar =
      chars.find((c) => c.properties.writeWithoutResponse) ||
      chars.find((c) => c.properties.write) ||
      null;
    this.notifyChar = chars.find((c) => c.properties.notify || c.properties.indicate) || null;

    if (!this.writeChar || !this.notifyChar) {
      await this.disconnect();
      throw new Error("O servico encontrado nao tem canais de escrita e de notificacao.");
    }

    await this.notifyChar.startNotifications();
    this.notifyChar.addEventListener("characteristicvaluechanged", this._onNotify);

    this.connected = true;
    this.log(`Ligado via ${this.profileName}`);
    this.onStatus("ligado");
    return this.device.name || "ELM327";
  }

  _onGattDisconnect() {
    this.connected = false;
    this._failPending(new Error("Ligacao Bluetooth perdida."));
    this.log("Ligacao perdida.");
    this.onStatus("desligado");
    this.onDisconnect();
  }

  _failPending(err) {
    if (!this.pending) return;
    clearTimeout(this.pending.timer);
    const { reject } = this.pending;
    this.pending = null;
    reject(err);
  }

  _onNotify(event) {
    const chunk = decoder.decode(event.target.value);
    this.buffer += chunk;
    // O ELM327 termina cada resposta com o prompt ">".
    const idx = this.buffer.indexOf(">");
    if (idx === -1) return;

    const response = this.buffer.slice(0, idx);
    this.buffer = this.buffer.slice(idx + 1);

    if (this.pending) {
      clearTimeout(this.pending.timer);
      const { resolve } = this.pending;
      this.pending = null;
      this.log(response.replace(/\r/g, " ").trim(), "rx");
      resolve(response);
    }
  }

  async _writeRaw(text) {
    const data = encoder.encode(text);
    // O MTU por omissao do BLE deixa 20 bytes de payload por escrita.
    for (let i = 0; i < data.length; i += 20) {
      const slice = data.slice(i, i + 20);
      if (this.writeChar.properties.writeWithoutResponse) {
        await this.writeChar.writeValueWithoutResponse(slice);
      } else {
        await this.writeChar.writeValue(slice);
      }
    }
  }

  /**
   * Envia um comando e espera pela resposta ate ao prompt ">".
   * As chamadas sao serializadas: o ELM327 so aguenta uma pergunta de cada vez.
   */
  send(cmd, { timeout = 3000 } = {}) {
    const run = async () => {
      if (!this.connected) throw new Error("Nao ha ligacao ao adaptador.");
      this.buffer = "";
      this.log(cmd, "tx");
      await this._writeRaw(`${cmd}\r`);

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pending = null;
          reject(new Error(`Sem resposta a "${cmd}" (${timeout} ms).`));
        }, timeout);
        this.pending = { resolve, reject, timer };
      });
    };

    // Encadeia na fila, mas nao deixa um erro partir a cadeia toda.
    const next = this.queue.then(run, run);
    this.queue = next.catch(() => {});
    return next;
  }

  /**
   * Sequencia de arranque do ELM327.
   * @param {string} protocol - digito do protocolo para o ATSP ("0" = automatico).
   */
  async init({ protocol = "0" } = {}) {
    this.onStatus("a-inicializar");

    await this.send("ATZ", { timeout: 6000 }); // reset ao adaptador
    await sleep(600); // o ATZ demora a acordar o chip
    await this.send("ATE0"); // sem eco dos comandos
    await this.send("ATL0"); // sem linefeeds
    await this.send("ATS0"); // sem espacos nas respostas (menos bytes por BLE)
    await this.send("ATH0"); // sem cabecalhos
    await this.send("ATAT2"); // timing adaptativo agressivo: ganha muito em K-line
    await this.send("ATST32"); // timeout por pergunta ~200 ms (0x32 x 4 ms)
    await this.send(`ATSP${protocol}`); // protocolo (0 = deteccao automatica)

    // Primeiro contacto real com a centralina. Num S203 de 2001 (K-line) este
    // passo pode demorar vários segundos enquanto o ELM327 faz o "SEARCHING...".
    this.onStatus("a-ligar-centralina");
    const hello = await this.send("0100", { timeout: 15000 });

    let detected = null;
    try {
      detected = await this.send("ATDP", { timeout: 4000 });
    } catch {
      /* nao e critico */
    }

    this.onStatus("ligado");
    return { hello, protocol: detected };
  }

  async disconnect() {
    this._failPending(new Error("Desligado."));
    try {
      if (this.notifyChar) {
        this.notifyChar.removeEventListener("characteristicvaluechanged", this._onNotify);
        await this.notifyChar.stopNotifications().catch(() => {});
      }
      if (this.device) {
        this.device.removeEventListener("gattserverdisconnected", this._onGattDisconnect);
        if (this.device.gatt.connected) this.device.gatt.disconnect();
      }
    } finally {
      this.connected = false;
      this.writeChar = null;
      this.notifyChar = null;
      this.server = null;
      this.buffer = "";
      this.onStatus("desligado");
    }
  }
}
