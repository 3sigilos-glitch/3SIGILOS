// Os Mais Lindos, aplicação de uma só página. Sem compilação, sem dependências.
// Fala com /api/jogo para o estado partilhado. Se não houver servidor,
// joga em modo local (só neste telemóvel) com a mesma lógica.

import { jogoNovo, aplicar, vista, codigoNovo, ErroJogo } from "./logica.js";

const API = "/api/jogo";
const CHAVE_SESSAO = "maislindos.sessao";
const CHAVE_LOCAL = "maislindos.local.";
const INTERVALO = 3000;

const ESTADO = {
  ecra: "entrada",
  jogoId: null,
  euId: null,
  pin: null,
  local: false,
  vista: null,
  erro: null,
  recado: null,
  ocupado: false,
  tapado: true,
  revelar: null,
  rascunhos: {},
};

/* ---------- utilitários ---------- */

const esc = (v) =>
  String(v == null ? "" : v).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const $ = (sel) => document.querySelector(sel);

function guardaSessao() {
  try {
    localStorage.setItem(
      CHAVE_SESSAO,
      JSON.stringify({ jogoId: ESTADO.jogoId, euId: ESTADO.euId, pin: ESTADO.pin, local: ESTADO.local })
    );
  } catch (e) {
    void e;
  }
}

function leSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || "null");
  } catch (e) {
    return null;
  }
}

function plural(n, um, muitos) {
  return n === 1 ? um : muitos;
}

/* ---------- camada local (sem servidor) ---------- */

function lerLocal(id) {
  const bruto = localStorage.getItem(CHAVE_LOCAL + id);
  if (!bruto) throw new ErroJogo("Não há nenhum jogo local com esse código.", 404);
  return JSON.parse(bruto);
}

function guardarLocal(estado) {
  localStorage.setItem(CHAVE_LOCAL + estado.id, JSON.stringify(estado));
}

/* ---------- camada de rede ---------- */

async function pedirServidor(metodo, dados) {
  const opcoes = { method: metodo, headers: { "Content-Type": "application/json" } };
  let url = API;
  if (metodo === "GET") {
    const p = new URLSearchParams();
    if (dados.id) p.set("id", dados.id);
    if (dados.eu) p.set("eu", dados.eu);
    url += "?" + p.toString();
    delete opcoes.headers;
  } else {
    opcoes.body = JSON.stringify(dados);
  }
  let resposta;
  try {
    resposta = await fetch(url, opcoes);
  } catch (e) {
    const erro = new ErroJogo("Sem ligação ao servidor do jogo.", 0);
    erro.rede = true;
    throw erro;
  }
  let corpo = null;
  try {
    corpo = await resposta.json();
  } catch (e) {
    const erro = new ErroJogo("O servidor respondeu de forma estranha.", resposta.status || 500);
    erro.rede = true;
    throw erro;
  }
  if (!resposta.ok) throw new ErroJogo(corpo.erro || "Pedido recusado.", resposta.status);
  return corpo;
}

// Mesma interface nos dois modos: devolve sempre a vista do jogador.
async function sincronizar() {
  if (!ESTADO.jogoId) return null;
  if (ESTADO.local) {
    const v = vista(lerLocal(ESTADO.jogoId), ESTADO.euId);
    v.local = true;
    return v;
  }
  return pedirServidor("GET", { id: ESTADO.jogoId, eu: ESTADO.euId });
}

async function agir(acao) {
  if (ESTADO.local) {
    const estado = lerLocal(ESTADO.jogoId);
    const { estado: novo, resultado } = aplicar(estado, {
      ...acao,
      eu: acao.eu ?? ESTADO.euId,
      pin: acao.pin ?? ESTADO.pin,
    });
    guardarLocal(novo);
    const euId = (resultado && resultado.jogadorId) || acao.eu || ESTADO.euId;
    const v = vista(novo, euId);
    v.local = true;
    v.resultado = resultado && resultado.missao ? { missaoId: resultado.missao.id } : resultado;
    return v;
  }
  return pedirServidor("POST", {
    ...acao,
    acao: acao.tipo,
    id: ESTADO.jogoId,
    eu: acao.eu ?? ESTADO.euId,
    pin: acao.pin ?? ESTADO.pin ?? undefined,
  });
}

