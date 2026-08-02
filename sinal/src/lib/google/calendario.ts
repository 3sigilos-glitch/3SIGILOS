import { google } from "googleapis";
import { obterClienteAutenticado } from "./tokens";

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
