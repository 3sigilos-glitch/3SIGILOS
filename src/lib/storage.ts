/* Persistência local (localStorage) com protecção contra indisponibilidade.
   Tudo fica apenas no dispositivo: a app não tem backend. */

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sem armazenamento disponível, o estado vive só nesta sessão
  }
}

export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // sem suporte
  }
}
