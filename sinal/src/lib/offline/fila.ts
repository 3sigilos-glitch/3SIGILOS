// Fila offline de capturas, em IndexedDB. A escrita e sempre local e
// imediata, nunca bloqueia a interface a espera da rede. A sincronizacao
// com o Supabase corre em segundo plano e pode repetir sem duplicar,
// porque cada captura leva um id gerado no cliente.
//
// Nao usamos localStorage para dados reais, so IndexedDB.

const BD = "sinal";
const LOJA = "capturas";
const VERSAO = 1;

export type CapturaLocal = {
  id: string;
  texto: string;
  origem: "voz" | "teclado";
  criado_em: string;
};

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BD, VERSAO);
    pedido.onupgradeneeded = () => {
      const bd = pedido.result;
      if (!bd.objectStoreNames.contains(LOJA)) {
        bd.createObjectStore(LOJA, { keyPath: "id" });
      }
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

function comLoja<T>(
  modo: IDBTransactionMode,
  fn: (loja: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return abrir().then(
    (bd) =>
      new Promise<T>((resolve, reject) => {
        const tx = bd.transaction(LOJA, modo);
        const pedido = fn(tx.objectStore(LOJA));
        pedido.onsuccess = () => resolve(pedido.result);
        pedido.onerror = () => reject(pedido.error);
        tx.oncomplete = () => bd.close();
      })
  );
}

export async function guardarLocal(c: CapturaLocal): Promise<void> {
  await comLoja("readwrite", (loja) => loja.put(c));
}

export async function porSincronizar(): Promise<CapturaLocal[]> {
  return comLoja<CapturaLocal[]>("readonly", (loja) => loja.getAll());
}

export async function removerLocal(id: string): Promise<void> {
  await comLoja("readwrite", (loja) => loja.delete(id));
}

export async function contarLocal(): Promise<number> {
  return comLoja<number>("readonly", (loja) => loja.count());
}

// Envia para o servidor todas as capturas ainda por sincronizar.
// Remove da fila local so as que o servidor confirmou. Devolve quantas
// ficaram por enviar (por falta de rede, por exemplo).
export async function sincronizarFila(): Promise<number> {
  let pendentes: CapturaLocal[];
  try {
    pendentes = await porSincronizar();
  } catch {
    return 0;
  }

  for (const c of pendentes) {
    try {
      const resposta = await fetch("/api/capturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(c),
      });
      if (resposta.ok) {
        await removerLocal(c.id);
      }
    } catch {
      // Sem rede. Fica na fila para a proxima tentativa.
    }
  }

  try {
    return (await porSincronizar()).length;
  } catch {
    return 0;
  }
}
