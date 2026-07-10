import { useEffect, useState } from "react";
import { Sigil } from "./Sigil";

/* Ecrã de arranque breve: mostra a marca e desvanece. */
export function Splash() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setPhase("gone");
      return;
    }
    const t1 = window.setTimeout(() => setPhase("fade"), 900);
    const t2 = window.setTimeout(() => setPhase("gone"), 1450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={"splash" + (phase === "fade" ? " fade" : "")} aria-hidden="true">
      <Sigil size={72} />
      <p className="splash-title">Tarot</p>
      <p className="splash-by">by 3SIGILOS</p>
    </div>
  );
}