/* ---------- orquestração ---------- */

async function correr(tarefa, { silencioso = false } = {}) {
  if (ESTADO.ocupado) return;
  ESTADO.ocupado = true;
  const antes = ESTADO.vista ? JSON.stringify(ESTADO.vista) : "";
  if (!silencioso) {
    ESTADO.erro = null;
    ESTADO.recado = null;
    desenhar();
  }
  try {
    const v = await tarefa();
    if (v) aceitaVista(v);
  } catch (erro) {
    if (!silencioso) {
      ESTADO.erro = erro.message || "Alguma coisa correu mal.";
      const texto = erro.message || "";
      if (erro.codigo === 404 && ESTADO.jogoId) {
        if (/código/i.test(texto)) {
          sair();
        } else if (/jogador/i.test(texto)) {
          ESTADO.euId = null;
          ESTADO.ecra = "missoes";
          guardaSessao();
        }
      }
    }
  } finally {
    ESTADO.ocupado = false;
    const depois = ESTADO.vista ? JSON.stringify(ESTADO.vista) : "";
    if (!silencioso || antes !== depois) desenhar();
  }
}

function aceitaVista(v) {
  ESTADO.vista = v;
  if (v.id) ESTADO.jogoId = v.id;
  if (v.eu) ESTADO.euId = v.eu;
  else if (ESTADO.euId && v.jogadores && !v.jogadores.some((j) => j.id === ESTADO.euId)) {
    // O administrador removeu-me do jogo.
    ESTADO.euId = null;
    ESTADO.ecra = "identidade";
  }
  if (ESTADO.ecra === "entrada" && ESTADO.jogoId) {
    ESTADO.ecra = ESTADO.euId ? "missoes" : "identidade";
  }
  guardaSessao();
}

function sair() {
  ESTADO.jogoId = null;
  ESTADO.euId = null;
  ESTADO.pin = null;
  ESTADO.vista = null;
  ESTADO.ecra = "entrada";
  guardaSessao();
}

/* ---------- ecrãs ---------- */

function ecraEntrada() {
  const guardada = leSessao();
  const voltar =
    guardada && guardada.jogoId
      ? `<button class="b-largo b-ouro" data-ac="retomar" style="margin-bottom:14px">
           Voltar ao jogo ${esc(guardada.jogoId)}
         </button>`
      : "";
  return `
    <div class="marca">
      <div class="selo">✦</div>
      <div class="titulo">Os Mais Lindos</div>
      <div class="sub">um jogo de missões secretas</div>
      <p class="lema">Uma pessoa. Um espaço. Um objecto.<br>Ninguém pode saber.</p>
    </div>
    ${voltar}
    <div class="cartao">
      <h2>Entrar num jogo</h2>
      <p class="nota">Pede o código de quatro letras a quem criou o jogo.</p>
      <input id="campo-codigo" class="codigo-entrada" type="text" inputmode="latin"
             autocapitalize="characters" autocomplete="off" maxlength="4" placeholder="ABCD">
      <button class="b-largo b-ouro" data-ac="entrar" style="margin-top:12px">Entrar</button>
    </div>
    <div class="cartao">
      <h2>Criar jogo novo</h2>
      <p class="nota">Ficas administrador deste jogo. O PIN serve para gerir a casa.</p>
      <label for="campo-nome-jogo">Nome do jogo (opcional)</label>
      <input id="campo-nome-jogo" type="text" placeholder="Fim de semana na Nazaré" maxlength="44">
      <label for="campo-pin-novo">PIN de administrador (4 a 8 dígitos)</label>
      <input id="campo-pin-novo" type="password" inputmode="numeric" autocomplete="new-password"
             maxlength="8" placeholder="••••">
      <label for="campo-jogadores">Jogadores, um por linha (opcional)</label>
      <textarea id="campo-jogadores" placeholder="Ana&#10;Bruno&#10;Carla"></textarea>
      <div class="linha-opcao">
        <input id="campo-exemplo" type="checkbox" checked>
        <label for="campo-exemplo" style="margin:0">Começar com espaços e objectos de exemplo</label>
      </div>
      <button class="b-largo b-ouro" data-ac="criar" style="margin-top:14px">Criar jogo</button>
    </div>
    <div class="rodape">
      Estado partilhado entre todos os telemóveis. As missões de cada um ficam só com ele.
      <br><button class="b-nu" data-ac="modo-local">Jogar só neste telemóvel</button>
    </div>
  `;
}

