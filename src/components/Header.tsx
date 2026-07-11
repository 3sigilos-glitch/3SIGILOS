import { Sigil } from "./Sigil";

interface Props {
  reversed: boolean;
  onToggleReversed: () => void;
}

export function Header({ reversed, onToggleReversed }: Props) {
  return (
    <header className="app-header">
      <div className="brand">
        <Sigil size={36} />
        <div className="brand-text">
          <span className="brand-title">3SIGILOS</span>
          <span className="brand-by">Tarot Rider-Waite</span>
        </div>
      </div>
      <button
        type="button"
        className={"rev-toggle" + (reversed ? " on" : "")}
        onClick={onToggleReversed}
        aria-pressed={reversed}
      >
        <span className="rev-lbl">Invertidos</span>
        <span className="switch" aria-hidden="true" />
      </button>
    </header>
  );
}
