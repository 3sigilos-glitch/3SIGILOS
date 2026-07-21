"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Runas" },
  { href: "/matriz", label: "Matriz" },
  { href: "/altar", label: "Altar" },
  { href: "/templo", label: "Templo" },
  { href: "/guardados", label: "Guardados" },
];

// Header sticky com wordmark e navegação Cinzel uppercase.
export default function Header() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(12px)",
        background: "rgba(14,13,19,0.82)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "14px 20px 0",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          gap: "8px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            className="font-runic glow-pulse"
            style={{ color: "var(--gold)", fontSize: 24 }}
            aria-hidden
          >
            ᛗ
          </span>
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <span
              className="font-cinzel"
              style={{
                fontSize: 19,
                fontWeight: 600,
                letterSpacing: 5,
                textTransform: "uppercase",
                color: "var(--gold-light)",
                textShadow: "0 0 20px rgba(201,168,106,0.35)",
              }}
            >
              Magia Nórdica
            </span>
            <span
              className="font-cinzel"
              style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "var(--text-4)" }}
            >
              ᛗ · Módulo Branco · ᛗ
            </span>
          </span>
        </div>
        <nav
          aria-label="Navegação principal"
          style={{ display: "flex", gap: 2, marginLeft: "auto", overflowX: "auto" }}
        >
          {TABS.map(({ href, label }) => {
            const on = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className="font-cinzel"
                style={{
                  fontSize: 13,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  padding: "12px 14px",
                  color: on ? "var(--gold-light)" : "var(--text-4)",
                  borderBottom: "2px solid " + (on ? "var(--gold)" : "transparent"),
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