function ecraIdentidade() {
  const v = ESTADO.vista;
  const lista = v.jogadores.length
    ? v.jogadores
        .map(
          (j) =>
            `<button class="b-largo" data-ac="sou-eu" data-id="${esc(j.id)}" style="margin-bottom:8px">
               ${esc(j.nome)}
             </button>`
        )
        .join("")
    : `<p class="nota">Ainda não há ninguém na lista.</p>`;
  return `
    ${barra(false)}
    <div class="cartao">
      <h2>Quem és tu?</h2>
      <p class="nota">Escolhe o teu nome. Só tu vais ver as tuas missões.</p>
      ${lista}
    </div>
    <div class="cartao">
      <h2>Não estás na lista?</h2>
      <p class="nota">Acrescenta-te. O administrador pode remover depois.</p>
      <div class="juntar">
        <input id="campo-eu-nome" type="text" placeholder="O teu nome" maxlength="44">
        <button class="b-ouro" data-ac="juntar-me">Entrar</button>
      </div>
    </div>
  `;
}

function barra(comTroca = true) {
  const v = ESTADO.vista || {};
  const eu = (v.jogadores || []).find((j) => j.id === ESTADO.euId);
  return `
    <div class="barra">
      <div class="quem">
        <b>${esc(v.nome || "Jogo")}</b>
        <span>código <span class="codigo-jogo">${esc(v.id || "")}</span>${
          eu ? " · sou " + esc(eu.nome) : ""
        }</span>
      </div>
      ${
        comTroca
          ? `<button class="b-fino" data-ac="trocar">Trocar</button>`
          : `<button class="b-fino" data-ac="sair">Sair</button>`
      }
    </div>
  `;
}

function cartaoMissao(m) {
  const tapar = ESTADO.tapado ? " tapado" : "";
  const classe =
    "missao" + (m.dificil ? " dificil" : "") + (m.estado === "cumprida" ? " cumprida" : "") + tapar;
  const accoes =
    m.estado === "ativa"
      ? `<div class="accoes">
           <button class="b-fino b-ouro" data-ac="cumprir" data-id="${esc(m.id)}">Cumprida</button>
           <button class="b-fino b-perigo" data-ac="apagar" data-id="${esc(m.id)}">Desistir</button>
         </div>`
      : `<div class="accoes">
           <button class="b-fino" data-ac="anular" data-id="${esc(m.id)}">Afinal não</button>
         </div>`;
  return `
    <div class="${classe}">
      <div class="meta">
        <span class="etiqueta ${m.dificil ? "dificil" : "normal"}">${m.dificil ? "difícil" : "normal"}</span>
        <span>${m.pontos} ${plural(m.pontos, "ponto", "pontos")}</span>
        ${m.estado === "cumprida" ? "<span>✓ cumprida</span>" : ""}
      </div>
      ${ficha(m)}
      ${accoes}
    </div>
  `;
}

// Ficha da missão: quem, onde, o quê. Sem frase corrida, para não haver
// concordâncias erradas com nomes que o administrador escreve à mão.
function ficha(m) {
  return `
    <div class="frase">
      <div class="campo"><span class="rotulo">Quem</span><span class="valor">${esc(m.alvoNome)}</span></div>
      <div class="campo"><span class="rotulo">Onde</span><span class="valor">${esc(m.espacoNome)}</span></div>
      <div class="campo"><span class="rotulo">Pega em</span><span class="valor">${esc(m.objetoNome)}</span></div>
    </div>
  `;
}

