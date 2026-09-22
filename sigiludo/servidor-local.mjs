// Servidor de desenvolvimento: serve os ficheiros e a função /api/jogo sem
// precisar da Vercel. Correr com:  node servidor-local.mjs
// Depois abrir http://localhost:5174 (no telemóvel, o IP do computador).

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import handler from "./api/jogo.js";

const PORTA = Number(process.env.PORT || 5174);
const RAIZ = new URL(".", import.meta.url).pathname;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".json": "application/json; charset=utf-8",
};

function adaptaResposta(res) {
  res.status = (codigo) => {
    res.statusCode = codigo;
    return res;
  };
  res.json = (corpo) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(corpo));
    return res;
  };
  return res;
}

async function corpoDoPedido(req) {
  const pedacos = [];
  for await (const pedaco of req) pedacos.push(pedaco);
  if (!pedacos.length) return undefined;
  return Buffer.concat(pedacos).toString("utf8");
}

createServer(async (req, res) => {
  adaptaResposta(res);
  const url = new URL(req.url, "http://local");
  if (url.pathname === "/api/jogo") {
    req.body = await corpoDoPedido(req);
    return handler(req, res);
  }
  const caminho = url.pathname === "/" ? "/index.html" : url.pathname;
  const ficheiro = join(RAIZ, normalize(caminho).replace(/^(\.\.[/\\])+/, ""));
  try {
    const dados = await readFile(ficheiro);
    res.setHeader("Content-Type", TIPOS[extname(ficheiro)] || "application/octet-stream");
    res.setHeader("Cache-Control", "no-store");
    res.end(dados);
  } catch {
    res.statusCode = 404;
    res.end("Não encontrado");
  }
}).listen(PORTA, () => {
  console.log("Sigiludo em http://localhost:" + PORTA);
});
