# Tarot by 3SIGILOS

Aplicação web progressiva (PWA) de tarot Rider-Waite em português europeu.
Instalável no telemóvel, com estética de grimório à luz de vela: tinta
escura, ouro velho, pergaminho, serif de livro.

As gravuras são as de Pamela Colman Smith, 1909, em domínio público,
carregadas do Wikimedia Commons.

## O que a app faz

- **Início**: carta do dia determinística (a mesma durante todo o dia,
  muda à meia-noite), com mensagem, histórico dos últimos dias e partilha
  como imagem vertical para stories.
- **Cartas**: as 78 cartas com pesquisa insensível a acentos e painel de
  filtros unificado no fundo do ecrã (naipes com símbolo e cor, números
  do Ás ao Rei em grelha, favoritas). Recolhível pelo puxador.
- **Detalhe**: Direito, Invertido (escondível), Na imagem, Para reflectir,
  botão de ouvir em voz alta, favorito e diário pessoal local. Deslizar
  para os lados muda de carta dentro do filtro activo.
- **Jornada do Louco**: os 22 Arcanos Maiores num trilho vertical com
  caminho dourado, orbe luminoso que acompanha o capítulo, entrada
  cinemática e painel de áudio (capítulos, velocidade, auto-avanço).
- **Guia**: naipes e números em acordeões.
- **Modo estudo**: flashcards que respeitam os filtros activos.
- **Definições** (roda dentada no cabeçalho): invertidos, notas de
  privacidade e número de versão.

## Arquitectura

```
src/
  data/        cards.json (extraído do HTML original), index.ts (tipos),
               day-messages.ts, fool-journey.ts
  lib/         speech.ts (voz), dailyCard.ts, shareCard.ts, storage.ts, prefs.tsx
  components/  CardImg, FilterPanel, BottomNav, Accordion, Header, ...
  screens/     Home, Cards, CardDetail, Journey, Guide, Study
source/        tarot-rider-waite.html (fonte de verdade) e logótipo
scripts/       extract-data.mjs (extrai e valida as 78 cartas)
               make-icons.mjs (gera os ícones a partir do logótipo)
```

Os textos das cartas vivem em `source/tarot-rider-waite.html`. O script
`npm run extract` valida que saem exactamente 78 cartas completas e nunca
os reescreve.

## Conteúdo a entregar depois (a app já está pronta a recebê-lo)

- **Mensagens da carta do dia**: preencher `src/data/day-messages.ts`,
  indexado pelo nome EN da carta. Sem mensagem própria, a app compõe uma
  a partir das keywords e da primeira frase do significado.
- **Narrativa da Jornada do Louco**: substituir os marcadores de posição
  em `src/data/fool-journey.ts` (22 capítulos, `{ roman, cardEn, title, text }`).
- **Arte do Louco**: se vier ilustração própria, colocar em `src/assets/`
  e referenciar no ecrã da Jornada.

## Correr localmente

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm run build      # valida os dados e compila para dist/
```

## Publicar (Vercel)

O projecto já está ligado ao Vercel: **cada `git push` ao ramo `main`
publica automaticamente a nova versão** no link partilhável. O número de
versão visível nas Definições vem do `package.json` mais a data do build.

Para publicar uma actualização: alterar o código, `git commit`, `git push`.
Mais nada.

## Instalar no telemóvel

- **Android (Chrome)**: abrir o link, menu de três pontos, "Adicionar ao
  ecrã principal" ou "Instalar aplicação".
- **iPhone (Safari)**: abrir o link, botão de partilha, "Adicionar ao ecrã
  principal".

## Limitações conhecidas da voz

A leitura em voz alta usa a síntese de voz do próprio dispositivo
(Web Speech API), sem custos nem servidores:

- Em alguns Android a voz pode exigir ligação à rede.
- As vozes PT-PT variam de aparelho para aparelho; sem voz portuguesa
  instalada, a app usa a voz por defeito e avisa discretamente.
- Mudar a velocidade reinicia a faixa actual do início.
- O destaque da frase a ser lida depende do suporte do dispositivo; sem
  ele, o áudio funciona na mesma.

## Módulo de Leituras (acesso reservado)

As tiragens fazem-se sempre no baralho físico: a app não sorteia nem
baralha. O utilizador insere as cartas que saíram e a app interpreta.

### Acesso reservado

- As Leituras (e futuras novidades) estão ocultas por defeito.
- Para desbloquear num dispositivo: Definições > Acesso reservado >
  introduzir o código. O código define-se em `src/config.ts`
  (`CODIGO_RESERVADO`).
- Para abrir a todos de uma vez: em `src/config.ts`, muda
  `RESERVADO_PARA_TODOS` para `true` e publica.
- Nota: é ocultação do lado do cliente para gerir testes, não é
  segurança forte.

### Leitura inteligente (Gemini pago, via proxy)

A chave NUNCA fica na app: vive na função serverless `api/interpretar.ts`,
publicada automaticamente pelo Vercel junto com a app.

Para activar:
1. Cria uma chave do Gemini no Google AI Studio e liga a facturação
   (serviço pago; o tier gratuito não serve, por privacidade e pelos
   termos para a Europa).
2. No painel do Vercel do projecto: Settings > Environment Variables >
   adiciona `GEMINI_API_KEY` com a chave. Redeploy.
3. Recomendado para os limites serem à prova de reinícios: cria uma base
   Upstash Redis gratuita (upstash.com) e define também
   `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
   Sem Upstash, a contagem vive na memória da instância (best effort).

Limites (por defeito 1 por pessoa por dia e 50 globais por dia), ajustáveis
com as variáveis `INSIGHT_PER_USER_DAY` e `INSIGHT_GLOBAL_DAY`.

Rede de segurança do gasto: no Google Cloud, em Billing > Budgets &
alerts, cria um orçamento (por exemplo 5 euros/mês) com alertas a 50%,
90% e 100%. Assim o custo nunca dispara sem aviso.

Fallback: sem chave, sem rede, ou com os limites atingidos, a app mostra
sempre a leitura por padrões e uma mensagem simpática. Nunca fica sem
resposta.

### Ambiente sonoro

Coloca seis mp3 leves e em loop em `src/assets/ambient/` com os nomes
`rio.mp3`, `mata.mp3`, `mar.mp3`, `chuva.mp3`, `lareira.mp3`,
`galaxia.mp3` (fontes livres para uso comercial sem atribuição, por
exemplo Pixabay ou CC0). Sem ficheiro, a opção aparece indisponível.
Começa sempre desligado e baixa quando a voz fala.

### Limitações conhecidas

- O registo de leituras vive no localStorage do dispositivo (limite
  prático de algumas centenas de leituras; a app guarda as 200 mais
  recentes).
- O limite diário mostrado na app é indicativo; o que conta é o do proxy.