function ecraMissoes() {
  const v = ESTADO.vista;
  const activas = v.minhasMissoes.filter((m) => m.estado === "ativa");
  const cumpridas = v.minhasMissoes.filter((m) => m.estado === "cumprida");
  const meu = v.placar.find((p) => p.jogadorId === ESTADO.euId);
  return `
    ${barra()}
    <div class="contador">
      <div class="n">${v.apanhado}</div>
      <div class="t">${
        v.apanhado === 0
          ? "ainda não fui apanhado"
          : v.apanhado === 1
          ? "já fui apanhado uma vez"
          : "já fui apanhado " + v.apanhado + " vezes"
      }</div>
    </div>
    <div class="cartao">
      <h2>Nova missão</h2>
      <p class="nota">
        ${meu ? meu.pontos + " " + plural(meu.pontos, "ponto", "pontos") + " · " : ""}
        ${activas.length} ${plural(activas.length, "missão em mão", "missões em mão")}.
        Pede as difíceis que quiseres: a responsabilidade é tua.
      </p>
      <div class="duo">
        <button class="b-ouro" data-ac="nova" data-dificil="0">Normal<small>1 ponto</small></button>
        <button class="b-dificil" data-ac="nova" data-dificil="1">Difícil<small>2 pontos</small></button>
      </div>
    </div>
    ${
      activas.length
        ? `<div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 10px">
             <h2 style="font-size:17px">As minhas missões</h2>
             <button class="b-nu" data-ac="tapar">${ESTADO.tapado ? "Mostrar" : "Tapar"}</button>
           </div>
           ${ESTADO.tapado ? '<p class="aviso-tapado">Tapadas para ninguém espreitar por cima do ombro.</p>' : ""}
           ${activas.map(cartaoMissao).join("")}`
        : `<div class="cartao"><p class="nota" style="margin:0">
             Ainda não tens missões. Pede uma acima e começa a puxar os cordelinhos.
           </p></div>`
    }
    ${
      cumpridas.length
        ? `<h2 style="font-size:17px;margin:22px 0 10px">Cumpridas (${cumpridas.length})</h2>
           ${cumpridas.map(cartaoMissao).join("")}`
        : ""
    }
  `;
}

function ecraEstatisticas() {
  const v = ESTADO.vista;
  const linhas = v.placar
    .map(
      (p) => `
      <tr class="${p.jogadorId === ESTADO.euId ? "eu" : ""}">
        <td class="nome">${esc(p.nome)}</td>
        <td class="pontos">${p.pontos}</td>
        <td>${p.cumpridas}</td>
        <td>${p.apanhado}</td>
      </tr>`
    )
    .join("");
  const titulos = v.titulos.length
    ? v.titulos
        .map(
          (t) => `
        <div class="titulo-premio">
          <div class="sinal">${t.sinal}</div>
          <div>
            <b>${esc(t.nome)}</b><br>
            <span class="quem">${t.jogadores.map(esc).join(", ")}</span>
            <div class="porque">${esc(t.descricao)}</div>
          </div>
        </div>`
        )
        .join("")
    : `<p class="nota" style="margin:0">Os títulos aparecem assim que houver missões cumpridas.</p>`;
  return `
    ${barra()}
    <div class="cartao">
      <h2>Placar</h2>
      <p class="nota">Visível a toda a gente. O que ninguém vê é o quê, onde e com quem.</p>
      <table>
        <thead><tr><th>Jogador</th><th>Pontos</th><th>Cumpridas</th><th>Apanhado</th></tr></thead>
        <tbody>${linhas || '<tr><td colspan="4">Sem jogadores.</td></tr>'}</tbody>
      </table>
    </div>
    <div class="cartao">
      <h2>Títulos</h2>
      <p class="nota">Atribuídos sozinhos, conforme o jogo vai andando.</p>
      ${titulos}
    </div>
  `;
}

