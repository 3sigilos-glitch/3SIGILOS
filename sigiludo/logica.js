// Lógica do SIGILUDO, partilhada pelo servidor (api/jogo.js) e pelo modo
// local do browser (app.js). Só funções puras: recebem o estado, devolvem
// estado novo. Nada de rede, nada de DOM, nada de armazenamento.

export const PONTOS_NORMAL = 1;
export const PONTOS_DIFICIL = 2;

export const LIMITES = {
  jogadores: 24,
  espacos: 120,
  objetos: 200,
  ativasPorJogador: 40,
  missoesTotais: 4000,
  nome: 44,
};

export class ErroJogo extends Error {
  constructor(mensagem, codigo = 400) {
    super(mensagem);
    this.nome = "ErroJogo";
    this.codigo = codigo;
  }
}

const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function codigoNovo(tamanho = 4) {
  let saida = "";
  for (let i = 0; i < tamanho; i++) {
    saida += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return saida;
}

function novoId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
}

function limpaNome(valor, oQue = "nome") {
  const texto = String(valor == null ? "" : valor).replace(/\s+/g, " ").trim();
  if (!texto) throw new ErroJogo("Falta escrever o " + oQue + ".");
  return texto.slice(0, LIMITES.nome);
}

function iguais(a, b) {
  return String(a).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() ===
    String(b).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function clone(valor) {
  return JSON.parse(JSON.stringify(valor));
}

// Casa de exemplo, para o jogo arrancar em dois minutos. O administrador
// muda tudo depois, a qualquer momento.
export const CASA_EXEMPLO = {
  espacos: [
    { nome: "Cozinha" },
    { nome: "Sala" },
    { nome: "Corredor" },
    { nome: "Casa de banho" },
    { nome: "Quarto grande" },
    { nome: "Mesa de jantar" },
    { nome: "Escadas" },
    { nome: "Varanda", dificil: true },
    { nome: "Despensa", dificil: true },
    { nome: "Jardim", dificil: true },
  ],
  objetos: [
    { nome: "comando da televisão" },
    { nome: "saca-rolhas" },
    { nome: "vassoura" },
    { nome: "almofada" },
    { nome: "chávena" },
    { nome: "vela" },
    { nome: "chinelo" },
    { nome: "carregador de telefone" },
    { nome: "panela" },
    { nome: "livro" },
    { nome: "garrafa de água" },
    { nome: "pano da loiça" },
    { nome: "tesoura", dificil: true },
    { nome: "guarda-chuva", dificil: true },
    { nome: "fita-cola", dificil: true },
    { nome: "cabeça de alho", dificil: true },
    { nome: "pinça", dificil: true },
    { nome: "abre-latas", dificil: true },
  ],
};

function novoItem(entrada) {
  const bruto = typeof entrada === "string" ? { nome: entrada } : entrada || {};
  return { id: novoId(), nome: limpaNome(bruto.nome), dificil: Boolean(bruto.dificil) };
}

export function jogoNovo(opcoes = {}) {
  const pin = String(opcoes.pin == null ? "" : opcoes.pin).trim();
  if (!/^\d{4,8}$/.test(pin)) {
    throw new ErroJogo("O PIN do administrador tem de ser um número de 4 a 8 dígitos.");
  }
  const agora = Date.now();
  const jogo = {
    id: opcoes.id || codigoNovo(),
    nome: opcoes.nome ? limpaNome(opcoes.nome) : "Fim de semana",
    pin,
    criadoEm: agora,
    versao: 1,
    jogadores: [],
    espacos: [],
    objetos: [],
    missoes: [],
  };
  const nomes = Array.isArray(opcoes.jogadores) ? opcoes.jogadores : [];
  for (const nome of nomes) {
    const limpo = String(nome || "").trim();
    if (!limpo) continue;
    if (jogo.jogadores.some((j) => iguais(j.nome, limpo))) continue;
    if (jogo.jogadores.length >= LIMITES.jogadores) break;
    jogo.jogadores.push({ id: novoId(), nome: limpaNome(limpo), entrouEm: agora });
  }
  const casa = opcoes.exemplo === false ? { espacos: [], objetos: [] } : CASA_EXEMPLO;
  jogo.espacos = casa.espacos.map(novoItem);
  jogo.objetos = casa.objetos.map(novoItem);
  return jogo;
}

function exigeAdmin(estado, acao) {
  const dado = String(acao && acao.pin != null ? acao.pin : "").trim();
  if (!dado || dado !== String(estado.pin)) {
    throw new ErroJogo("PIN de administrador errado.", 403);
  }
}

function jogadorDe(estado, id) {
  const jogador = estado.jogadores.find((j) => j.id === id);
  if (!jogador) throw new ErroJogo("Esse jogador já não está no jogo. Escolhe outra vez quem és.", 404);
  return jogador;
}

function listaDe(estado, tipo) {
  return tipo === "espaco" ? estado.espacos : estado.objetos;
}

function limiteDe(tipo) {
  return tipo === "espaco" ? LIMITES.espacos : LIMITES.objetos;
}

// Piscinas de sorteio. Difícil usa o que o administrador marcou como
// difícil; se não houver espaços difíceis marcados, vale qualquer espaço
// (o objeto difícil já basta para a missão ser difícil).
function piscinas(estado, dificil) {
  const escolhe = (itens, exigir) => {
    const marcados = itens.filter((i) => i.dificil);
    const normais = itens.filter((i) => !i.dificil);
    if (dificil) {
      if (marcados.length) return marcados;
      return exigir ? [] : itens.slice();
    }
    return normais.length ? normais : itens.slice();
  };
  return {
    espacos: escolhe(estado.espacos, false),
    objetos: escolhe(estado.objetos, true),
  };
}

function chaveCombinacao(alvo, espaco, objeto) {
  return alvo + "|" + espaco + "|" + objeto;
}

function sorteiaMissao(estado, euId, dificil) {
  const alvos = estado.jogadores.filter((j) => j.id !== euId);
  if (!alvos.length) {
    throw new ErroJogo("Ainda não há mais ninguém no jogo. Pede ao administrador para acrescentar os outros jogadores.");
  }
  const { espacos, objetos } = piscinas(estado, dificil);
  if (!espacos.length) {
    throw new ErroJogo("O administrador ainda não acrescentou espaços da casa.");
  }
  if (!objetos.length) {
    throw new ErroJogo(
      dificil
        ? "Ainda não há objetos marcados como difíceis. Pede ao administrador para marcar alguns."
        : "O administrador ainda não acrescentou objetos."
    );
  }
  const ocupadas = new Set(
    estado.missoes
      .filter((m) => m.dono === euId && m.estado === "ativa")
      .map((m) => chaveCombinacao(m.alvo, m.espacoId, m.objetoId))
  );
  const livres = [];
  for (const alvo of alvos) {
    for (const espaco of espacos) {
      for (const objeto of objetos) {
        if (!ocupadas.has(chaveCombinacao(alvo.id, espaco.id, objeto.id))) {
          livres.push({ alvo, espaco, objeto });
        }
      }
    }
  }
  if (!livres.length) {
    throw new ErroJogo("Já tens em mão todas as combinações possíveis. Cumpre ou desiste de alguma primeiro.");
  }
  const escolha = livres[Math.floor(Math.random() * livres.length)];
  return {
    id: novoId(),
    dono: euId,
    alvo: escolha.alvo.id,
    alvoNome: escolha.alvo.nome,
    espacoId: escolha.espaco.id,
    espacoNome: escolha.espaco.nome,
    objetoId: escolha.objeto.id,
    objetoNome: escolha.objeto.nome,
    dificil: Boolean(dificil),
    pontos: dificil ? PONTOS_DIFICIL : PONTOS_NORMAL,
    estado: "ativa",
    criadaEm: Date.now(),
    cumpridaEm: null,
  };
}

function minhaMissao(estado, euId, missaoId) {
  const missao = estado.missoes.find((m) => m.id === missaoId && m.dono === euId);
  if (!missao) throw new ErroJogo("Essa missão não é tua ou já não existe.", 404);
  return missao;
}

/**
 * Aplica uma ação ao estado e devolve { estado, resultado }.
 * Nunca altera o estado recebido.
 */
export function aplicar(estadoOriginal, acao) {
  if (!acao || !acao.tipo) throw new ErroJogo("Ação sem tipo.");
  const estado = clone(estadoOriginal);
  let resultado = null;

  switch (acao.tipo) {
    case "jogador.add": {
      // Sem PIN: qualquer pessoa se pode apresentar ao entrar no jogo.
      // Com PIN: é o administrador a acrescentar gente.
      const nome = limpaNome(acao.nome);
      const existente = estado.jogadores.find((j) => iguais(j.nome, nome));
      if (existente) {
        resultado = { jogadorId: existente.id, jaExistia: true };
        return { estado: estadoOriginal, resultado };
      }
      if (estado.jogadores.length >= LIMITES.jogadores) {
        throw new ErroJogo("O jogo já tem o máximo de " + LIMITES.jogadores + " jogadores.");
      }
      const jogador = { id: novoId(), nome, entrouEm: Date.now() };
      estado.jogadores.push(jogador);
      resultado = { jogadorId: jogador.id };
      break;
    }

    case "jogador.remove": {
      exigeAdmin(estado, acao);
      const jogador = jogadorDe(estado, acao.jogadorId);
      estado.jogadores = estado.jogadores.filter((j) => j.id !== jogador.id);
      // Missões cumpridas ficam no histórico (contam para o placar de quem
      // as cumpriu). As que estavam activas dele, ou contra ele, saem.
      estado.missoes = estado.missoes.filter(
        (m) => m.estado !== "ativa" || (m.dono !== jogador.id && m.alvo !== jogador.id)
      );
      break;
    }

    case "espaco.add":
    case "objeto.add": {
      exigeAdmin(estado, acao);
      const tipo = acao.tipo.startsWith("espaco") ? "espaco" : "objeto";
      const lista = listaDe(estado, tipo);
      const nome = limpaNome(acao.nome);
      if (lista.some((i) => iguais(i.nome, nome))) {
        throw new ErroJogo("Já existe na lista: " + nome + ".");
      }
      if (lista.length >= limiteDe(tipo)) {
        throw new ErroJogo("Lista cheia (máximo " + limiteDe(tipo) + ").");
      }
      lista.push(novoItem({ nome, dificil: acao.dificil }));
      break;
    }

    case "espaco.remove":
    case "objeto.remove": {
      exigeAdmin(estado, acao);
      const tipo = acao.tipo.startsWith("espaco") ? "espaco" : "objeto";
      const lista = listaDe(estado, tipo);
      const indice = lista.findIndex((i) => i.id === acao.itemId);
      if (indice < 0) throw new ErroJogo("Não encontrei esse item.", 404);
      lista.splice(indice, 1);
      // Missões activas que usavam o item deixam de fazer sentido.
      estado.missoes = estado.missoes.filter((m) => {
        if (m.estado !== "ativa") return true;
        return tipo === "espaco" ? m.espacoId !== acao.itemId : m.objetoId !== acao.itemId;
      });
      break;
    }

    case "espaco.dificil":
    case "objeto.dificil": {
      exigeAdmin(estado, acao);
      const tipo = acao.tipo.startsWith("espaco") ? "espaco" : "objeto";
      const item = listaDe(estado, tipo).find((i) => i.id === acao.itemId);
      if (!item) throw new ErroJogo("Não encontrei esse item.", 404);
      item.dificil = Boolean(acao.dificil);
      break;
    }

    case "jogo.nome": {
      exigeAdmin(estado, acao);
      estado.nome = limpaNome(acao.nome);
      break;
    }

    case "missao.nova": {
      const jogador = jogadorDe(estado, acao.eu);
      const ativas = estado.missoes.filter((m) => m.dono === jogador.id && m.estado === "ativa").length;
      if (ativas >= LIMITES.ativasPorJogador) {
        throw new ErroJogo("Tens " + ativas + " missões em mão. Resolve algumas antes de pedir mais.");
      }
      if (estado.missoes.length >= LIMITES.missoesTotais) {
        throw new ErroJogo("O jogo já tem missões demais. Pede ao administrador para começar um jogo novo.");
      }
      const missao = sorteiaMissao(estado, jogador.id, Boolean(acao.dificil));
      estado.missoes.push(missao);
      resultado = { missao };
      break;
    }

    case "missao.cumprir": {
      const jogador = jogadorDe(estado, acao.eu);
      const missao = minhaMissao(estado, jogador.id, acao.missaoId);
      if (missao.estado === "cumprida") {
        resultado = { missao };
        return { estado: estadoOriginal, resultado };
      }
      missao.estado = "cumprida";
      missao.cumpridaEm = Date.now();
      resultado = { missao };
      break;
    }

    case "missao.anular": {
      const jogador = jogadorDe(estado, acao.eu);
      const missao = minhaMissao(estado, jogador.id, acao.missaoId);
      missao.estado = "ativa";
      missao.cumpridaEm = null;
      break;
    }

    case "missao.apagar": {
      const jogador = jogadorDe(estado, acao.eu);
      const missao = minhaMissao(estado, jogador.id, acao.missaoId);
      if (missao.estado === "cumprida") {
        throw new ErroJogo("Missões cumpridas não se apagam: contam para o placar.");
      }
      estado.missoes = estado.missoes.filter((m) => m.id !== missao.id);
      break;
    }

    default:
      throw new ErroJogo("Ação desconhecida: " + acao.tipo);
  }

  estado.versao = (Number(estado.versao) || 0) + 1;
  return { estado, resultado };
}

export function placarDe(estado) {
  return estado.jogadores
    .map((jogador) => {
      const minhas = estado.missoes.filter((m) => m.dono === jogador.id);
      const cumpridas = minhas.filter((m) => m.estado === "cumprida");
      return {
        jogadorId: jogador.id,
        nome: jogador.nome,
        pontos: cumpridas.reduce((soma, m) => soma + (Number(m.pontos) || 0), 0),
        cumpridas: cumpridas.length,
        dificeis: cumpridas.filter((m) => m.dificil).length,
        ativas: minhas.filter((m) => m.estado === "ativa").length,
        apanhado: estado.missoes.filter((m) => m.estado === "cumprida" && m.alvo === jogador.id).length,
      };
    })
    .sort((a, b) => b.pontos - a.pontos || b.cumpridas - a.cumpridas || a.nome.localeCompare(b.nome, "pt"));
}

export function titulosDe(placar) {
  if (placar.length < 2) return [];
  const totalCumpridas = placar.reduce((s, p) => s + p.cumpridas, 0);
  const titulos = [];

  const extremo = (campo, direcao) => {
    const valores = placar.map((p) => p[campo]);
    return direcao === "max" ? Math.max(...valores) : Math.min(...valores);
  };
  const juntar = (chave, nome, sinal, descricao, ganhadores) => {
    if (!ganhadores.length) return;
    if (ganhadores.length === placar.length) return; // título de todos não é título
    titulos.push({ chave, nome, sinal, descricao, jogadores: ganhadores.map((p) => p.nome) });
  };

  if (totalCumpridas > 0) {
    const maxPontos = extremo("pontos", "max");
    if (maxPontos > 0) {
      juntar("assassino", "Assassino Silencioso", "☠︎", "mais pontos no jogo",
        placar.filter((p) => p.pontos === maxPontos));
    }
    juntar("fantasma", "Fantasma", "☾", "nunca foi apanhado",
      placar.filter((p) => p.apanhado === 0));

    const maxApanhado = extremo("apanhado", "max");
    if (maxApanhado > 0) {
      juntar("alvo", "Alvo Fácil", "◎", "apanhado mais vezes que todos",
        placar.filter((p) => p.apanhado === maxApanhado));
    }

    const minCumpridas = extremo("cumpridas", "min");
    juntar("pacifista", "Pacifista", "✿", "menos missões cumpridas",
      placar.filter((p) => p.cumpridas === minCumpridas));

    const maxDificeis = extremo("dificeis", "max");
    if (maxDificeis > 0) {
      juntar("mestre", "Mestre das Difíceis", "✶", "mais missões difíceis cumpridas",
        placar.filter((p) => p.dificeis === maxDificeis));
    }
  }

  const maxAtivas = extremo("ativas", "max");
  if (maxAtivas >= 3) {
    juntar("colecionador", "Coleccionador de Segredos", "✧", "mais missões em mão ao mesmo tempo",
      placar.filter((p) => p.ativas === maxAtivas));
  }

  return titulos;
}

/**
 * Vista redigida do jogo para um jogador. É isto, e só isto, que sai do
 * servidor: as missões dos outros nunca passam pela rede, e o PIN também não.
 */
export function vista(estado, euId) {
  const eu = euId && estado.jogadores.some((j) => j.id === euId) ? euId : null;
  const placar = placarDe(estado);
  return {
    id: estado.id,
    nome: estado.nome,
    criadoEm: estado.criadoEm,
    versao: estado.versao,
    jogadores: estado.jogadores.map((j) => ({ id: j.id, nome: j.nome })),
    espacos: estado.espacos.map((i) => ({ id: i.id, nome: i.nome, dificil: Boolean(i.dificil) })),
    objetos: estado.objetos.map((i) => ({ id: i.id, nome: i.nome, dificil: Boolean(i.dificil) })),
    eu,
    minhasMissoes: eu
      ? estado.missoes
          .filter((m) => m.dono === eu)
          .map((m) => ({
            id: m.id,
            alvoNome: m.alvoNome,
            espacoNome: m.espacoNome,
            objetoNome: m.objetoNome,
            dificil: m.dificil,
            pontos: m.pontos,
            estado: m.estado,
            criadaEm: m.criadaEm,
            cumpridaEm: m.cumpridaEm,
          }))
          .sort((a, b) => b.criadaEm - a.criadaEm)
      : [],
    apanhado: eu ? estado.missoes.filter((m) => m.estado === "cumprida" && m.alvo === eu).length : 0,
    placar,
    titulos: titulosDe(placar),
  };
}
