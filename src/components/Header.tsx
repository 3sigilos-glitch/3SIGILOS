import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Sigil } from "./Sigil";
import { SettingsSheet } from "./SettingsSheet";

export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <header className="app-header">
      <div className="brand">
        <Sigil size={36} />
        <div className="brand-text">
          <span className="brand-title">Tarot</span>
          <span className="brand-by">by 3SIGILOS</span>
        </div>
      </div>
      <button
        type="button"
        className="icon-btn"
        aria-label="Definições"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings2 size={21} strokeWidth={1.7} />
      </button>
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
