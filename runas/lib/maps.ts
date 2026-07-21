import type { ClassName, ElementName, PoleValue } from "./types";

// Pólo define a classe (Irradiador = Guerreiro, Neutro = Sacerdote,
// Absorvedor = Mago; a Tríade do Odin é Híbrido).
export const POLE_CLASS: Record<PoleValue, ClassName> = {
  Irradiador: "Guerreiro",
  Neutro: "Sacerdote",
  Absorvedor: "Mago",
  "Tríade": "Híbrido",
};

export const CLASS_NOTE: Record<ClassName, string> = {
  Guerreiro: "vermelho",
  Sacerdote: "branco",
  Mago: "preto",
  "Híbrido": "cinza",
};

// Cores das velas por elemento (handoff hifi): pontos redondos com
// glow box-shadow 0 0 7px <cor> e flicker.
export const CANDLE: Record<ElementName, string> = {
  Cristalino: "#eef2fa",
  Mineral: "#b0803c",
  Vegetal: "#5fa05c",
  "Eólico": "#e5d76a",
  "Ígneo": "#cf4a33",
  Terreno: "#8b5e34",
  "Aquático": "#4a7fc1",
  Vazio: "#6d5b9e",
  Temporal: "#a7aebd",
};

// Cores das classes (quadrados 8x8px).
export const CLASS_COLOR: Record<ClassName, string> = {
  Guerreiro: "#a85a3c",
  Sacerdote: "#7d9cc4",
  Mago: "#8a76b8",
  "Híbrido": "#c9a86a",
};
