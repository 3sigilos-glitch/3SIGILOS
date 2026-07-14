import { cardBySlug } from "../data";
import { SpreadPosition } from "../data/spreads";
import { Reading } from "./readings";
import { loadEngraving, loadImage } from "./shareCard";

/* Cartão vertical (1080x1920) de uma leitura: as cartas dispostas no
   esquema, a pergunta se existir, e a marca. Partilha com a Web Share
   API, com fallback para descarregar. */

export async function shareReadingImage(
  reading: Reading,
  spreadName: string,
  positions: SpreadPosition[]
) {
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

  ctx.fillStyle = "#0b0c14";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -150, 80, W / 2, -150, 900);
  glow.addColorStop(0, "rgba(231, 207, 146, 0.15)");
  glow.addColorStop(1, "rgba(231, 207, 146, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const gold = "#b89344";
  const goldLight = "#e7cf92";
  const parch = "#ede4d3";

  const mark = await loadImage(import.meta.env.BASE_URL + "marca.png");
  if (mark) ctx.drawImage(mark, W / 2 - 52, 76, 104, 104);
  ctx.textAlign = "center";
  ctx.fillStyle = goldLight;
  ctx.font = "600 42px 'EB Garamond', Georgia, serif";
  ctx.fillText("Tarot by 3SIGILOS", W / 2, 246);
  ctx.fillStyle = "#978b7a";
  ctx.font = "500 28px Inter, Arial, sans-serif";
  ctx.fillText(spreadName.toUpperCase(), W / 2, 298);

  // Grelha das cartas conforme o número
  const n = reading.cards.length;
  const cols = n <= 1 ? 1 : n <= 3 ? n : n <= 6 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  const areaTop = 360;
  const areaH = reading.question ? 1150 : 1300;
  const cw = Math.min(300, (W - 160 - (cols - 1) * 28) / cols);
  const ch = cw * 1.72;
  const gridH = rows * ch + (rows - 1) * 36;
  const startY = areaTop + Math.max(0, (areaH - gridH) / 2);

  for (let i = 0; i < n; i++) {
    const entry = reading.cards[i];
    const card = cardBySlug(entry.slug);
    if (!card) continue;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const inRow = row === rows - 1 ? n - row * cols : cols;
    const rowW = inRow * cw + (inRow - 1) * 28;
    const x = (W - rowW) / 2 + col * (cw + 28);
    const y = startY + row * (ch + 36);

    ctx.strokeStyle = gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 8, y - 8, cw + 16, ch + 16);
    const img = await loadEngraving(card);
    if (img) {
      const scale = Math.min(cw / img.width, ch / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.save();
      if (entry.reversed) {
        ctx.translate(x + cw / 2, y + ch / 2);
        ctx.rotate(Math.PI);
        ctx.translate(-(x + cw / 2), -(y + ch / 2));
      }
      ctx.drawImage(img, x + (cw - dw) / 2, y + (ch - dh) / 2, dw, dh);
      ctx.restore();
    } else {
      ctx.fillStyle = "#16131e";
      ctx.fillRect(x, y, cw, ch);
      ctx.fillStyle = gold;
      ctx.font = "600 64px 'EB Garamond', Georgia, serif";
      ctx.fillText(card.roman ?? String(card.rank ?? ""), x + cw / 2, y + ch / 2);
    }
    ctx.fillStyle = "#978b7a";
    ctx.font = "500 22px Inter, Arial, sans-serif";
    const label = (positions[i]?.name ?? "") + (entry.reversed ? " ·inv" : "");
    ctx.fillText(label.slice(0, 24), x + cw / 2, y + ch + 40);
  }

  if (reading.question) {
    ctx.fillStyle = parch;
    ctx.font = "italic 38px 'EB Garamond', Georgia, serif";
    const words = reading.question.split(" ");
    let line = "";
    const lines: string[] = [];
    for (const w of words) {
      const probe = line ? line + " " + w : w;
      if (ctx.measureText(probe).width > W - 240 && line) {
        lines.push(line);
        line = w;
      } else line = probe;
    }
    if (line) lines.push(line);
    let y = H - 260;
    for (const l of lines.slice(0, 3)) {
      ctx.fillText(l, W / 2, y);
      y += 52;
    }
  }

  ctx.fillStyle = gold;
  ctx.font = "500 30px Inter, Arial, sans-serif";
  ctx.fillText("✦", W / 2, H - 120);
  ctx.fillStyle = "#978b7a";
  ctx.fillText(
    new Date(reading.createdAt).toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }),
    W / 2,
    H - 74
  );

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  const file = new File([blob], "leitura.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Tarot by 3SIGILOS" });
      return;
    } catch {
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leitura.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
