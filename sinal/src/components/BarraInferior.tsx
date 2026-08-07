"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra inferior fixa, quatro separadores. Sem menu lateral, sem
// hamburguer. Cada separador tem o seu acento apenas quando activo,
// para se saber onde se esta pela visao periferica, sem ler.

type Sep = {
  href: string;
  rotulo: string;
  acento: string;
  icone: (activo: boolean) => React.ReactNode;
};

const traco = "var(--color-tinta-fraca)";

const separadores: Sep[] = [
  {
    href: "/bateria",
    rotulo: "Bateria",
    acento: "var(--color-ac-bateria)",
    icone: (a) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 14a8 8 0 0 1 16 0" stroke={a ? "var(--color-ac-bateria)" : traco} strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="14" x2="16.5" y2="9.5" stroke={a ? "var(--color-ac-bateria)" : traco} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/despejo",
    rotulo: "Despejo",
    acento: "var(--color-ac-despejo)",
    icone: (a) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="7" stroke={a ? "var(--color-ac-despejo)" : traco} strokeWidth="2" />
        <circle cx="12" cy="12" r="2.5" fill={a ? "var(--color-ac-despejo)" : traco} />
      </svg>
    ),
  },
  {
    href: "/nos",
    rotulo: "Nós",
    acento: "var(--color-ac-nos)",
    icone: (a) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="9" cy="12" r="4" stroke={a ? "var(--color-ac-nos)" : traco} strokeWidth="2" />
        <circle cx="15" cy="12" r="4" stroke={a ? "var(--color-ac-nos)" : traco} strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/agora",
    rotulo: "Agora",
    acento: "var(--color-ac-agora)",
    icone: (a) => (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="13" r="7" stroke={a ? "var(--color-ac-agora)" : traco} strokeWidth="2" />
        <line x1="12" y1="13" x2="12" y2="9" stroke={a ? "var(--color-ac-agora)" : traco} strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="3" x2="14" y2="3" stroke={a ? "var(--color-ac-agora)" : traco} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function BarraInferior() {
  const caminho = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-20 border-t border-[var(--color-traco)] bg-[var(--color-breu)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {separadores.map((s) => {
          const activo = caminho.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className="flex flex-col items-center justify-center gap-1 py-2.5 min-h-16"
                aria-current={activo ? "page" : undefined}
              >
                {s.icone(activo)}
                <span
                  className="text-xs"
                  style={{ color: activo ? s.acento : traco }}
                >
                  {s.rotulo}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
