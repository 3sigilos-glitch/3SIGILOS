// Leitura de codigos de avaria (DTC) pelos modos 03 (guardados), 07
// (pendentes) e 0A (permanentes), e do PID 0101 (estado da luz do motor).
//
// LIMITE IMPORTANTE: o OBD2 normalizado so obriga a expor o que diz respeito
// a emissoes, ou seja motor e transmissao (codigos P). Os codigos do ESP,
// ABS, BAS, airbag e SAM vivem em modulos proprios da Mercedes, no barramento
// CAN interno, e leem-se com diagnostico proprietario (XENTRY/DAS, iCarsoft
// MB II, Autel). Um ELM327 generico nao os alcanca.

/** Converte dois bytes no codigo legivel, ex: 0x01 0x33 -> "P0133". */
export function decodeDtc(hi, lo) {
  const letter = ["P", "C", "B", "U"][(hi >> 6) & 0x03];
  const first = (hi >> 4) & 0x03;
  const rest = ((hi & 0x0f) << 8) | lo;
  return `${letter}${first}${rest.toString(16).toUpperCase().padStart(3, "0")}`;
}

const pairsFrom = (bytes, start) => {
  const out = [];
  for (let i = start; i + 1 < bytes.length; i += 2) {
    const hi = bytes[i];
    const lo = bytes[i + 1];
    if (hi === 0 && lo === 0) continue; // preenchimento
    out.push(decodeDtc(hi, lo));
  }
  return out;
};

/**
 * Le a resposta a um modo 03/07/0A.
 *
 * O formato difere conforme o barramento: em CAN vem um byte com o numero de
 * codigos logo a seguir ao byte de modo, em K-line (ISO 9141 / KWP, que e o
 * caso do S203 de 2001) nao vem. Testamos as duas leituras e ficamos com a
 * que bate certo com o numero de codigos que a centralina ja anunciou no
 * PID 0101.
 *
 * @param {number[]} bytes resposta ja convertida em bytes
 * @param {number} mode 0x43, 0x47 ou 0x4A (resposta a 03, 07, 0A)
 * @param {number|null} expected numero de codigos esperado, se conhecido
 */
export function parseDtcBytes(bytes, mode, expected = null) {
  const at = bytes.indexOf(mode);
  if (at === -1) return [];

  const semContagem = pairsFrom(bytes, at + 1);
  const comContagem = pairsFrom(bytes, at + 2);

  // Os codigos ocupam sempre dois bytes, por isso um numero impar de bytes
  // depois do byte de modo so pode significar que ha um byte de contagem
  // pelo meio. E o sinal mais fiavel para distinguir os dois formatos.
  const impar = (bytes.length - (at + 1)) % 2 === 1;
  const principal = impar ? comContagem : semContagem;
  const alternativa = impar ? semContagem : comContagem;

  // Rede de seguranca: se a centralina ja tinha anunciado quantos codigos
  // tem (PID 0101) e a leitura principal nao bate certo, fica a outra.
  if (expected !== null && principal.length !== expected && alternativa.length === expected) {
    return alternativa;
  }
  return principal;
}

/** Estado da luz do motor e numero de codigos guardados (PID 0101). */
export function parseMilStatus(bytes) {
  const at = bytes.findIndex((b, i) => b === 0x41 && bytes[i + 1] === 0x01);
  if (at === -1 || at + 2 >= bytes.length) return null;
  const a = bytes[at + 2];
  return { mil: (a & 0x80) !== 0, count: a & 0x7f };
}

// Descricoes dos codigos que aparecem com mais frequencia nestes motores.
const KNOWN = {
  P0100: "Caudalimetro (MAF): circuito",
  P0101: "Caudalimetro (MAF): fora de gama",
  P0102: "Caudalimetro (MAF): sinal baixo",
  P0103: "Caudalimetro (MAF): sinal alto",
  P0105: "Sensor de pressao do colector (MAP)",
  P0110: "Sensor de temperatura do ar admitido",
  P0115: "Sensor de temperatura do liquido",
  P0116: "Sensor de temperatura do liquido: fora de gama",
  P0120: "Sensor de posicao da borboleta",
  P0125: "Temperatura insuficiente para gerir a mistura",
  P0130: "Sonda lambda 1 (antes do catalisador)",
  P0133: "Sonda lambda 1: resposta lenta",
  P0135: "Sonda lambda 1: aquecimento",
  P0136: "Sonda lambda 2 (depois do catalisador)",
  P0141: "Sonda lambda 2: aquecimento",
  P0170: "Mistura fora de gama (banco 1)",
  P0171: "Mistura demasiado pobre (banco 1)",
  P0172: "Mistura demasiado rica (banco 1)",
  P0173: "Mistura fora de gama (banco 2)",
  P0174: "Mistura demasiado pobre (banco 2)",
  P0175: "Mistura demasiado rica (banco 2)",
  P0200: "Circuito dos injectores",
  P0300: "Falhas de combustao em varios cilindros",
  P0301: "Falha de combustao: cilindro 1",
  P0302: "Falha de combustao: cilindro 2",
  P0303: "Falha de combustao: cilindro 3",
  P0304: "Falha de combustao: cilindro 4",
  P0305: "Falha de combustao: cilindro 5",
  P0306: "Falha de combustao: cilindro 6",
  P0325: "Sensor de detonacao",
  P0335: "Sensor de rotacao da cambota",
  P0340: "Sensor de posicao da arvore de cames",
  P0400: "Recirculacao de gases (EGR): caudal",
  P0410: "Injeccao de ar secundario",
  P0420: "Rendimento do catalisador abaixo do limite",
  P0440: "Sistema de vapores de combustivel (EVAP)",
  P0442: "EVAP: fuga pequena",
  P0455: "EVAP: fuga grande",
  P0500: "Sensor de velocidade do veiculo",
  P0505: "Comando do ralenti",
  P0560: "Tensao do sistema",
  P0600: "Comunicacao entre modulos",
  P0700: "Comando da caixa automatica",
  P0715: "Sensor de rotacao da turbina",
  P0720: "Sensor de rotacao de saida da caixa",
};

// Quando o codigo nao esta na tabela, a familia ja diz muito.
const FAMILIES = [
  [/^P00/, "Medicao de ar e combustivel"],
  [/^P01/, "Medicao de ar e combustivel"],
  [/^P02/, "Injectores e medicao de combustivel"],
  [/^P03/, "Ignicao e falhas de combustao"],
  [/^P04/, "Controlo auxiliar de emissoes (EGR, EVAP, catalisador)"],
  [/^P05/, "Velocidade, ralenti e entradas auxiliares"],
  [/^P06/, "Unidade de comando e saidas"],
  [/^P07/, "Caixa de velocidades"],
  [/^P08/, "Caixa de velocidades"],
  [/^P1/, "Codigo especifico do fabricante (motor)"],
  [/^C/, "Chassis (ESP, ABS, travoes, suspensao)"],
  [/^B/, "Carrocaria (SAM, airbag, conforto)"],
  [/^U/, "Rede de comunicacao entre modulos"],
];

/** Descricao legivel de um codigo, ou a familia a que pertence. */
export function describeDtc(code) {
  if (KNOWN[code]) return KNOWN[code];
  for (const [re, text] of FAMILIES) {
    if (re.test(code)) return text;
  }
  return "Codigo nao catalogado";
}

/**
 * Um codigo que nao seja P (ou U) nao chega aqui por OBD2 generico; se
 * aparecer, e util dizer que a leitura completa exige diagnostico Mercedes.
 */
export function needsDealerTool(code) {
  return code.startsWith("C") || code.startsWith("B");
}