function listaAdmin(tipo, itens) {
  if (!itens.length) return `<p class="nota" style="margin:8px 0 0">Lista vazia.</p>`;
  return itens
    .map(
      (i) => `
      <div class="item-lista">
        <span class="nome">${esc(i.nome)}</span>
        <label class="interruptor">
          <input type="checkbox" data-ac="dificil" data-tipo="${tipo}" data-id="${esc(i.id)}"
                 ${i.dificil ? "checked" : ""}> difícil
        </label>
        <button class="b-fino b-perigo" data-ac="remover-item" data-tipo="${tipo}" data-id="${esc(i.id)}">×</button>
      </div>`
    )
    .join("");
}

function ecraAdmin() {
  const v = ESTADO.vista;
  if (!ESTADO.pin) {
    return `
      ${barra()}
      <div class="cartao">
        <h2>Administração</h2>
        <p class="nota">Só quem criou o jogo. Gere jogadores, espaços e objectos.</p>
        <label for="campo-pin">PIN</label>
        <input id="campo-pin" type="password" inputmode="numeric" maxlength="8" placeholder="••••">
        <button class="b-largo b-ouro" data-ac="admin-entrar" style="margin-top:12px">Entrar</button>
      </div>
    `;
  }
  const ligacao = location.origin + location.pathname + "?jogo=" + (v.id || "");
  return `
    ${barra()}
    <div class="cartao">
      <h2>Convidar</h2>
      <p class="nota">Código <span class="codigo-jogo">${esc(v.id)}</span></p>
      <button class="b-largo" data-ac="copiar" data-texto="${esc(ligacao)}">Copiar ligação do jogo</button>
    </div>
    <div class="cartao">
      <h2>Jogadores (${v.jogadores.length})</h2>
      ${v.jogadores
        .map(
          (j) => `
        <div class="item-lista">
          <span class="nome">${esc(j.nome)}</span>
          <button class="b-fino b-perigo" data-ac="remover-jogador" data-id="${esc(j.id)}">×</button>
        </div>`
        )
        .join("") || '<p class="nota" style="margin:8px 0 0">Lista vazia.</p>'}
      <div class="juntar">
        <input id="campo-novo-jogador" type="text" placeholder="Nome" maxlength="44">
        <button class="b-ouro" data-ac="add-jogador">Juntar</button>
      </div>
    </div>
    <div class="cartao">
      <h2>Espaços da casa (${v.espacos.length})</h2>
      <p class="nota">Marca como difíceis os espaços onde é complicado levar alguém.</p>
      ${listaAdmin("espaco", v.espacos)}
      <div class="juntar">
        <input id="campo-novo-espaco" type="text" placeholder="Despensa" maxlength="44">
        <button class="b-ouro" data-ac="add-espaco">Juntar</button>
      </div>
    </div>
    <div class="cartao">
      <h2>Objectos (${v.objetos.length})</h2>
      <p class="nota">Os difíceis são os que ninguém pega sem um bom motivo.</p>
      ${listaAdmin("objeto", v.objetos)}
      <div class="juntar">
        <input id="campo-novo-objeto" type="text" placeholder="Abre-latas" maxlength="44">
        <button class="b-ouro" data-ac="add-objeto">Juntar</button>
      </div>
    </div>
    <button class="b-largo" data-ac="admin-sair">Sair da administração</button>
  `;
}

function navegacao() {
  if (!ESTADO.vista || !ESTADO.euId) return "";
  const botao = (ecra, ic, texto) =>
    `<button data-ac="ecra" data-ecra="${ecra}" class="${ESTADO.ecra === ecra ? "activo" : ""}">
       <span class="ic">${ic}</span>${texto}
     </button>`;
  return botao("missoes", "✦", "Missões") + botao("estatisticas", "♛", "Placar") + botao("admin", "⚙", "Casa");
}

function veuRevelacao() {
  const m = ESTADO.revelar;
  if (!m) return "";
  return `
    <div class="veu" data-ac="fechar-veu">
      <div class="papel${m.dificil ? " dificil" : ""}">
        <div class="chapeu">${m.dificil ? "missão difícil · 2 pontos" : "missão nova · 1 ponto"}</div>
        ${ficha(m)}
        <p class="nota">Faz com que esta pessoa pegue neste objecto, neste espaço, sem perceber
        que está a cumprir uma missão tua.</p>
        <button class="b-largo b-ouro" data-ac="fechar-veu">Guardar segredo</button>
      </div>
    </div>
  `;
}

