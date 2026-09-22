// Estado partilhado dos Mais Lindos: um jogo por código, guardado em Redis
// (Vercel KV ou Upstash, via REST, sem dependências). Sem Redis configurado
// cai para memória da instância, que serve para testar mas não sobrevive a
// reinícios: a app avisa.
//
// O que sai daqui para cada telemóvel é sempre a vista redigida: as missões
// de um jogador nunca são enviadas a outro, e o PIN nunca sai.

import { jogoNovo, aplicar, vista, codigoNovo, ErroJogo } from "../logica.js";

const URL_REDIS = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN_REDIS = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const TEM_REDIS = Boolean(URL_REDIS && TOKEN_REDIS);
const TTL_SEGUNDOS = 60 * 60 * 24 * 60; // 60 dias
const MAX_TENTATIVAS = 6;

const memoria = new Map();

function chave(id) {
  return "maislindos:jogo:" + id;
}

async function comandoRedis(comando) {
  const resposta = await fetch(URL_REDIS, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + TOKEN_REDIS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(comando),
  });
  const texto = await resposta.text();
  let corpo = null;
  try {
    corpo = JSON.parse(texto);
  } catch {
    throw new Error("Resposta ilegível do Redis: " + texto.slice(0, 120));
  }
  if (!resposta.ok || corpo.error) {
    throw new Error("Redis: " + (corpo.error || resposta.status));
  }
  return corpo.result;
}

async function lerBruto(id) {
  if (!TEM_REDIS) return memoria.get(chave(id)) || null;
  const valor = await comandoRedis(["GET", chave(id)]);
  return typeof valor === "string" ? valor : valor == null ? null : JSON.stringify(valor);
}

// Escrita condicionada ao conteúdo anterior (compare and set). Duas pessoas
// a mexer ao mesmo tempo nunca se apagam uma à outra: a segunda relê e repete.
const LUA_CAS = [
  "local atual = redis.call('GET', KEYS[1])",
  "if (atual == false and ARGV[1] == '') or (atual == ARGV[1]) then",
  "  redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))",
  "  return 1",
  "end",
  "return 0",
].join("\n");

async function guardar(id, antes, depois) {
  if (!TEM_REDIS) {
    const atual = memoria.get(chave(id)) || null;
    if ((atual === null && antes === "") || atual === antes) {
      memoria.set(chave(id), depois);
      return true;
    }
    return false;
  }
  const resultado = await comandoRedis([
    "EVAL",
    LUA_CAS,
    "1",
    chave(id),
    antes,
    depois,
    String(TTL_SEGUNDOS),
  ]);
  return Number(resultado) === 1;
}

function normalizaId(valor) {
  return String(valor || "").trim().toUpperCase().slice(0, 8);
}

async function carregar(id) {
  const bruto = await lerBruto(id);
  if (!bruto) throw new ErroJogo("Não há nenhum jogo com esse código.", 404);
  return { bruto, estado: JSON.parse(bruto) };
}

async function criar(corpo) {
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const id = codigoNovo();
    if (await lerBruto(id)) continue;
    const estado = jogoNovo({
      id,
      pin: corpo.pin,
      nome: corpo.nome,
      jogadores: corpo.jogadores,
      exemplo: corpo.exemplo !== false,
    });
    const guardou = await guardar(id, "", JSON.stringify(estado));
    if (guardou) return estado;
  }
  throw new ErroJogo("Não consegui criar o jogo. Tenta outra vez.", 500);
}

async function escrever(id, acao) {
  let ultimo = null;
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa++) {
    const { bruto, estado } = await carregar(id);
    const { estado: novo, resultado } = aplicar(estado, acao);
    if (novo === estado) return { estado: novo, resultado }; // nada mudou
    if (await guardar(id, bruto, JSON.stringify(novo))) {
      return { estado: novo, resultado };
    }
    ultimo = novo;
  }
  void ultimo;
  throw new ErroJogo("O jogo está a ser alterado por outra pessoa. Tenta outra vez.", 409);
}

function corpoDe(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      throw new ErroJogo("Pedido mal formado.");
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      const url = new URL(req.url, "http://local");
      const id = normalizaId(url.searchParams.get("id"));
      if (!id) {
        return res.status(200).json({ ok: true, persistente: TEM_REDIS });
      }
      const { estado } = await carregar(id);
      return res.status(200).json({
        ...vista(estado, url.searchParams.get("eu") || null),
        persistente: TEM_REDIS,
      });
    }

    if (req.method === "POST") {
      const corpo = corpoDe(req);
      const acao = String(corpo.acao || "").trim();

      if (acao === "criar") {
        const estado = await criar(corpo);
        return res.status(200).json({ ...vista(estado, null), persistente: TEM_REDIS });
      }

      const id = normalizaId(corpo.id);
      if (!id) throw new ErroJogo("Falta o código do jogo.");

      if (acao === "admin.entrar") {
        const { estado } = await carregar(id);
        if (String(corpo.pin || "").trim() !== String(estado.pin)) {
          throw new ErroJogo("PIN de administrador errado.", 403);
        }
        return res.status(200).json({
          ...vista(estado, corpo.eu || null),
          admin: true,
          persistente: TEM_REDIS,
        });
      }

      const { estado, resultado } = await escrever(id, { ...corpo, tipo: acao });
      const euId = (resultado && resultado.jogadorId) || corpo.eu || null;
      return res.status(200).json({
        ...vista(estado, euId),
        resultado: resultado && resultado.missao ? { missaoId: resultado.missao.id } : resultado,
        persistente: TEM_REDIS,
      });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ erro: "Método não suportado." });
  } catch (erro) {
    const codigo = erro && erro.codigo ? erro.codigo : 500;
    if (codigo >= 500) console.error("mais-lindos:", erro);
    return res.status(codigo).json({
      erro: codigo >= 500 ? "Falhou do lado do servidor. Tenta outra vez." : erro.message,
    });
  }
}
