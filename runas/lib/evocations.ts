import type { EvocationType, Formula, Mudra, Rune } from "./types";

// Evocacoes obrigatorias, determinacoes, procedimento e mudras: ficam fieis
// ao manual porque sao para usar.

export const OBRIG: Formula[] = [
  { t: "Ativação do Templo", x: "Supremo Criador do Universo, Sagradas Divindades Nórdicas e Mistérios Nórdicos a mim concedidos, peço pelo poder das Divinas Runas que levantem neste espaço o meu sagrado Templo Nórdico. Assim Seja." },
  { t: "Absorção dos Mistérios", x: "...em nome do meu sagrado Templo Nórdico eu peço que os mistérios aqui firmados e ativados sejam absorvidos pelo meu espírito, e o limpem e energizem, para que eu possa realizar um bom trabalho. Assim seja." },
  { t: "Abertura do Templo", x: "...eu peço que permitam a mim abrir o meu Templo Nórdico para a entrada desta pessoa, e que ao entrar nele ela possa ser beneficiada dos poderes Templários nele presentes. Assim seja." },
];

export const DETERM: Formula[] = [
  { t: "Limpeza do mental", x: "Peço que envolvam esta pessoa e avancem até ao seu mental, purificando-o de toda a negatividade e cordões negativos; que miasmas ou larvas astrais sejam retiradas e encaminhadas ao seu local natural; que as energias divinas se instalem no seu mental, libertando-a dos tormentos, e a energizem para pensar com clareza." },
  { t: "Limpeza dos campos mediúnicos", x: "Peço que envolvam e limpem por completo os campos mediúnicos desta pessoa, curando e encaminhando os espíritos sofredores neles presentes; que as energias divinas a tornem atratora do positivo e repulsora do negativo, e que os seus dons sejam vivificados." },
  { t: "Limpeza de ambientes", x: "Peço que envolvam este ambiente, fechem os portais negativos e cheguem à sua fonte, purificando e anulando as negatividades; que os espíritos sofredores sejam curados e encaminhados, e que as energias divinas se instalem nos quatro cantos, tornando o ambiente repelidor do negativo e atrator do positivo." },
  { t: "Magias negativas", x: "Peço que, havendo magias negativas contra esta pessoa, sejam dissolvidas com todos os seus elementos; que as energias divinas anulem e positivem o negativo nos domínios de onde partiram; que os espíritos sejam esgotados e encaminhados à Luz, e os seres retornem ao seu estado virtuoso." },
  { t: "Consagração de objetos", x: "Peço que limpem totalmente este objeto, até então profano, e instalem nele as suas energias divinas, tornando-o irradiador das suas qualidades e repelidor do contrário; que crie um campo protetor a quem o use e ao ambiente onde estiver." },
];

export const PROC: string[] = [
  "Ativação do Templo.",
  "Invocar a Armadura dos Dragões e colocá-la em si.",
  "Invocar o Cinturão de Megingjard e colocá-lo em si.",
  "Invocar a Espada Mágica de Freyr e pedir que permaneça à sua volta, protegendo.",
  "Invocar a Lança Gungnir e pedir que se instale no seu eixo, protegendo.",
  "Abrir o Templo e pedir que a pessoa entre.",
  "Evocar as Nornas para supervisionar todas as ações, respeitando as Leis Divinas.",
  "Atender a pessoa com os Mistérios Nórdicos necessários.",
];

export const MUDRAS: Mudra[] = [
  { n: "Saudação", p: "Mãos à altura do peito. Palmas para cima saúdam o Alto, a 90 graus saúdam o Meio, para baixo saúdam o Embaixo, girando a direita no sentido horário e a esquerda no anti-horário, respirando fundo em cada." },
  { n: "Básico", p: "Posição de repouso do Templário: mãos à altura do peito, palmas voltadas para cima." },
  { n: "Divindades", p: "Segura a runa na mão esquerda fechada, dá a determinação e puxa a vibração; abre a mão direita para irradiar a energia da divindade." },
  { n: "Armas e Seres", p: "Runa entre as duas mãos, a esquerda por baixo. Dá a determinação, puxa a irradiação com a direita e projeta no centro." },
];

export const EVOCATION_TYPES: EvocationType[] = [
  "Ativar Templo",
  "Absorção",
  "Abrir Templo",
  "Poder Divino específico",
  "Invocar Arma",
  "Sumonar Ser",
];

/** Tipos que precisam de escolher um regente (handoff: só os 3 últimos). */
export const NEEDS_REGENTE: EvocationType[] = [
  "Poder Divino específico",
  "Invocar Arma",
  "Sumonar Ser",
];

const HEAD =
  "Supremo Criador do Universo, Sagradas Divindades Nórdicas e Mistérios Nórdicos a mim concedidos, em nome do meu sagrado Templo Nórdico eu peço que ";

// Um segmento da formula. `fill: true` = destaque (runa, regente, arma/ser).
export interface EvoSegment {
  text: string;
  fill?: boolean;
}

// Constroi a formula preenchida, tal e qual renderEvoc do prototipo.
// Devolve segmentos para o ecra dar destaque aos termos preenchidos.
export function buildEvocation(type: EvocationType, r: Rune): EvoSegment[] {
  const amen: EvoSegment = { text: "Assim seja." };

  if (type === "Ativar Templo") {
    return [{ text: OBRIG[0].x }];
  }
  if (type === "Absorção") {
    return [
      { text: "Supremo Criador do Universo, Sagradas Divindades Nórdicas e Mistérios Nórdicos a mim concedidos, " + OBRIG[1].x.replace(/^\.\.\./, "") },
    ];
  }
  if (type === "Abrir Templo") {
    return [
      { text: "Supremo Criador do Universo, Sagradas Divindades Nórdicas e Mistérios Nórdicos a mim concedidos, " + OBRIG[2].x.replace(/^\.\.\./, "") },
    ];
  }
  if (type === "Poder Divino específico") {
    return [
      { text: HEAD + "através da Sagrada " },
      { text: r.ed, fill: true },
      { text: " o(a) Sagrado(a) " },
      { text: r.deity, fill: true },
      { text: "... (determina a ação) " },
      amen,
    ];
  }
  if (type === "Invocar Arma") {
    const w = r.weapons && r.weapons[0] ? r.weapons[0] : "(esta runa não abre arma)";
    return [
      { text: HEAD + "abram o acesso através da Sagrada " },
      { text: r.ed, fill: true },
      { text: " em nome da Divindade " },
      { text: r.deity, fill: true },
      { text: " e que me enviem a Sagrada " },
      { text: w, fill: true },
      { text: ". " },
      amen,
    ];
  }
  // Sumonar Ser
  const b = r.being ? r.being : "(esta runa não abre ser)";
  return [
    { text: HEAD + "abram o acesso através da Sagrada " },
    { text: r.ed, fill: true },
    { text: " em nome da Divindade " },
    { text: r.deity, fill: true },
    { text: " e que eu possa trabalhar com os(as) Divinos(as) " },
    { text: b, fill: true },
    { text: ". " },
    amen,
  ];
}
