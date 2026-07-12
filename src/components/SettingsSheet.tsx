import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { usePrefs } from "../lib/prefs";

/* A folha vive num portal no body: dentro do header, o backdrop-filter
   dele prendia o position fixed e a folha abria cortada. */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { reversed, setReversed } = usePrefs();
  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label="Definições"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-head">
          <h2>Definições</h2>
          <button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <button
          type="button"
          className={"rev-toggle" + (reversed ? " on" : "")}
          onClick={() => setReversed(!reversed)}
          aria-pressed={reversed}
        >
          <span className="rev-lbl">Cartas invertidas</span>
          <span className="switch" aria-hidden="true" />
        </button>
        <p className="sheet-note">
          Com as invertidas ligadas, os significados invertidos ficam sempre visíveis e a carta
          do dia pode sair invertida. Desligadas, o invertido fica atrás de um toque.
        </p>

        <p className="sheet-note">
          A leitura em voz alta usa a voz do próprio telemóvel. Em alguns Android pode precisar
          de rede, e a qualidade da voz em português varia de aparelho para aparelho.
        </p>

        <p className="sheet-note">
          O diário e os favoritos ficam guardados apenas neste dispositivo. Nada é enviado para
          fora.
        </p>

        <p className="sheet-version">Versão {__APP_VERSION__}</p>
      </div>
    </div>,
    document.body
  );
}
