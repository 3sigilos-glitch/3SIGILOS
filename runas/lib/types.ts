// Tipos do sistema. Preparado para os Modulos Vermelho e Preto:
// basta acrescentar runas/regentes/armas/seres com outro `module`,
// sem reescrever nada (ver seccao 9 do documento).

export type ModuleId = "branco" | "vermelho" | "preto";

// Os nove elementos. O "Triade" nao e um elemento: e o caso do Odin/Wyrd,
// que ocupa Cristalino, Vazio e Temporal ao mesmo tempo.
export type ElementName =
  | "Cristalino"
  | "Mineral"
  | "Vegetal"
  | "Eólico"
  | "Ígneo"
  | "Terreno"
  | "Aquático"
  | "Vazio"
  | "Temporal";

export type Pole = "Irradiador" | "Neutro" | "Absorvedor";
// Pole efetivo de uma runa, incluindo a excecao da Triade (Odin).
export type PoleValue = Pole | "Tríade";
export type ElementValue = ElementName | "Tríade";

export type ClassName = "Guerreiro" | "Sacerdote" | "Mago" | "Híbrido";

export interface Rune {
  id: number;
  /** Nome do Eduardo (anglo-saxonico, o mais antigo). Vai em destaque. */
  ed: string;
  /** Nome moderno (Elder Futhark). Vai por baixo. */
  mod: string;
  letter: string;
  deity: string;
  epi: string;
  type: string;
  elem: ElementValue;
  pole: PoleValue;
  weapons: string[];
  being: string | null;
  kw: string[];
  intent: string[];
  essence: string;
  /** Texto aprofundado, quando existe (Freyr e Thorn, como exemplo). */
  deep?: string;
  module: ModuleId;
}

export interface Weapon {
  n: string;
  epi: string;
  deity: string;
  /** id da runa que abre esta arma. */
  rune: number;
  d: string;
  module: ModuleId;
}

export interface Being {
  n: string;
  epi: string;
  deity: string;
  /** id da runa que sumona este ser. */
  rune: number;
  d: string;
  module: ModuleId;
}

export interface Element {
  n: ElementName;
  cor: string;
  rep: string;
}

export interface Formula {
  t: string;
  x: string;
}

export interface Mudra {
  n: string;
  p: string;
}

export type EvocationType =
  | "Ativar Templo"
  | "Absorção"
  | "Abrir Templo"
  | "Poder Divino específico"
  | "Invocar Arma"
  | "Sumonar Ser"
  | "Consagrar Objeto ou Amuleto";
