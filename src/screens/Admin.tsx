import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Lock, LogOut, Send, Sparkles } from "lucide-react";
import {
  Msg,
  clearAdmin,
  isAdmin,
  requestAnalise,
  setAdmin,
  validateAdmin,
} from "../lib/admin";
import { haptic } from "../lib/storage";

const HINT =
  "Descreve o que perguntaste e que cartas saíram. Se souberes, diz a posição de cada uma e " +
  "se está direita ou invertida. Podes continuar a conversa para afinar a leitura.";

export function Admin() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => isAdmin());

  // Ecra de entrada
  const [pass, setPass] = useState("");
  const [checking, setChecking] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Conversa
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function tryLogin() {
    if (!pass.trim() || checking) return;
    setChecking(true);
    setLoginError("");
    const ok = await validateAdmin(pass);
    setChecking(false);
    if (ok) {
      setAdmin(pass);
      setPass("");
      haptic(20);
      setUnlocked(true);
    } else {
      setLoginError("Código incorrecto ou área ainda por configurar no servidor.");
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text || loading) return;
    haptic(8);
    const next: Msg[] = [...messages, { role: "user", text }];
    setMessages(next);
    setDraft("");
    setError("");
    setLoading(true);
    const res = await requestAnalise(next);
    setLoading(false);
    if (res.ok) {
      setMessages([...next, { role: "model", text: res.text }]);
    } else {
      setError(res.detail);
      if (res.unauthorized) {
        clearAdmin();
        setUnlocked(false);
        setMessages([]);
      }
    }
  }

  function newReading() {
    haptic(8);
    setMessages([]);
    setError("");
    setDraft("");
  }

  function lock() {
    haptic(12);
    clearAdmin();
    setMessages([]);
    setUnlocked(false);
  }

  return (
    <main className="admin">
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="detail-pos">Administrador</span>
        {unlocked ? (
          <button type="button" className="icon-btn" onClick={lock} aria-label="Terminar sessão">
            <LogOut size={19} />
          </button>
        ) : (
          <span className="detail-bar-spacer" />
        )}
      </div>

      {!unlocked ? (
        <div className="admin-login">
          <Lock size={30} className="admin-login-icon" />
          <h1>Área do administrador</h1>
          <p>
            Espaço reservado para analisares tiragens em texto livre. Introduz o teu código para
            entrar. Fica guardado só neste dispositivo.
          </p>
          <input
            type="password"
            value={pass}
            onChange={(e) => {
              setPass(e.target.value);
              setLoginError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
            placeholder="Código de administrador"
            aria-label="Código de administrador"
            autoComplete="off"
            autoFocus
          />
          <button type="button" className="gold-btn" onClick={tryLogin} disabled={checking}>
            {checking ? <Loader2 size={16} className="spin" /> : null}
            Entrar
          </button>
          {loginError && <p className="admin-error">{loginError}</p>}
        </div>
      ) : (
        <div className="admin-chat">
          <div className="admin-thread" ref={threadRef}>
            <div className="admin-hint">
              <Sparkles size={16} />
              <p>{HINT}</p>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={"chat-msg " + m.role}>
                {m.text.split(/\n{2,}/).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </div>
            ))}
            {loading && (
              <div className="chat-msg model loading">
                <Loader2 size={18} className="spin" />
                <span>A interpretar a leitura...</span>
              </div>
            )}
            {error && <p className="admin-error">{error}</p>}
          </div>

          <div className="admin-compose">
            {messages.length > 0 && (
              <button type="button" className="admin-new" onClick={newReading}>
                Nova análise
              </button>
            )}
            <div className="admin-input-row">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={
                  messages.length === 0
                    ? "Ex.: Perguntei sobre o trabalho. Saiu o Dez de Espadas invertido no passado, a Torre no presente e o Sol no futuro."
                    : "Escreve a tua resposta ou pergunta de seguimento..."
                }
                rows={messages.length === 0 ? 5 : 3}
                aria-label="Descrição da tiragem"
              />
              <button
                type="button"
                className="admin-send"
                onClick={send}
                disabled={loading || !draft.trim()}
                aria-label="Enviar"
              >
                {loading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