/* ---------- desenho ---------- */

function desenhar() {
  const activo = document.activeElement;
  const focado = activo && activo.id ? activo.id : null;
  const caret = focado && activo.selectionStart != null ? activo.selectionStart : null;

  let corpo = "";
  if (!ESTADO.vista || !ESTADO.jogoId) corpo = ecraEntrada();
  else if (!ESTADO.euId) corpo = ecraIdentidade();
  else if (ESTADO.ecra === "estatisticas") corpo = ecraEstatisticas();
  else if (ESTADO.ecra === "admin") corpo = ecraAdmin();
  else corpo = ecraMissoes();

  const avisos =
    (ESTADO.erro ? `<div class="alerta">${esc(ESTADO.erro)}</div>` : "") +
    (ESTADO.recado ? `<div class="alerta bom">${esc(ESTADO.recado)}</div>` : "") +
    (ESTADO.local && ESTADO.jogoId
      ? `<div class="alerta">Modo local: este jogo vive só neste telemóvel.</div>`
      : "") +
    (ESTADO.vista && ESTADO.vista.persistente === false && !ESTADO.local
      ? `<div class="alerta discreto">Servidor sem base de dados ligada: este jogo pode desaparecer num reinício.</div>`
      : "");

  $("#app").innerHTML = avisos + corpo + veuRevelacao();
  const nav = $("#nav");
  nav.innerHTML = navegacao();
  nav.hidden = !nav.innerHTML;

  for (const [id, valor] of Object.entries(ESTADO.rascunhos)) {
    const campo = document.getElementById(id);
    if (campo && campo.value !== valor) campo.value = valor;
  }
  if (focado) {
    const campo = document.getElementById(focado);
    if (campo) {
      campo.focus();
      if (caret != null && campo.setSelectionRange) {
        try {
          campo.setSelectionRange(caret, caret);
        } catch (e) {
          void e;
        }
      }
    }
  }
}

function valor(id) {
  const campo = document.getElementById(id);
  return campo ? campo.value.trim() : (ESTADO.rascunhos[id] || "").trim();
}

function limpaCampo(id) {
  delete ESTADO.rascunhos[id];
  const campo = document.getElementById(id);
  if (campo) campo.value = "";
}

/* ---------- acções ---------- */

let relogioTapar = null;

async function criarJogo() {
  const pin = valor("campo-pin-novo");
  const nome = valor("campo-nome-jogo");
  const jogadores = valor("campo-jogadores")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const exemplo = document.getElementById("campo-exemplo")
    ? document.getElementById("campo-exemplo").checked
    : true;
  if (!/^\d{4,8}$/.test(pin)) throw new ErroJogo("O PIN tem de ser um número de 4 a 8 dígitos.");

  if (ESTADO.local) {
    const estado = jogoNovo({ id: codigoNovo(), pin, nome, jogadores, exemplo });
    guardarLocal(estado);
    ESTADO.jogoId = estado.id;
    ESTADO.pin = pin;
    const v = vista(estado, null);
    v.local = true;
    return v;
  }
  const v = await pedirServidor("POST", { acao: "criar", pin, nome, jogadores, exemplo });
  ESTADO.jogoId = v.id;
  ESTADO.pin = pin;
  ["campo-pin-novo", "campo-nome-jogo", "campo-jogadores"].forEach(limpaCampo);
  return v;
}

async function entrarEmJogo(codigo) {
  const id = String(codigo || "").trim().toUpperCase();
  if (id.length < 4) throw new ErroJogo("O código tem quatro letras.");
  ESTADO.jogoId = id;
  ESTADO.euId = null;
  ESTADO.pin = null;
  try {
    const v = await sincronizar();
    limpaCampo("campo-codigo");
    return v;
  } catch (erro) {
    ESTADO.jogoId = null;
    if (erro.rede && !ESTADO.local) {
      erro.message = "Sem ligação ao servidor. Podes jogar só neste telemóvel, em baixo.";
    }
    throw erro;
  }
}

