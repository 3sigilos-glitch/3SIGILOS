"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Table, Flame, Star, Bookmark } from "lucide-react";

const TABS = [
  { href: "/", label: "Runas", icon: LayoutGrid },
  { href: "/matriz", label: "Matriz", icon: Table },
  { href: "/altar", label: "Altar", icon: Flame },
  { href: "/templo", label: "Templo", icon: Star },
  { href: "/guardados", label: "Guardados", icon: Bookmark },
];

// Barra inferior no telemóvel; em ecrã largo passa a coluna lateral
// esquerda. Alvos de toque de 44px ou mais; o separador ativo destaca-se
// com a cor de acento do ambiente.
export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:w-52 lg:border-r lg:border-t-0"
      style={{ borderColor: "var(--line)", background: "var(--panel)" }}
    >
      <ul className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom)] lg:flex-col lg:justify-start lg:gap-1 lg:p-4 lg:pt-8">
        {TABS.map(({ href, label, icon: Icon }) => {
          const on = isActive(href);
          return (
            <li key={href} className="flex-1 lg:flex-none">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className="flex min-h-[52px] flex-col items-center justify-center gap-0.5 px-1 py-1.5 lg:min-h-[48px] lg:flex-row lg:justify-start lg:gap-3 lg:rounded-xl lg:px-4"
                style={{
                  color: on ? "var(--accent)" : "var(--muted)",
                  background: on ? "color-mix(in srgb, var(--accent) 10%, transparent)" : undefined,
                }}
              >
                <Icon size={22} strokeWidth={on ? 2.4 : 1.8} aria-hidden />
                <span
                  className="text-[13px] lg:text-[15px]"
                  style={{ fontWeight: on ? 600 : 500 }}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
