import { Route, navigate } from "../hooks/useHashRoute";
import { share } from "../share";

export function BottomNav({ route }: { route: Route }) {
  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <button
        type="button"
        className={"nav-item" + (route.view === "cards" ? " active" : "")}
        onClick={() => navigate("/")}
        aria-current={route.view === "cards" ? "page" : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="3" width="12" height="17" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M 18.5 6 L 20 6.5 L 16.5 20 L 12 19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="11.5" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>Cartas</span>
      </button>
      <button
        type="button"
        className={"nav-item" + (route.view === "guide" ? " active" : "")}
        onClick={() => navigate("/guia")}
        aria-current={route.view === "guide" ? "page" : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M 12 5.5 C 10 3.8 7 3.6 4.5 4.4 L 4.5 18.6 C 7 17.8 10 18 12 19.6 C 14 18 17 17.8 19.5 18.6 L 19.5 4.4 C 17 3.6 14 3.8 12 5.5 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <line x1="12" y1="5.8" x2="12" y2="19.2" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        <span>Guia</span>
      </button>
      <button type="button" className="nav-item" onClick={() => share()}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.5" cy="5.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17.5" cy="18.5" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <line x1="8.3" y1="10.8" x2="15.2" y2="6.7" stroke="currentColor" strokeWidth="1.6" />
          <line x1="8.3" y1="13.2" x2="15.2" y2="17.3" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span>Partilhar</span>
      </button>
    </nav>
  );
}