function trataClique(evento) {
  const alvo = evento.target.closest("[data-ac]");
  if (!alvo) return;
  const ac = alvo.dataset.ac;

  if (ac === "fechar-veu") {
    if (evento.target.closest(".papel") && alvo.tagName !== "BUTTON") return;
    ESTADO.revelar = null;
    desenhar();
    return;
  }
  if (ac === "ecra") {
    ESTADO.ecra = alvo.dataset.ecra;
    ESTADO.erro = null;
    ESTADO.recado = null;
    desenhar();
    return;
  }
  if (ac === "tapar") {
    ESTADO.tapado = !ESTADO.tapado;
    clearTimeout(relogioTapar);
    // Ao fim de meio minuto à vista, tapa sozinho outra vez.
    if (!ESTADO.tapado) {
      relogioTapar = setTimeout(() => {
        ESTADO.tapado = true;
        desenhar();
      }, 30000);
    }
    desenhar();
    return;
  }
  if (ac === "trocar") {
    ESTADO.euId = null;
    ESTADO.ecra = "missoes";
    guardaSessao();
    correr(sincronizar);
    return;
  }
  if (ac === "sair") {
    sair();
    desenhar();
    return;
  }
  if (ac === "modo-local") {
    ESTADO.local = true;
    ESTADO.recado = "Modo local ligado: cria aqui um jogo só para este telemóvel.";
    guardaSessao();
    desenhar();
    return;
  }
  if (ac === "admin-sair") {
    ESTADO.pin = null;
    guardaSessao();
    desenhar();
    return;
  }
  if (ac === "copiar") {
    const texto = alvo.dataset.texto;
    const feito = () => {
      ESTADO.recado = "Ligação copiada.";
      desenhar();
    };
    if (navigator.clipboard) navigator.clipboard.writeText(texto).then(feito, () => prompt("Copia daqui:", texto));
    else prompt("Copia daqui:", texto);
    return;
  }
  if (ac === "retomar") {
    const s = leSessao();
    if (!s) return;
    ESTADO.jogoId = s.jogoId;
    ESTADO.euId = s.euId || null;
    ESTADO.pin = s.pin || null;
    ESTADO.local = Boolean(s.local);
    correr(sincronizar);
    return;
  }
  if (ac === "criar") return void correr(criarJogo);
  if (ac === "entrar") return void correr(() => entrarEmJogo(valor("campo-codigo")));
  if (ac === "sou-eu") {
    ESTADO.euId = alvo.dataset.id;
    ESTADO.ecra = "missoes";
    guardaSessao();
    return void correr(sincronizar);
  }
  if (ac === "juntar-me") {
    const nome = valor("campo-eu-nome");
    if (!nome) return;
    limpaCampo("campo-eu-nome");
    return void correr(async () => {
      const v = await agir({ tipo: "jogador.add", nome });
      if (v.eu) ESTADO.ecra = "missoes";
      return v;
    });
  }
  if (ac === "nova") {
    const dificil = alvo.dataset.dificil === "1";
    return void correr(async () => {
      const v = await agir({ tipo: "missao.nova", dificil });
      const nova =
        v.resultado && v.resultado.missaoId
          ? v.minhasMissoes.find((m) => m.id === v.resultado.missaoId)
          : v.minhasMissoes.filter((m) => m.estado === "ativa")[0];
      if (nova) {
        ESTADO.revelar = nova;
        ESTADO.tapado = true;
      }
      return v;
    });
  }
  if (ac === "cumprir") {
    const id = alvo.dataset.id;
    return void correr(async () => {
      const v = await agir({ tipo: "missao.cumprir", missaoId: id });
      ESTADO.recado = "Missão cumprida. Ninguém viu nada.";
      return v;
    });
  }
  if (ac === "anular") {
    const id = alvo.dataset.id;
    return void correr(() => agir({ tipo: "missao.anular", missaoId: id }));
  }
  if (ac === "apagar") {
    const id = alvo.dataset.id;
    if (!confirm("Desistir desta missão?")) return;
    return void correr(() => agir({ tipo: "missao.apagar", missaoId: id }));
  }
  if (ac === "admin-entrar") {
    const pin = valor("campo-pin");
    if (!pin) return;
    return void correr(async () => {
      if (ESTADO.local) {
        const estado = lerLocal(ESTADO.jogoId);
        if (String(pin) !== String(estado.pin)) throw new ErroJogo("PIN de administrador errado.", 403);
        ESTADO.pin = pin;
        limpaCampo("campo-pin");
        guardaSessao();
        return vista(estado, ESTADO.euId);
      }
      const v = await pedirServidor("POST", { acao: "admin.entrar", id: ESTADO.jogoId, eu: ESTADO.euId, pin });
      ESTADO.pin = pin;
      limpaCampo("campo-pin");
      guardaSessao();
      return v;
    });
  }
  if (ac === "add-jogador") {
    const nome = valor("campo-novo-jogador");
    if (!nome) return;
    limpaCampo("campo-novo-jogador");
    return void correr(() => agir({ tipo: "jogador.add", nome, eu: ESTADO.euId }));
  }
  if (ac === "add-espaco" || ac === "add-objeto") {
    const espaco = ac === "add-espaco";
    const campo = espaco ? "campo-novo-espaco" : "campo-novo-objeto";
    const nome = valor(campo);
    if (!nome) return;
    limpaCampo(campo);
    return void correr(() => agir({ tipo: (espaco ? "espaco" : "objeto") + ".add", nome, dificil: false }));
  }
  if (ac === "remover-jogador") {
    if (!confirm("Remover este jogador? As missões activas dele, e contra ele, desaparecem.")) return;
    return void correr(() => agir({ tipo: "jogador.remove", jogadorId: alvo.dataset.id }));
  }
  if (ac === "remover-item") {
    const tipo = alvo.dataset.tipo;
    if (!confirm("Remover? As missões activas que o usavam desaparecem.")) return;
    return void correr(() => agir({ tipo: tipo + ".remove", itemId: alvo.dataset.id }));
  }
}

