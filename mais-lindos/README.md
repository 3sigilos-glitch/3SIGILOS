# Os Mais Lindos

Jogo social de missões secretas para jogar presencialmente, em casa, entre
amigos, num fim de semana. É um Cluedo ao contrário: em vez de descobrir quem
fez o quê e onde, é fazer acontecer.

Cada jogador cria as suas missões, uma a uma. Uma missão é sempre a mesma
combinação:

> **Quem** (outro jogador) · **Onde** (espaço da casa) · **Pega em** (objecto)

Ganha-se a missão quando a pessoa-alvo pega naquele objecto naquele espaço
sem desconfiar que está a cumprir a missão de alguém.

## O que a app faz

- **Missões privadas de verdade.** As missões de cada jogador nunca são
  enviadas para os telemóveis dos outros: o servidor redige a resposta por
  jogador. Não é esconder no ecrã, é não sair da base de dados.
- **Uma missão de cada vez.** Botão "Nova missão", com escolha entre normal
  (1 ponto) e difícil (2 pontos). Sem limite de quantas difíceis se pedem: a
  responsabilidade é de quem pede.
- **Regras garantidas no servidor:** o alvo nunca é o próprio jogador e nunca
  sai a mesma combinação que já se tem em mão.
- **As missões são cartas**, viradas para baixo em cima da mesa. Toca para
  virar, toca outra vez para esconder, e ao fim de 30 segundos viram-se
  sozinhas. As difíceis têm verso preto e latão, as normais encarnado.
- **Contador de apanhado:** cada um vê quantas vezes já foi alvo de uma missão
  cumprida. Nunca vê por quem, onde, nem com o quê.
- **Placar e títulos**, visíveis a todos: Assassino Silencioso, Fantasma, Alvo
  Fácil, Pacifista, Mestre das Difíceis, Coleccionador de Segredos.
- **Administração com PIN:** acrescentar e remover jogadores, espaços e
  objectos a qualquer momento, e marcar quais são difíceis.
- **Estado partilhado:** todos os telemóveis vêem o mesmo jogo, com
  actualização automática de três em três segundos.
- **Ninguém perde a sala:** o telemóvel guarda os últimos oito jogos e
  mostra-os no ecrã de entrada, e o código no topo é um botão que copia a
  ligação do jogo para qualquer jogador, não só para o administrador.

## Como se joga num fim de semana

1. Uma pessoa abre a app, **Criar jogo novo**, escolhe um PIN e escreve os
   nomes. A app arranca com uma casa de exemplo que se muda toda na secção
   Casa.
2. Essa pessoa copia a ligação (Casa > Convidar) e manda para o grupo, ou dita
   o código de quatro letras.
3. Cada um abre, escolhe o seu nome e começa a pedir missões.
4. Quando uma missão acontece, carrega em **Cumprida**. O placar muda em todos
   os telemóveis.

## Arquitectura

```
index.html            página única
estilo.css            folha de estilo
fontes.css, fontes/   Playfair Display e Special Elite, alojadas aqui
app.js                interface e sincronização
logica.js             regras do jogo, funções puras, partilhadas
api/jogo.js           função de servidor (estado partilhado)
servidor-local.mjs    servidor de desenvolvimento
```

O aspecto é de jogo de tabuleiro: feltro verde, fichas em papel, carimbos a
tinta e tipografia de dossiê. Os tipos de letra estão no próprio projecto
(licença SIL Open Font License), por isso a app não chama o Google nem
precisa de rede para se ver bem.

`logica.js` é o mesmo ficheiro dos dois lados: o servidor usa-o para aplicar
as acções, e o browser usa-o no modo local. As regras estão escritas uma vez
só.

## Correr no computador

```bash
node servidor-local.mjs      # abre em http://localhost:5174
```

Para experimentar com telemóveis na mesma rede, usar o IP do computador
(`http://192.168.x.x:5174`).

## Publicar (Vercel)

É um projecto separado do Tarot, na mesma repositório.

1. Vercel > Add New > Project > escolher este repositório.
2. Em **Root Directory** escolher `mais-lindos`. Framework: *Other*. Sem comando
   de build.
3. Storage > criar uma base **Upstash Redis** (plano grátis chega e sobra) e
   ligá-la ao projecto. A Vercel injecta sozinha `KV_REST_API_URL` e
   `KV_REST_API_TOKEN`. Também funciona com `UPSTASH_REDIS_REST_URL` e
   `UPSTASH_REDIS_REST_TOKEN`.
4. Deploy.

Sem base de dados ligada, a app funciona na mesma, mas o jogo vive na memória
da instância e desaparece num reinício. Nesse caso a app avisa no topo do
ecrã. Cada jogo fica guardado 60 dias depois da última alteração.

## Modo local (sem servidor)

No fundo do ecrã de entrada há **Jogar só neste telemóvel**: cria um jogo
inteiro no `localStorage`, com as mesmas regras, para testar ou para jogar
passando o telemóvel de mão em mão. Nada sai do aparelho.

## Limites e decisões

- **Privacidade é de amigos, não de banco.** Cada um escolhe a sua identidade
  numa lista, sem palavra-passe. Quem pegar no telemóvel de outro vê as
  missões dele. Para um fim de semana entre amigos, é o compromisso certo.
- Quem não estiver na lista pode acrescentar-se a si próprio ao entrar. O
  administrador remove depois, se for caso disso.
- O PIN do administrador fica guardado em claro no jogo e no telemóvel de quem
  o usou. Serve para gerir a casa, não para guardar segredos. Por isso o campo
  do PIN não é um campo de password: é texto tapado por CSS, para os gestores
  de passwords do browser não o guardarem nem o compararem com fugas de dados.
  Inventa um número só para o jogo, nunca uses uma password verdadeira.
- Remover um jogador, um espaço ou um objecto apaga as missões **activas** que
  dependiam dele. As cumpridas ficam, porque já contam para o placar.
- Missões difíceis usam os objectos marcados como difíceis. Se houver espaços
  marcados como difíceis, usa-os também; se não houver nenhum, serve qualquer
  espaço.
- Limites por jogo: 24 jogadores, 120 espaços, 200 objectos, 40 missões
  activas por jogador.
