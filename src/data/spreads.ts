/* Esquemas de leitura. As tiragens são sempre feitas com o baralho
   físico: a app não baralha nem sorteia, só ajuda a interpretar. */

export interface SpreadPosition {
  name: string;
  about: string;
}

export interface Framing {
  id: string;
  name: string;
  positions: SpreadPosition[];
}

export interface Spread {
  id: string;
  name: string;
  about: string;
  positions?: SpreadPosition[];
  framings?: Framing[];
  yesNo?: boolean;
}

export const SPREADS: Spread[] = [
  {
    id: "uma",
    name: "Uma carta",
    about: "Uma só carta para a resposta ou o tema central da questão.",
    positions: [{ name: "O foco", about: "A resposta ou o tema central da questão." }],
  },
  {
    id: "tres",
    name: "Três cartas",
    about: "Três cartas lidas em sequência, com o enquadramento à escolha.",
    framings: [
      {
        id: "tempo",
        name: "Passado · Presente · Futuro",
        positions: [
          { name: "Passado", about: "O que ficou para trás e ainda pesa na questão." },
          { name: "Presente", about: "A energia que atravessa a situação agora." },
          { name: "Futuro", about: "A tendência para onde as coisas caminham." },
        ],
      },
      {
        id: "accao",
        name: "Situação · Ação · Resultado",
        positions: [
          { name: "Situação", about: "O terreno em que a questão assenta." },
          { name: "Ação", about: "O movimento ou a atitude que o momento pede." },
          { name: "Resultado", about: "O desfecho provável se a ação for tomada." },
        ],
      },
      {
        id: "relacao",
        name: "Tu · O outro · A relação",
        positions: [
          { name: "Tu", about: "A tua posição e o que trazes para a ligação." },
          { name: "O outro", about: "A posição da outra pessoa e o que ela traz." },
          { name: "A relação", about: "A energia do que existe entre os dois." },
        ],
      },
    ],
  },
  {
    id: "simnao",
    name: "Sim ou não",
    about:
      "Uma carta para uma pergunta fechada. A orientação pesa na resposta, e as cartas ambíguas dão um depende.",
    yesNo: true,
    positions: [{ name: "A resposta", about: "A carta que responde à pergunta fechada." }],
  },
  {
    id: "cruz",
    name: "Cruz simples",
    about: "Cinco cartas para ver a situação por dentro e receber conselho.",
    positions: [
      { name: "Situação", about: "O coração do que se passa." },
      { name: "Desafio", about: "O obstáculo ou a tensão a atravessar." },
      { name: "Base", about: "A raiz da questão, o que a sustenta." },
      { name: "Futuro próximo", about: "O que se aproxima nas próximas semanas." },
      { name: "Conselho", about: "A atitude que a leitura recomenda." },
    ],
  },
  {
    id: "celta",
    name: "Cruz Celta",
    about: "A tiragem clássica de dez cartas, para uma leitura profunda.",
    positions: [
      { name: "O coração da questão", about: "A essência do que está em jogo." },
      { name: "O que a cruza", about: "O desafio ou a força que atravessa a questão." },
      { name: "A base", about: "A raiz da situação, o fundamento." },
      { name: "O passado recente", about: "O que acabou de passar e ainda ecoa." },
      { name: "O que se busca", about: "O objectivo consciente, o que se deseja alcançar." },
      { name: "O futuro próximo", about: "O que se aproxima no curto prazo." },
      { name: "A atitude do consulente", about: "Como te colocas perante a questão." },
      { name: "As influências externas", about: "Pessoas e circunstâncias à volta." },
      { name: "Esperanças e receios", about: "O que se deseja e se teme ao mesmo tempo." },
      { name: "O desfecho provável", about: "A síntese, para onde tudo aponta." },
    ],
  },
];

export function spreadById(id: string): Spread | undefined {
  return SPREADS.find((s) => s.id === id);
}

export function positionsFor(spread: Spread, framingId?: string): SpreadPosition[] {
  if (spread.framings) {
    const framing = spread.framings.find((f) => f.id === framingId) ?? spread.framings[0];
    return framing.positions;
  }
  return spread.positions ?? [];
}
