/* Configuração das funcionalidades reservadas.

   CODIGO_RESERVADO: o código que desbloqueia as funcionalidades novas
   num dispositivo (Definições > Acesso reservado). Muda-o aqui.

   RESERVADO_PARA_TODOS: quando quiseres abrir as funcionalidades novas
   a toda a gente, muda para true e publica. O código deixa de ser
   necessário. */

export const CODIGO_RESERVADO = "3sigilostouro";
export const RESERVADO_PARA_TODOS = false;

/* Leituras inteligentes permitidas por pessoa por dia (indicação no
   cliente). O limite que conta é o do proxy: mantém a variável
   INSIGHT_PER_USER_DAY no Vercel com o mesmo valor. Durante o período
   de testes está em 2; baixa para 1 quando quiseres. */
export const LEITURAS_INTELIGENTES_POR_DIA = 2;
