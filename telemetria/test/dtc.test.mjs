import test from "node:test";
import assert from "node:assert/strict";
import { decodeDtc, parseDtcBytes, parseMilStatus, describeDtc } from "../src/lib/dtc.js";
import { toBytes } from "../src/lib/obd.js";

test("descodifica os dois bytes no codigo", () => {
  assert.equal(decodeDtc(0x01, 0x33), "P0133");
  assert.equal(decodeDtc(0x01, 0x71), "P0171");
  assert.equal(decodeDtc(0x42, 0x30), "C0230");
  assert.equal(decodeDtc(0x81, 0x65), "B0165");
  assert.equal(decodeDtc(0xc1, 0x00), "U0100");
  assert.equal(decodeDtc(0x11, 0x28), "P1128");
});

test("modo 03 em K-line, sem byte de contagem", () => {
  const bytes = toBytes("43 01 33 01 71 00 00");
  assert.deepEqual(parseDtcBytes(bytes, 0x43, 2), ["P0133", "P0171"]);
});

test("modo 03 em CAN, com byte de contagem", () => {
  const bytes = toBytes("43 02 01 33 01 71");
  assert.deepEqual(parseDtcBytes(bytes, 0x43, 2), ["P0133", "P0171"]);
});

test("desempata pela contagem quando nao ha numero esperado", () => {
  // "43 02 0133 0171": o 02 e a contagem e bate certo com dois codigos.
  assert.deepEqual(parseDtcBytes(toBytes("43 02 01 33 01 71"), 0x43), ["P0133", "P0171"]);
});

test("sem codigos guardados", () => {
  assert.deepEqual(parseDtcBytes(toBytes("43 00 00 00"), 0x43, 0), []);
  assert.deepEqual(parseDtcBytes(toBytes("47 00 00 00"), 0x47, 0), []);
});

test("estado da luz do motor e contagem", () => {
  // 0x81 = luz acesa (bit 7) + 1 codigo
  assert.deepEqual(parseMilStatus(toBytes("41 01 81 07 65 04")), { mil: true, count: 1 });
  assert.deepEqual(parseMilStatus(toBytes("41 01 00 07 E5 00")), { mil: false, count: 0 });
  assert.equal(parseMilStatus(toBytes("NO DATA")), null);
});

test("descricoes: tabela e familia", () => {
  assert.match(describeDtc("P0171"), /pobre/i);
  assert.match(describeDtc("P0344"), /Ignicao|combustao/i);
  assert.match(describeDtc("C1234"), /Chassis/i);
});
