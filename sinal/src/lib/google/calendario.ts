import { google } from "googleapis";
import { obterClienteAutenticado } from "./tokens";

// Motivos pelos quais a escrita no calendario pode falhar. Sem isto, uma
// falta de permissao de partilha e uma autorizacao sem o ambito do
// calendario davam a mesma mensagem, e nao havia como distinguir.
export type MotivoCalendario =
  | "sem_ambito" // a conta autorizou a entrada mas nao o calendario
  | "sem_acesso" // o calendario nao esta partilhado com esta conta, ou so em leitura
  | "desconhecido";

export class ErroCalendario extends Error {
  motivo: MotivoCalendario;
  detalhe: string;
  constructor(motivo: MotivoCalendario, detalhe: string) {
    super(`Calendario: ${motivo}. ${detalhe}`);
    this.name = "ErroCalendario";
    this.motivo = motivo;
    this.detalhe = detalhe;
  }
}

type ErroGoogle = {
  code?: number;
  message?: string;
  errors?: { reason?: string; message?: string }[];
  response?: {
    status?: number;
    data?: { error?: { errors?: { reason?: string }[]; message?: string } };
  };
};

// A googleapis usa mais do que uma forma para o mesmo erro, conforme o
// sitio onde rebenta. Olhamos para as duas.
function classificar(e: unknown): ErroCalendario {
  const erro = e as ErroGoogle;
  const estado = erro?.code ?? erro?.response?.status;
  const razao =
    erro?.errors?.[0]?.reason ?? erro?.response?.data?.error?.errors?.[0]?.reason;
  const mensagem =
    erro?.response?.data?.error?.message ?? erro?.message ?? "sem detalhe";
  const detalhe = `estado ${estado ?? "?"}, razao ${razao ?? "?"}, ${mensagem}`;

  if (
    razao === "insufficientPermissions" ||
    /insufficient/i.test(mensagem) ||
    /ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(mensagem)
  ) {
    return new ErroCalendario("sem_ambito", detalhe);
  }

  if (
    estado === 404 ||
    razao === "notFound" ||
    razao === "forbidden" ||
    razao === "writerAccessRequired" ||
    (estado === 403 && razao !== "insufficientPermissions")
  ) {
    return new ErroCalendario("sem_acesso", detalhe);
  }

  return new ErroCalendario("desconhecido", detalhe);
}

// Cria um evento de dia inteiro no calendario partilhado da casa, para
// uma obrigacao com data. Devolve o id do evento na Google, que guardamos
// em tarefas_casa.evento_google_id.
//
// So escrevemos no calendario obrigacoes da casa criadas explicitamente
// pelo utilizador. Nada mais vai para o Google Calendar.
export async function criarEventoObrigacao(
  userId: string,
  calendarioId: string,
  dados: { titulo: string; data: string; avisarDias: number }
): Promise<string> {
  const auth = await obterClienteAutenticado(userId);
  const calendar = google.calendar({ version: "v3", auth });

  // Evento de dia inteiro. O fim de um evento de dia inteiro e o dia
  // seguinte, segundo a API da Google.
  const inicio = dados.data; // YYYY-MM-DD
  const fim = new Date(dados.data + "T00:00:00Z");
  fim.setUTCDate(fim.getUTCDate() + 1);
  const fimStr = fim.toISOString().slice(0, 10);

  const minutosAntes = Math.max(0, Math.round(dados.avisarDias)) * 24 * 60;

  try {
    const resposta = await calendar.events.insert({
      calendarId: calendarioId,
      requestBody: {
        summary: dados.titulo,
        start: { date: inicio },
        end: { date: fimStr },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: minutosAntes }],
        },
      },
    });
    return resposta.data.id ?? "";
  } catch (e) {
    const erro = classificar(e);
    // Fica no registo da Vercel, para se poder ver o que a Google disse.
    console.error("Falha ao escrever no calendario:", erro.detalhe);
    throw erro;
  }
}

export type EventoVista = {
  id: string;
  titulo: string;
  inicio: string; // ISO, ou YYYY-MM-DD se for de dia inteiro
  diaInteiro: boolean;
  calendario: string;
};

// Le os proximos dias de varios calendarios ao mesmo tempo, so para
// mostrar. Nunca escreve.
//
// Um calendario que falhe (deixou de estar partilhado, foi apagado) nao
// pode derrubar os outros nem o ecra: falha em silencio e mostra se o
// resto. Ver o que ha e melhor do que nao ver nada por causa de um.
export async function eventosProximos(
  userId: string,
  calendarios: string[],
  dias = 7
): Promise<EventoVista[]> {
  if (calendarios.length === 0) return [];

  const auth = await obterClienteAutenticado(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + dias);

  const listas = await Promise.all(
    calendarios.map(async (id) => {
      try {
        const r = await calendar.events.list({
          calendarId: id,
          timeMin: inicio.toISOString(),
          timeMax: fim.toISOString(),
          singleEvents: true,
          orderBy: "startTime",
          maxResults: 50,
        });
        return (r.data.items ?? []).map((e) => ({
          id: e.id ?? "",
          titulo: e.summary ?? "(sem titulo)",
          inicio: e.start?.dateTime ?? e.start?.date ?? "",
          diaInteiro: !e.start?.dateTime,
          calendario: id,
        }));
      } catch (erro) {
        console.error("Calendario ilegivel:", id, classificar(erro).detalhe);
        return [] as EventoVista[];
      }
    })
  );

  return listas
    .flat()
    .filter((e) => e.inicio)
    .sort((a, b) => a.inicio.localeCompare(b.inicio));
}

// Eventos de hoje dos calendarios do utilizador. Leitura, para apoio.
export async function eventosDeHoje(userId: string, calendarioId: string) {
  const auth = await obterClienteAutenticado(userId);
  const calendar = google.calendar({ version: "v3", auth });

  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);

  const resposta = await calendar.events.list({
    calendarId: calendarioId,
    timeMin: inicio.toISOString(),
    timeMax: fim.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  });

  return resposta.data.items ?? [];
}
