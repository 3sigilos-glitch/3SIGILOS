import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

// Cifra dos refresh tokens da Google, com AES 256 GCM.
//
// Porque existe: o refresh token da a quem o tiver acesso continuado ao
// calendario da casa, sem passar pelo ecra de consentimento. Guardado em
// texto simples, bastava uma copia da base de dados, um backup mal
// guardado ou a chave de servico para o levar. Cifrado, o valor na base
// de dados nao serve de nada sem a chave, que vive so nas variaveis de
// ambiente e nunca na base de dados.
//
// GCM traz autenticacao: se alguem alterar o texto cifrado, a decifra
// falha em vez de devolver lixo silenciosamente.

const FORMATO = "v1";

function chave(): Buffer {
  const bruta = process.env.TOKEN_ENCRYPTION_KEY;
  if (!bruta) {
    throw new Error(
      "Falta TOKEN_ENCRYPTION_KEY. Sem ela nao e possivel guardar nem ler a ligacao ao calendario."
    );
  }
  const buf = Buffer.from(bruta, "base64");
  if (buf.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY tem de ser 32 bytes em base64. Gera uma nova."
    );
  }
  return buf;
}

// Devolve "v1.<iv>.<etiqueta>.<cifrado>", tudo em base64url.
export function cifrar(texto: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", chave(), iv);
  const cifrado = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  const etiqueta = cifra.getAuthTag();
  return [
    FORMATO,
    iv.toString("base64url"),
    etiqueta.toString("base64url"),
    cifrado.toString("base64url"),
  ].join(".");
}

// Aceita valores cifrados. Um valor sem o prefixo v1 e tratado como
// texto simples de uma versao anterior, para nao partir uma ligacao ja
// existente: e devolvido tal e qual e volta a ser gravado cifrado na
// proxima escrita.
export function decifrar(valor: string): string {
  if (!valor.startsWith(FORMATO + ".")) {
    return valor;
  }
  const partes = valor.split(".");
  if (partes.length !== 4) {
    throw new Error("Valor cifrado com formato invalido.");
  }
  const [, ivB64, etiquetaB64, cifradoB64] = partes;
  const decifra = createDecipheriv(
    "aes-256-gcm",
    chave(),
    Buffer.from(ivB64, "base64url")
  );
  decifra.setAuthTag(Buffer.from(etiquetaB64, "base64url"));
  return Buffer.concat([
    decifra.update(Buffer.from(cifradoB64, "base64url")),
    decifra.final(),
  ]).toString("utf8");
}

// True quando o valor guardado ainda nao esta cifrado.
export function porCifrar(valor: string): boolean {
  return !valor.startsWith(FORMATO + ".");
}

// Comparacao de segredos em tempo constante, para o cron.
export function segredoIgual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
