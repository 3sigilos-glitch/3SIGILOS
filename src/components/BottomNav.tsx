import { NavLink } from "react-router-dom";
import { Home, WalletCards, Footprints, BookOpen, Sparkles } from "lucide-react";
import { usePrefs } from "../lib/prefs";
import { haptic } from "../lib/storage";

export function BottomNav() {
  const { reserved } = usePrefs();
  const tabs = [
    { to: "/", label: "Início", icon: Home, end: true },
    { to: "/cartas", label: "Cartas", icon: WalletCards, end: false },
    ...(reserved ? [{ to: "/leituras", label: "Leituras", icon: Sparkles, end: false }] : []),
    { to: "/jornada", label: "Jornada", icon: Footprints, end: false },
    { to: "/guia", label: "Guia", icon: BookOpen, end: false },
  ];
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          onClick={() => haptic(8)}
        >
          <Icon size={22} strokeWidth={1.7} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
