import { Card, cardImgFile, cardImgURL } from "../data";

/* Gera um cartão vertical (1080x1920, formato stories) com a gravura,
   o nome, a mensagem do dia e a marca, e partilha-o com a Web Share API.
   Sem suporte para partilha de ficheiros, descarrega a imagem. */

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* A gravura tem de vir com CORS para o canvas poder exportar a imagem.
   O caminho Special:FilePath redirecciona, e esse redireccionamento nem
   sempre autoriza CORS. Por isso o cartão pergunta primeiro à API do
   Commons o endereço directo no servidor de ficheiros
   (upload.wikimedia.org), que autoriza CORS sempre. Se a API falhar,
   tenta o caminho antigo com entrada de cache própria, e só depois
   desiste para o marcador dourado. */
async function directThumbURL(card: Card, width: number): Promise<string | null> {
  try {
    const api =
      "https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*" +
      "&prop=imageinfo&iiprop=url&iiurlwidth=" +
      width +
      "&titles=" +
      encodeURIComponent("File:" + cardImgFile(card));
    const res = await fetch(api);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    const first = pages ? (Object.values(pages)[0] as { imageinfo?: { thumburl?: string }[] }) : null;
    return first?.imageinfo?.[0]?.thumburl ?? null;
  } catch {
    return null;
  }
}

async function loadEngraving(card: Card): Promise<HTMLImageElement | null> {
  const direct = await directThumbURL(card, 640);
  if (direct) {
    const img = await loadImage(direct);
    if (img) return img;
  }
  for (const w of [640, 768]) {
    const img = await loadImage(cardImgURL(card, w) + "&cors=1");
    if (img) return img;
  }
  return null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? line + " " + w : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = probe;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function shareDailyImage(card: Card, message: string, reversed: boolean) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  try {
    await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  } catch {
    // segue com as fontes que houver
  }

  // Fundo tinta-noite com brilho quente no topo
  ctx.fillStyle = "#0b0c14";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -150, 80, W / 2, -150, 900);
  glow.addColorStop(0, "rgba(231, 207, 146, 0.16)");
  glow.addColorStop(1, "rgba(231, 207, 146, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const gold = "#b89344";
  const goldLight = "#e7cf92";
  const parch = "#ede4d3";

  // Marca no topo
  const mark = await loadImage(import.meta.env.BASE_URL + "marca.png");
  if (mark) ctx.drawImage(mark, W / 2 - 60, 90, 120, 120);
  ctx.fillStyle = goldLight;
  ctx.textAlign = "center";
  ctx.font = "600 44px 'EB Garamond', Georgia, serif";
  ctx.fillText("Tarot by 3SIGILOS", W / 2, 286);

  // Gravura com moldura de filete duplo
  const imgW = 560;
  const imgH = Math.round(imgW * 1.72);
  const imgX = (W - imgW) / 2;
  const imgY = 380;
  ctx.strokeStyle = gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(imgX - 22, imgY - 22, imgW + 44, imgH + 44);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(imgX - 12, imgY - 12, imgW + 24, imgH + 24);

  const engraving = await loadEngraving(card);
  if (engraving) {
    const scale = Math.min(imgW / engraving.width, imgH / engraving.height);
    const dw = engraving.width * scale;
    const dh = engraving.height * scale;
    ctx.save();
    if (reversed) {
      ctx.translate(W / 2, imgY + imgH / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-W / 2, -(imgY + imgH / 2));
    }
    ctx.drawImage(engraving, imgX + (imgW - dw) / 2, imgY + (imgH - dh) / 2, dw, dh);
    ctx.restore();
  } else {
    ctx.fillStyle = "#16131e";
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.fillStyle = gold;
    ctx.font = "600 120px 'EB Garamond', Georgia, serif";
    ctx.fillText(card.roman ?? String(card.rank ?? ""), W / 2, imgY + imgH / 2);
  }

  // Nome e mensagem
  let y = imgY + imgH + 130;
  ctx.fillStyle = parch;
  ctx.font = "600 72px 'EB Garamond', Georgia, serif";
  ctx.fillText(card.pt + (reversed ? " (invertida)" : ""), W / 2, y);
  y += 54;
  ctx.fillStyle = "#8d8272";
  ctx.font = "500 34px Inter, Arial, sans-serif";
  ctx.fillText(card.en.toUpperCase(), W / 2, y);
  y += 90;
  ctx.fillStyle = parch;
  ctx.font = "italic 42px 'EB Garamond', Georgia, serif";
  for (const line of wrapText(ctx, message, W - 240).slice(0, 5)) {
    ctx.fillText(line, W / 2, y);
    y += 58;
  }

  ctx.fillStyle = gold;
  ctx.font = "500 30px Inter, Arial, sans-serif";
  ctx.fillText("✦", W / 2, H - 130);
  ctx.fillStyle = "#8d8272";
  ctx.fillText("Carta do dia", W / 2, H - 84);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const file = new File([blob], "carta-do-dia.png", { type: "image/png" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Tarot by 3SIGILOS" });
      return;
    } catch {
      return; // partilha cancelada
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "carta-do-dia.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
