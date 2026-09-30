import { useEffect, useRef, useState } from "react";

/**
 * Suaviza um valor para o ponteiro nao saltar entre leituras.
 * Em ligacao real a centralina responde a 4-8 Hz; sem isto o ponteiro
 * mexia-se aos degraus.
 * @param {number} target valor alvo
 * @param {number} tau constante de tempo em segundos (menor = mais nervoso)
 */
export function useAnimatedValue(target, tau = 0.12) {
  const [value, setValue] = useState(target || 0);
  const current = useRef(target || 0);
  const goal = useRef(target || 0);

  useEffect(() => {
    goal.current = Number.isFinite(target) ? target : 0;
  }, [target]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      const k = 1 - Math.exp(-dt / tau);
      const next = current.current + (goal.current - current.current) * k;
      if (Math.abs(next - current.current) > 0.01) {
        current.current = next;
        setValue(next);
      } else if (current.current !== goal.current) {
        current.current = goal.current;
        setValue(goal.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tau]);

  return value;
}
