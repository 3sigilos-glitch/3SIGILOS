# Telemetria S203

Painel de instrumentos digital para um Mercedes S203 (Classe C carrinha, 2001),
lido por OBD2 atraves de um adaptador ELM327 Bluetooth LE, com Web Bluetooth.
React, SVG e TailwindCSS. Corre no browser, sem servidor.

O ecra arranca sempre em simulacao, com os ponteiros a mexer, para se poder
trabalhar no design sem o carro a frente.

## Viabilidade: le isto antes de comprar seja o que for

Tres verificacoes independentes. Duas passam, uma nao.

### 1. A app e o OBD2: viavel, com ressalvas

O W203 de 2001 fala EOBD por K-line, protocolo ISO 9141-2 ou KWP2000
(ISO 14230-4), nao CAN. O CAN so chega ao diagnostico da Mercedes mais tarde.
Consequencia pratica: a K-line anda a 10.4 kbit/s e cada pergunta leva 40 a
120 ms de ida e volta. Nao ha maneira de ter tres PIDs a 5 Hz cada.

O que se consegue de verdade sao 4 a 10 respostas por segundo no total. Por
isso o polling desta app e uma fila unica com prioridades: rotacoes e
velocidade alternam, a temperatura entra de cinco em cinco voltas, e o painel
mostra a taxa real medida, em Hz, no rodape. Com `ATAT2` (temporizacao
adaptativa) ganha-se bastante.

Ressalva do motor:

- **C200 Kompressor (gasolina)**: o EOBD e obrigatorio na UE para gasolina
  desde 1 de Janeiro de 2001. Deve responder aos PIDs `010C`, `010D` e `0105`.
- **C200 CDI (diesel)**: o EOBD so passou a ser obrigatorio para diesel em
  2003 (modelos novos) e 2004 (todos os novos). Um CDI de 2001 pode responder
  a poucos PIDs genericos, ou a nenhum. A app aguenta isso: ao fim de tres
  respostas invalidas deixa de perguntar por esse PID e mostra `--` em vez de
  inventar um valor.

Se nao souberes qual dos dois tens, abre a app, liga e olha para a consola
(botao **Diag**): ela mostra o dialogo cru com a centralina.

### 2. O adaptador: tem de ser BLE, nao serve Bluetooth classico

A Web Bluetooth API so fala GATT, ou seja Bluetooth Low Energy. Os ELM327
baratos de "Bluetooth classico" (perfil SPP) emparelham com o telemovel mas
sao invisiveis para o Chrome. Nao ha volta a dar por software.

E preciso um adaptador BLE 4.0 ou superior. Servem, por exemplo, o Vgate iCar
Pro BLE, o Veepeak OBDCheck BLE e o OBDLink CX. A app conhece os quatro perfis
de servico UART mais usados e, se nao reconhecer nenhum, o botao **Ver todos**
abre o selector sem filtros e a app procura sozinha um servico com canais de
escrita e de notificacao.

Cuidado com um pormenor pratico: muitos dongles baratos ficam a consumir
corrente com a ignicao desligada e dao cabo da bateria. Tira o dongle quando
nao estiveres a usar.

### 3. Projectar no Atoto via Android Auto: isto nao funciona

O Android Auto nao espelha o ecra do telemovel e nao tem browser. So corre
aplicacoes das categorias que a Google aprova (navegacao, media, mensagens,
pontos de interesse). Nao ha forma suportada de por uma pagina web do Chrome
do Redmi a aparecer no radio por Android Auto.

Acresce que o Redmi Note 13 Pro Plus tem USB-C 2.0 sem DisplayPort alt mode,
ou seja tambem nao ha saida de video por cabo.

Alternativas, por ordem de robustez:

1. **Chrome no proprio radio.** A maioria dos Atoto (S8, A6, F7) corre Android
   com Play Store, e nao apenas Android Auto. Se for o teu caso, instala o
   Chrome no radio, abre la o endereco e liga o radio directamente ao dongle
   BLE. E a solucao limpa: um so aparelho, sem espelhamento. Falta confirmar
   duas coisas no teu modelo: que tem Play Store (e nao so AA/CarPlay) e que
   o Chrome instalado e recente. Nesse caso o dongle emparelha com o radio e
   nao com o telemovel.
2. **Telemovel num suporte.** Funciona sempre, hoje, sem mais nada. O ecra do
   Redmi e melhor que o do radio e a app ja pede o Wake Lock para nao apagar.
3. **Espelhamento nao oficial** (AAAD com Fermata Auto ou Screen2Auto). Exige
   sideload e o modo de programador do Android Auto, a Google tem vindo a
   fechar essa porta a cada versao, e parte com frequencia. Nao recomendo para
   uma coisa que queres usar a conduzir.

Ou seja: a app faz o que lhe pediste, mas o caminho ate ao ecra do radio passa
pelo ponto 1, nao pelo Android Auto.

## O que a app le, e o que nao le

Le, em tempo real: rotacoes (`010C`), velocidade (`010D`), temperatura do
liquido (`0105`), carga do motor (`0104`), acelerador (`0111`), temperatura do
ar admitido (`010F`) e a tensao da bateria (`ATRV`).

Le, a pedido, no botao **Codigos**: o estado da luz do motor (`0101`), os
codigos guardados (modo 03), os pendentes (modo 07), e apaga-os (modo 04, com
dupla confirmacao, porque apagar limpa tambem os monitores de prontidao e o
carro chumba na inspeccao ate voltar a rodar umas dezenas de quilometros).

**Nao le o ESP, nem o ABS, nem o BAS, nem o airbag, nem os modulos SAM.** O
OBD2 normalizado so obriga a expor o que diz respeito a emissoes, que e motor
e caixa, com codigos P. No W203 o ESP e uma unidade Bosch separada no
barramento CAN interno da Mercedes, com codigos C que se leem por protocolo
proprietario. Para esses e preciso XENTRY/DAS, um iCarsoft MB II ou
equivalente. Nenhum ELM327 generico la chega, por muito que a luz do ESP
esteja acesa no painel. A consola **Diag** aceita comandos a mao (`ATSH`, por
exemplo) se quiseres experimentar, mas e terreno sem garantias.

## Correr e publicar

```bash
npm install
npm run dev     # desenvolvimento (o Bluetooth so funciona em https ou localhost)
npm test        # parser OBD2, descodificacao de DTC e driver ELM327 simulado
npm run build   # producao, para dist/
```

Deploy no Vercel: importa o repositorio e poe **Root Directory** em
`telemetria`. O `vercel.json` desta pasta ja trata do resto. O Web Bluetooth
exige https, que o Vercel da de borla.

No Chrome do Android ainda e preciso: dar a permissao de **Dispositivos
proximos** ao Chrome, ter o Bluetooth ligado e, em Android 11 ou anterior, ter
tambem a localizacao ligada. Nao funciona no Firefox nem no browser do MIUI.

## Estrutura

```
src/
  lib/elm327.js      driver Web Bluetooth: descoberta, fila de comandos, prompt ">"
  lib/obd.js         PIDs, limpeza da resposta e formulas OBD2
  lib/dtc.js         codigos de avaria e descricoes
  lib/mock.js        simulador de conducao
  hooks/useTelemetry.js  ciclo de polling, estado e gestao da ligacao
  components/        mostradores SVG, barra de topo e paineis
test/                testes do parser e do driver, com um ELM327 simulado
```

## Ao volante

Nao mexas nisto a conduzir. E um mostrador, nao um brinquedo para carregar em
botoes a 120 na A1.
