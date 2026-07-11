/* Partilha nativa (Web Share API) com fallback para copiar o link. */
export async function share(title?: string, text?: string) {
  const url = window.location.origin + import.meta.env.BASE_URL;
  const payload = {
    title: title ?? "3SIGILOS",
    text: text ?? "Consulta das 78 cartas do Tarot Rider-Waite, em português.",
    url,
  };
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
  } catch {
    return; // partilha cancelada pelo utilizador
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("Link copiado");
  } catch {
    toast(url);
  }
}

let toastEl: HTMLDivElement | null = null;
let toastTimer: number | undefined;

function toast(msg: string) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl?.classList.remove("show"), 2200);
}