function trataMudanca(evento) {
  const alvo = evento.target.closest("[data-ac='dificil']");
  if (!alvo) return;
  const tipo = alvo.dataset.tipo;
  const dificil = alvo.checked;
  correr(() => agir({ tipo: tipo + ".dificil", itemId: alvo.dataset.id, dificil }));
}

/* ---------- arranque ---------- */

function arrancar() {
  document.addEventListener("click", trataClique);
  document.addEventListener("change", trataMudanca);
  document.addEventListener("input", (e) => {
    if (e.target.id) ESTADO.rascunhos[e.target.id] = e.target.value;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !e.target.id) return;
    const mapa = {
      "campo-codigo": "entrar",
      "campo-eu-nome": "juntar-me",
      "campo-pin": "admin-entrar",
      "campo-novo-jogador": "add-jogador",
      "campo-novo-espaco": "add-espaco",
      "campo-novo-objeto": "add-objeto",
    };
    const ac = mapa[e.target.id];
    if (!ac) return;
    e.preventDefault();
    const falso = document.querySelector(`[data-ac="${ac}"]`);
    if (falso) falso.click();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") correr(sincronizar, { silencioso: true });
  });
  setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (!ESTADO.jogoId || ESTADO.local || ESTADO.ocupado || ESTADO.revelar) return;
    correr(sincronizar, { silencioso: true });
  }, INTERVALO);

  const sessao = leSessao();
  const daLigacao = new URLSearchParams(location.search).get("jogo");
  if (daLigacao) {
    history.replaceState(null, "", location.pathname);
    ESTADO.local = false;
    correr(() => entrarEmJogo(daLigacao));
  } else if (sessao && sessao.jogoId) {
    ESTADO.jogoId = sessao.jogoId;
    ESTADO.euId = sessao.euId || null;
    ESTADO.pin = sessao.pin || null;
    ESTADO.local = Boolean(sessao.local);
    correr(sincronizar);
  } else {
    desenhar();
  }
}

arrancar();
