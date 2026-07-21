import type { ClassName, ElementName, PoleValue } from "./types";

export type Env = "claro" | "escuro";

// Polo define a classe (Irradiador = Guerreiro, Neutro = Sacerdote,
// Absorvedor = Mago; a Triade do Odin e Hibrido).
export const POLE_CLASS: Record<PoleValue, ClassName> = {
  Irradiador: "Guerreiro",
  Neutro: "Sacerdote",
  Absorvedor: "Mago",
  "Tríade": "Híbrido",
};

// Classe pela cor.
export const CLASS_NOTE: Record<ClassName, string> = {
  Guerreiro: "vermelho",
  Sacerdote: "branco",
  Mago: "preto",
  "Híbrido": "cinza",
};

// Cor da classe, em duas versoes para assentar em cada ambiente.
export const CLASS_COLOR: Record<ClassName, Record<Env, string>> = {
  Guerreiro: { claro: "#A5342A", escuro: "#C0392B" },
  Sacerdote: { claro: "#B8AE95", escuro: "#D9CFB8" },
  Mago: { claro: "#3B3A47", escuro: "#6C6A82" },
  "Híbrido": { claro: "#6B6577", escuro: "#8A8296" },
};

// Cor do elemento = cor da vela. Versao terrosa no papel (claro),
// versao viva para brilhar no escuro (Altar).
export const ELEMENT_ACCENT: Record<ElementName, Record<Env, string>> = {
  Cristalino: { claro: "#C9C4B4", escuro: "#F1ECE0" },
  Mineral: { claro: "#C79A12", escuro: "#EBCF1E" },
  Vegetal: { claro: "#2F7D3A", escuro: "#3EA23F" },
  "Eólico": { claro: "#C4701A", escuro: "#E2891C" },
  "Ígneo": { claro: "#AE3A2B", escuro: "#C23A2C" },
  Terreno: { claro: "#7A4A2C", escuro: "#8A4A2C" },
  "Aquático": { claro: "#2E7FA8", escuro: "#3E9BD1" },
  Vazio: { claro: "#201E1A", escuro: "#0C0C11" },
  Temporal: { claro: "#6B389B", escuro: "#7D3CAE" },
};

// Elementos que se confundem com o fundo e precisam sempre de anel/contorno
// (Cristalino quase branco; Vazio quase preto).
export const ELEMENT_NEEDS_RING: Record<ElementName, boolean> = {
  Cristalino: true,
  Mineral: false,
  Vegetal: false,
  "Eólico": false,
  "Ígneo": false,
  Terreno: false,
  "Aquático": false,
  Vazio: true,
  Temporal: false,
};

export function accentOf(elem: ElementName, env: Env): string {
  return ELEMENT_ACCENT[elem][env];
}

export function classColorOf(cls: ClassName, env: Env): string {
  return CLASS_COLOR[cls][env];
}
