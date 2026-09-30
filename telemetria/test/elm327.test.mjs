import test from "node:test";
import assert from "node:assert/strict";
import { Elm327 } from "../src/lib/elm327.js";
import { PIDS, parsePid } from "../src/lib/obd.js";
import { makeElmPair } from "./fake-elm.mjs";

/** Monta um driver ja "ligado" ao ELM327 de mentira. */
function wire(opts) {
  const { writeChar, notifyChar, sent } = makeElmPair(opts);
  const elm = new Elm327();
  elm.writeChar = writeChar;
  elm.notifyChar = notifyChar;
  elm.connected = true;
  notifyChar.addEventListener("characteristicvaluechanged", elm._onNotify);
  return { elm, sent };
}

test("junta os pedacos BLE ate ao prompt e devolve a resposta inteira", async () => {
  const { elm } = wire({ chunk: 3 });
  const raw = await elm.send("010D");
  assert.equal(parsePid(raw, PIDS.speed), 60);
});

test("a sequencia de arranque envia os comandos pedidos, pela ordem certa", async () => {
  const { elm, sent } = wire();
  await elm.init({ protocol: "0" });
  for (const cmd of ["ATZ", "ATE0", "ATL0", "ATSP0", "0100"]) {
    assert.ok(sent.includes(cmd), `faltou o comando ${cmd}`);
  }
  assert.ok(sent.indexOf("ATZ") < sent.indexOf("ATE0"));
  assert.ok(sent.indexOf("ATE0") < sent.indexOf("ATSP0"));
  assert.ok(sent.indexOf("ATSP0") < sent.indexOf("0100"));
});

test("o protocolo escolhido chega ao ATSP", async () => {
  const { elm, sent } = wire();
  await elm.init({ protocol: "5" });
  assert.ok(sent.includes("ATSP5"));
});

test("os comandos sao serializados: um de cada vez", async () => {
  const { elm, sent } = wire({ latency: 12 });
  const [a, b, c] = await Promise.all([elm.send("010C"), elm.send("010D"), elm.send("0105")]);
  assert.equal(sent.join(","), "010C,010D,0105");
  assert.equal(typeof parsePid(a, PIDS.rpm), "number");
  assert.equal(parsePid(b, PIDS.speed), 60);
  assert.equal(parsePid(c, PIDS.coolant), 83);
});

test("um timeout nao parte a fila: o comando seguinte ainda responde", async () => {
  const { elm } = wire({ latency: 400 });
  await assert.rejects(() => elm.send("010C", { timeout: 40 }), /Sem resposta/);
  await new Promise((r) => setTimeout(r, 450)); // deixa cair a resposta atrasada
  const raw = await elm.send("010D", { timeout: 1000 });
  assert.equal(parsePid(raw, PIDS.speed), 60);
});

test("NO DATA e tratado como PID sem suporte, nao como valor", async () => {
  const { elm } = wire({ noData: ["0105"] });
  const raw = await elm.send("0105");
  assert.equal(parsePid(raw, PIDS.coolant), null);
});

test("um comando longo e partido em escritas de 20 bytes", async () => {
  const { writeChar, notifyChar } = makeElmPair();
  const elm = new Elm327();
  elm.writeChar = writeChar;
  elm.notifyChar = notifyChar;
  elm.connected = true;
  notifyChar.addEventListener("characteristicvaluechanged", elm._onNotify);

  const sizes = [];
  const original = writeChar.writeValueWithoutResponse;
  writeChar.writeValueWithoutResponse = async (bytes) => {
    sizes.push(bytes.length);
    return original(bytes);
  };
  await elm.send("ATSH" + "0".repeat(40));
  assert.ok(Math.max(...sizes) <= 20, `escrita de ${Math.max(...sizes)} bytes`);
});
