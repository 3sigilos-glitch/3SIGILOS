import { NavLink } from "react-router-dom";
import { Home, WalletCards, Footprints, BookOpen } from "lucide-react";
import { haptic } from "../lib/storage";

const TABS = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/cartas", label: "Cartas", icon: WalletCards, end: false },
  { to: "/jornada", label: "Jornada", icon: Footprints, end: false },
  { to: "/guia", label: "Guia", icon: BookOpen, end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      {TABS.map(({ to, label, icon: Icon, end }) => (
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
