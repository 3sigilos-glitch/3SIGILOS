import { useEffect } from "react";

/* O ecrã de arranque vive no index.html para pintar antes do JavaScript.
   Este componente só o desvanece e remove quando a app está pronta. */
export function Splash() {
  useEffect(() => {
    const el = document.getElementById("boot-splash");
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduced ? 0 : 750;
    const t1 = window.setTimeout(() => el.classList.add("fade"), delay);
    const t2 = window.setTimeout(() => el.remove(), delay + 600);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  return null;
}
