import { useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Volume2, VolumeX, X } from "lucide-react";
import { RESERVADO_PARA_TODOS } from "../config";
import { AMBIENTS, ambientState, playAmbient, setAmbientVolume, stopAmbient } from "../lib/ambient";
import { usePrefs } from "../lib/prefs";
import { haptic } from "../lib/storage";

/* A folha vive num portal no body: dentro do header, o backdrop-filter
   dele prendia o position fixed e a folha abria cortada. */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { reversed, setReversed, reserved, tryUnlock } = usePrefs();
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [ambient, setAmbient] = useState(() => ambientState());

  function submitCode() {
    if (tryUnlock(code)) {
      haptic(20);
      setCodeOpen(false);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  }

  function chooseAmbient(id: string | null) {
    haptic(8);
    if (!id) stopAmbient();
    else if (!playAmbient(id)) return;
    setAmbient(ambientState());
  }

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

        {reserved && (
          <div className="ambient-block">
            <p className="ambient-title">
              {ambient.playing ? <Volume2 size={15} /> : <VolumeX size={15} />} Ambiente sonoro
            </p>
            <div className="ambient-row">
              <button
                type="button"
                className={"chip chip-sm" + (!ambient.playing ? " active" : "")}
                onClick={() => chooseAmbient(null)}
              >
                Desligado
              </button>
              {AMBIENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={"chip chip-sm" + (ambient.playing === a.id ? " active" : "")}
                  disabled={!a.url}
                  title={a.url ? a.label : "Ficheiro de som ainda não instalado"}
                  onClick={() => chooseAmbient(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              defaultValue={ambient.volume * 100}
              aria-label="Volume do ambiente"
              className="ambient-volume"
              onChange={(e) => setAmbientVolume(Number(e.target.value) / 100)}
            />
            <p className="sheet-note">
              Começa sempre desligado. Baixa sozinho quando a voz da app está a falar.
            </p>
          </div>
        )}

        <p className="sheet-note">
          A leitura em voz alta usa a voz do próprio telemóvel. Em alguns Android pode precisar
          de rede, e a qualidade da voz em português varia de aparelho para aparelho.
        </p>

        <p className="sheet-note">
          O diário, os favoritos e as leituras ficam guardados apenas neste dispositivo. Nada é
          enviado para fora.
        </p>

        {!reserved && (
          <div className="reserved-block">
            {codeOpen ? (
              <div className="reserved-form">
                <input
                  type="password"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value);
                    setCodeError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submitCode()}
                  placeholder="Código"
                  aria-label="Código de acesso reservado"
                  autoFocus
                />
                <button type="button" className="ghost-btn" onClick={submitCode}>
                  Entrar
                </button>
                {codeError && <p className="reserved-error">Código incorrecto.</p>}
              </div>
            ) : (
              <button type="button" className="reserved-link" onClick={() => setCodeOpen(true)}>
                <KeyRound size={13} /> Acesso reservado
              </button>
            )}
          </div>
        )}
        {reserved && !RESERVADO_PARA_TODOS && (
          <p className="sheet-note reserved-on">
            <KeyRound size={13} /> Acesso reservado activo: vês as funcionalidades em teste,
            como as Leituras.
          </p>
        )}

        <p className="sheet-version">Versão {__APP_VERSION__}</p>
      </div>
    </div>,
    document.body
  );
}
