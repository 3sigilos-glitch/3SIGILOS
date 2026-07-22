import { NextRequest, NextResponse } from "next/server";

// Portão de acesso: o conteúdo do curso é fechado. Nada (páginas, dados
// ou chunks) é servido sem o código de acesso. Corre no edge, antes de
// qualquer conteúdo sair para a web.
//
// O código define-se na variável de ambiente ACCESS_PASSWORD (Vercel:
// Settings > Environment Variables). Sem ela, usa-se um valor por defeito
// que DEVE ser mudado.

const PASSWORD = process.env.ACCESS_PASSWORD || "runas-modulo-branco";
const COOKIE = "runas_acesso";
const LOGIN_PATH = "/entrar";
const LOGOUT_PATH = "/sair";

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function loginHTML(erro = ""): string {
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Magia Nórdica · Acesso</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:#0e0d13;background-image:radial-gradient(1200px 600px at 50% -200px,#1a1725 0%,#0e0d13 60%);
color:#e9e4d8;font-family:Georgia,'Times New Roman',serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.box{width:100%;max-width:380px;text-align:center}
.rune{font-size:46px;color:#c9a86a;text-shadow:0 0 26px rgba(201,168,106,.55);line-height:1}
h1{font-size:22px;font-weight:500;letter-spacing:4px;text-transform:uppercase;color:#e3cfa0;margin:16px 0 2px}
.sub{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#7d7890;margin:0 0 26px}
p.lead{color:#9a94a8;font-size:15px;line-height:1.5;margin:0 0 22px}
form{display:flex;flex-direction:column;gap:12px}
input{font:inherit;font-size:17px;text-align:center;letter-spacing:1px;background:#16141d;color:#ece7db;
border:1px solid #2f2a40;border-radius:8px;padding:13px 14px;outline:none}
input:focus{border-color:#c9a86a}
button{font:inherit;font-size:14px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;
background:#c9a86a;color:#0e0d13;border:none;border-radius:999px;padding:13px 16px;font-weight:600}
button:hover{background:#e3cfa0}
.erro{color:#cf6a5a;font-size:14px;margin:0 0 14px}
.foot{margin-top:26px;font-size:12px;color:#585470;line-height:1.5}
</style></head><body>
<div class="box">
<div class="rune">ᛗ</div>
<h1>Magia Nórdica</h1>
<div class="sub">ᛗ · Módulo Branco · ᛗ</div>
<p class="lead">Conteúdo de estudo reservado. Introduz o teu código de acesso.</p>
${erro ? `<p class="erro">${erro}</p>` : ""}
<form method="post" action="${LOGIN_PATH}" autocomplete="off">
<input type="password" name="codigo" placeholder="Código de acesso" aria-label="Código de acesso" autofocus>
<button type="submit">Entrar</button>
</form>
<div class="foot">Ensinamentos do manual de Magia Nórdica de Eduardo Gabriel · Templus ©.</div>
</div></body></html>`;
}

function htmlResponse(body: string, status = 200): NextResponse {
  return new NextResponse(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow" },
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await sha256(PASSWORD);
  const authed = req.cookies.get(COOKIE)?.value === token;

  // sair: limpa o cookie
  if (pathname === LOGOUT_PATH) {
    const res = htmlResponse(loginHTML(), 200);
    res.cookies.set(COOKIE, "", { path: "/", maxAge: 0 });
    return res;
  }

  // submissão do código
  if (req.method === "POST" && pathname === LOGIN_PATH) {
    const form = await req.formData();
    const codigo = form.get("codigo");
    if (typeof codigo === "string" && (await sha256(codigo)) === token) {
      const res = NextResponse.redirect(new URL("/", req.url), 303);
      res.cookies.set(COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180, // 180 dias
      });
      return res;
    }
    return htmlResponse(loginHTML("Código incorreto. Tenta de novo."), 401);
  }

  if (authed) return NextResponse.next();

  // qualquer outra coisa sem sessão: mostra o portão
  return htmlResponse(loginHTML(), 401);
}

// Corre em tudo, incluindo os chunks estáticos (onde vivem os dados),
// exceto o ícone do site e o robots.txt (que deve ser legível pelos
// motores de busca para verem a proibição de indexar).
export const config = {
  matcher: ["/((?!favicon.ico|robots.txt).*)"],
};
