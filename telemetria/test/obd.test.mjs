import test from "node:test";
import assert from "node:assert/strict";
import { PIDS, parsePid, parseVoltage, parseProtocol, responseError } from "../src/lib/obd.js";

test("formulas OBD2 standard", () => {
  // RPM = ((A * 256) + B) / 4
  assert.equal(parsePid("41 0C 1A F8", PIDS.rpm), 1726);
  assert.equal(parsePid("41 0C 0B B8", PIDS.rpm), 750);
  assert.equal(parsePid("41 0C 00 00", PIDS.rpm), 0);
  // Velocidade = A
  assert.equal(parsePid("41 0D 50", PIDS.speed), 80);
  // Temperatura = A - 40
  assert.equal(parsePid("41 05 7B", PIDS.coolant), 83);
  assert.equal(parsePid("41 05 28", PIDS.coolant), 0);
});

test("aguenta os varios formatos de resposta", () => {
  assert.equal(parsePid("41 0C 1A F8\r\r>", PIDS.rpm), 1726, "com prompt e CR");
  assert.equal(parsePid("410C1AF8", PIDS.rpm), 1726, "sem espacos (ATS0)");
  assert.equal(parsePid("7E8 03 41 0C 1A F8", PIDS.rpm), 1726, "com cabecalho CAN");
  assert.equal(parsePid("7E803410C1AF8", PIDS.rpm), 1726, "cabecalho CAN colado");
  assert.equal(parsePid("SEARCHING...\r41 0D 50", PIDS.speed), 80, "com SEARCHING");
  assert.equal(parsePid("010C\r41 0C 0B B8", PIDS.rpm), 750, "com eco do comando");
});

test("rejeita respostas invalidas em vez de inventar valores", () => {
  assert.equal(parsePid("NO DATA", PIDS.rpm), null);
  assert.equal(parsePid("UNABLE TO CONNECT", PIDS.rpm), null);
  assert.equal(parsePid("BUS INIT: ERROR", PIDS.rpm), null);
  assert.equal(parsePid("?", PIDS.rpm), null);
  assert.equal(parsePid("", PIDS.rpm), null);
  assert.equal(parsePid("41 0C 1A", PIDS.rpm), null, "resposta truncada");
  assert.equal(parsePid("41 0D 50", PIDS.rpm), null, "PID diferente do pedido");
});

test("comandos do proprio adaptador", () => {
  assert.equal(parseVoltage("13.8V\r\r>"), 13.8);
  assert.equal(parseVoltage("ATRV\r12V"), 12);
  assert.equal(parseVoltage("OK"), null);
  assert.equal(parseProtocol("AUTO, ISO 9141-2\r>"), "ISO 9141-2");
  assert.equal(responseError("NO DATA"), "NODATA");
  assert.equal(responseError("41 0C 1A F8"), null);
});
