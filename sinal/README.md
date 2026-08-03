# Maré

Aplicacao web progressiva (PWA) para duas pessoas que partilham casa.
Porta de entrada unica: captura, bateria, sinal do dia e obrigacoes da
casa. Tudo o que tem data acaba no Google Calendar partilhado, que
aparece sozinho no ecra inicial em forma de roda (via Sectograph).

Isto nao e uma app de produtividade. E um instrumento. O criterio de
sucesso e continuar a ser usada ao fim de tres meses. Menos friccao,
menos culpa, menos decisoes.

O nome, Maré, vem da bateria social e sensorial que sobe e desce ao
longo do dia, sem sequencias nem culpa. A pasta do projecto mantem se
como `sinal/` por conveniencia, mas a app chama se Maré.

## Stack

- Next.js 15 (App Router, TypeScript, Server Actions e Route Handlers)
- Tailwind CSS v4, sem biblioteca de componentes
- Supabase: Postgres, Auth, Row Level Security
- googleapis para a Google Calendar API
- web-push para notificacoes (VAPID)
- Vercel para alojamento

Zero chaves de API no cliente. Todas as chamadas a servicos externos
passam por Route Handlers.

## Estado, por fases

Todas as fases estao construidas e a compilar. Falta ligar as
credenciais (Supabase, Google, VAPID, Anthropic) e testar em uso real.

- **Fase 0:** projecto, autenticacao Google com refresh token guardado,
  esquema SQL, RLS activa em todas as tabelas, PWA instalavel.
- **Fase 1:** ecra Bateria (arcos, contextos, grafico semanal, PDF).
- **Fase 2:** Despejo com voz, escrita offline em IndexedDB, triagem.
- **Fase 3:** Nos, com sinal do dia, tarefas da casa, obrigacoes com
  escrita real no Google Calendar, parqueadas e push das obrigacoes.
- **Fase 4:** Agora, com escolha de tarefa, temporizador resistente a
  bloqueio de ecra e desdobramento por IA.

## Arranque local

1. Instalar dependencias:

   ```
   npm install
   ```

2. Gerar os icones da PWA (uma vez, ou quando o motivo mudar):

   ```
   npm run icones
   ```

3. Copiar as variaveis de ambiente e preencher:

   ```
   cp .env.example .env.local
   ```

   Ver a seccao "Credenciais" mais abaixo.

4. Correr em desenvolvimento:

   ```
   npm run dev
   ```

## Credenciais necessarias

Tudo isto e preenchido em `.env.local` (local) e nas variaveis de
ambiente da Vercel (producao). Nada disto vai para o repositorio.

### Supabase

1. Criar um projecto em supabase.com.
2. Aplicar o esquema: no editor SQL, correr por ordem os ficheiros de
   `supabase/migrations/`, primeiro `0001_esquema.sql`, depois
   `0002_perfil_automatico.sql`.
3. Copiar para `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (so no servidor, nunca expor)

### Google OAuth e Calendar

1. Na Google Cloud Console, criar um projecto e activar a **Google
   Calendar API**.
2. Configurar o ecra de consentimento OAuth, com o scope
   `https://www.googleapis.com/auth/calendar.events`.
3. Criar credenciais de **cliente Web**. Nos URIs de redireccionamento
   autorizados, adicionar o callback da Supabase:
   `https://<ID_DO_PROJECTO>.supabase.co/auth/v1/callback`
4. No painel da Supabase, em Authentication, Providers, Google, colar o
   Client ID e Client Secret e activar.
5. Colocar o **mesmo** Client ID e Secret em `.env.local`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`). Tem de ser o mesmo par,
   senao a renovacao do token de calendario falha.

Nota sobre o refresh token: o login pede `access_type=offline` e
`prompt=consent`. O refresh token da Google so e entregue na primeira
autorizacao. Se precisares de o voltar a obter durante o
desenvolvimento, revoga o acesso da app em
myaccount.google.com/permissions e entra de novo.

### VAPID (push, usado a partir da Fase 3)

```
npx web-push generate-vapid-keys
```

Colocar a chave publica em `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e a privada em
`VAPID_PRIVATE_KEY`. `VAPID_SUBJECT` e um `mailto:` da conta da casa.

O cron das obrigacoes (`/api/cron/lembretes`) esta agendado em
`vercel.json` para as 06:30 UTC, que corresponde a 07:30 em Lisboa no
horario de verao. No inverno passa a 06:30 em Lisboa, ajusta se precisares.
Protege se com `CRON_SECRET`: a Vercel envia esse valor no cabecalho
`Authorization` quando a variavel esta definida.

### Anthropic (desdobramento, fase 4)

Colocar `ANTHROPIC_API_KEY` em `.env.local`. Sem esta chave, o botao
Desdobrar mostra uma mensagem a dizer que ainda nao esta configurado, e o
resto da app funciona na mesma.

## Semente do espaco da casa

Depois de os dois utilizadores entrarem pelo menos uma vez (para
existirem em `perfis`), seguir `supabase/seed.sql`: criar o espaco
"Casa" com o id do calendario partilhado, e juntar os dois membros.

## Deploy na Vercel

1. Importar o repositorio na Vercel.
2. Em Settings, Root Directory, escolher `sinal`. Isto e essencial: o
   projecto Next.js vive nesta subpasta, nao na raiz do repositorio.
3. Colocar todas as variaveis de ambiente do `.env.example`.
4. Definir `NEXT_PUBLIC_APP_URL` com o dominio final.

## Verificacao da Fase 0

Pronta quando dois utilizadores diferentes entram, ficam no mesmo
espaco, e nenhum consegue ler dados privados do outro. A pagina inicial,
depois de entrar, mostra tres linhas de estado: sessao Google,
calendario ligado e espaco. A separacao de dados e garantida por RLS,
definida em `supabase/migrations/0001_esquema.sql`.

## Notas de estilo

- Todo o texto da interface em portugues de Portugal.
- Nunca usar travessao em texto nenhum, nem em codigo, nem em
  comentarios. Usar virgula, dois pontos ou ponto final.
