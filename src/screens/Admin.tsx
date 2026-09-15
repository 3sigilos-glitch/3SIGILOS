import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, History, Loader2, Lock, LogOut, Send, Sparkles, Trash2 } from "lucide-react";
import {
  Msg,
  SavedReading,
  clearAdmin,
  deleteReading,
  isAdmin,
  loadHistory,
  newReadingId,
  readingTitle,
  requestAnalise,
  saveReading,
  setAdmin,
  validateAdmin,
} from "../lib/admin";
import { haptic } from "../lib/storage";

const HINT =
  "Descreve o que perguntaste e que cartas saíram. Se souberes, diz a posição de cada uma e " +
  "se está direita ou invertida. Podes continuar a conversa para afinar a leitura.";

function whenLabel(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }) +
    " · " +
    d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })
  );
}

export function Admin() {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => isAdmin());

  // Ecra de entrada
  const [pass, setPass] = useState("");
  const [checking, setChecking] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Conversa
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentId, setCurrentId] = useState<string>(() => newReadingId());
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  // Histórico
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedReading[]>(() => loadHistory());

  useEffect(() => {
    if (showHistory) return;
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, showHistory]);

  /* Grava a conversa atual no histórico, mantendo a data de criação. */
  function persist(msgs: Msg[]) {
    if (msgs.length === 0) return;
    const existing = loadHistory().find((r) => r.id === currentId);
    const now = Date.now();
    saveReading({
      id: currentId,
      created: existing?.created ?? now,
      updated: now,
      title: readingTitle(msgs),
      messages: msgs,
    });
    setHistory(loadHistory());
  }

  async function tryLogin() {
    if (!pass.trim() || checking) return;
    setChecking(true);
    setLoginError("");
    const result = await validateAdmin(pass);
    setChecking(false);
    if (result === "ok") {
      setAdmin(pass);
      setPass("");
      haptic(20);
      setUnlocked(true);
    } else if (result === "wrong") {
      setLoginError("Código incorrecto.");
    } else if (result === "unconfigured") {
      setLoginError(
        "A área ainda não está ligada no servidor. Falta definir ADMIN_TOKEN no Vercel e fazer um novo deploy."
      );
    } else if (result === "stale") {
      setLoginError(
        "A app parece estar numa versão antiga guardada. Fecha-a por completo e reabre (ou recarrega a página) e tenta outra vez."
      );
    } else {
      setLoginError("Não foi possível validar agora. Verifica a ligação e tenta outra vez.");
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
      const done = [...next, { role: "model" as const, text: res.text }];
      setMessages(done);
      persist(done);
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
    setCurrentId(newReadingId());
    setError("");
    setDraft("");
    setShowHistory(false);
  }

  function openReading(r: SavedReading) {
    haptic(8);
    setMessages(r.messages);
    setCurrentId(r.id);
    setError("");
    setDraft("");
    setShowHistory(false);
  }

  function removeReading(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    haptic(12);
    deleteReading(id);
    setHistory(loadHistory());
    if (id === currentId) newReading();
  }

  function lock() {
    haptic(12);
    clearAdmin();
    setMessages([]);
    setShowHistory(false);
    setUnlocked(false);
  }

  return (
    <main className="admin">
      <div className="detail-bar">
        <button type="button" className="icon-btn" onClick={() => navigate("/")} aria-label="Voltar">
          <ChevronLeft size={24} />
        </button>
        <span className="detail-pos">{showHistory ? "Histórico" : "Administrador"}</span>
        {unlocked ? (
          <div className="detail-actions">
            <button
              type="button"
              className={"icon-btn" + (showHistory ? " on" : "")}
              onClick={() => {
                haptic(8);
                setHistory(loadHistory());
                setShowHistory((v) => !v);
              }}
              aria-label="Histórico de análises"
              aria-pressed={showHistory}
            >
              <History size={20} />
            </button>
            <button type="button" className="icon-btn" onClick={lock} aria-label="Terminar sessão">
              <LogOut size={19} />
            </button>
          </div>
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
      ) : showHistory ? (
        <div className="admin-history">
          <button type="button" className="gold-btn admin-hist-new" onClick={newReading}>
            <Sparkles size={16} /> Nova análise
          </button>
          {history.length === 0 ? (
            <p className="admin-hist-empty">
              Ainda não há análises guardadas. As que fizeres ficam aqui, só neste dispositivo.
            </p>
          ) : (
            <ul className="admin-hist-list">
              {history.map((r) => (
                <li key={r.id}>
                  <button type="button" className="hist-item" onClick={() => openReading(r)}>
                    <span className="hist-title">{r.title}</span>
                    <span className="hist-meta">
                      {whenLabel(r.updated)} · {r.messages.length} mensagens
                    </span>
                  </button>
                  <button
                    type="button"
                    className="hist-del icon-btn"
                    onClick={(e) => removeReading(r.id, e)}
                    aria-label="Apagar análise"
                  >
                    <Trash2 size={17} />
                  </button>
                </li>
              ))}
            </ul>
          )}
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
