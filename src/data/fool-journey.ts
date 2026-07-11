// Narrativa da Jornada do Louco, os 22 Arcanos Maiores por ordem, do 0 ao XXI.
// PT-PT. Sem travessões. Cada capítulo tem: roman, cardEn (chave igual à de CARDS),
// title (título da etapa) e text (narrativa para ler e ouvir).
// Nota para integração: se a interface do projeto já usar nomes de campos diferentes,
// mantém a tua e mapeia estes; o que interessa é o conteúdo e a ordem.

export interface FoolChapter {
  roman: string;
  cardEn: string;
  title: string;
  text: string;
}

export const FOOL_JOURNEY: FoolChapter[] = [
  {
    roman: "0",
    cardEn: "The Fool",
    title: "O Primeiro Passo",
    text: `No princípio há o Louco, e o Louco somos nós. Parte com uma trouxa leve ao ombro e uma rosa branca na mão, o rosto voltado para o céu e o pé quase sobre o abismo. Não sabe o que o espera, e é essa a sua força: caminha por fé, aberto a tudo aprender. Todos os que vai encontrar já vivem dentro de si, à espera de despertar. A jornada começa com um salto de confiança.`
  },
  {
    roman: "I",
    cardEn: "The Magician",
    title: "A Vontade Desperta",
    text: `O primeiro que o Louco encontra é o Mago, com um braço apontado ao céu e outro à terra. Diante dele estão os quatro naipes, todos os recursos do mundo, e o Mago revela-lhe o primeiro segredo: tens vontade, e com ela podes criar. O Louco descobre que não é folha ao vento, mas canal entre o alto e o baixo, capaz de transformar intenção em gesto. Aprende que o poder de manifestar já lhe pertence.`
  },
  {
    roman: "II",
    cardEn: "The High Priestess",
    title: "O Limiar do Mistério",
    text: `A seguir surge a Sacerdotisa, sentada entre duas colunas, guardiã de um véu bordado. Se o Mago ensinou a agir, ela ensina a escutar. Mostra ao Louco que há um saber que não passa pela razão, que mora no silêncio, nos sonhos e na intuição. Nem tudo se força ou se explica: algumas verdades só se revelam a quem sabe esperar. O Louco aprende a confiar na sua voz interior.`
  },
  {
    roman: "III",
    cardEn: "The Empress",
    title: "O Colo do Mundo",
    text: `O caminho leva o Louco ao jardim da Imperatriz, a grande Mãe, rodeada de trigo maduro e água viva. Nela conhece a abundância, o prazer dos sentidos, o amor que nutre e faz crescer. Aprende a criar não pela força, mas pelo cuidado, como quem semeia e deixa florescer. É a descoberta do corpo, da ternura e da fartura da vida.`
  },
  {
    roman: "IV",
    cardEn: "The Emperor",
    title: "A Ordem e o Pai",
    text: `Depois do colo materno, o Louco encontra o Imperador, o Pai, firme no seu trono de pedra. Onde a Imperatriz criava, ele ordena: dá-lhe estrutura, lei e limite. O Louco aprende que a liberdade precisa de forma, que construir exige disciplina e responsabilidade. Recebe o dom de organizar o caos e de erguer fundações sólidas.`
  },
  {
    roman: "V",
    cardEn: "The Hierophant",
    title: "A Voz da Tradição",
    text: `O Louco chega então ao Hierofante, o mestre que guarda a tradição. Com ele descobre os valores partilhados, os ritos, o saber que uma comunidade transmite de geração em geração. Aprende que pertence a algo maior do que si, e que há caminhos já trilhados que o podem guiar. Mais tarde escolherá o que honrar e o que questionar, mas primeiro precisa de os conhecer.`
  },
  {
    roman: "VI",
    cardEn: "The Lovers",
    title: "A Primeira Escolha",
    text: `Adiante, o Louco vive o encontro dos Enamorados, e com ele o amor e a primeira grande escolha. Descobre a atração, a união de opostos que se completam, e percebe que amar é também decidir. Diante das opções, aprende que escolher segundo os seus valores é começar a definir quem é. Nenhuma decisão do coração o deixa igual ao que era.`
  },
  {
    roman: "VII",
    cardEn: "The Chariot",
    title: "A Partida",
    text: `Fortalecido, o Louco sobe ao Carro e parte pela primeira vez por conta própria. Guia duas forças opostas e obriga-as a seguir na mesma direção, apenas pela força da vontade. É a afirmação do eu, a vitória conquistada pelo foco e pela determinação. Mas ainda vence por domínio exterior, e a vida vai ensiná-lo que há uma força mais funda.`
  },
  {
    roman: "VIII",
    cardEn: "Strength",
    title: "A Força Serena",
    text: `No caminho, o Louco encontra a Força, uma figura serena que fecha a boca do leão com mãos suaves. Aprende a maior das lições sobre o poder: a verdadeira força não é violência, é a coragem tranquila que doma o instinto com paciência e amor. Descobre que o que se vence pela ternura fica vencido de vez. O domínio de si substitui o domínio das coisas.`
  },
  {
    roman: "IX",
    cardEn: "The Hermit",
    title: "O Recolhimento",
    text: `Cansado do mundo, o Louco retira-se e torna-se o Eremita, lanterna na mão, no alto de um monte. Longe do ruído, procura o sentido no silêncio e descobre que a luz de que precisava era interior. É tempo de introspecção, de olhar para dentro sem pressa. Quando voltar, trará consigo uma sabedoria que só a solidão lhe podia dar.`
  },
  {
    roman: "X",
    cardEn: "Wheel of Fortune",
    title: "A Roda que Gira",
    text: `De regresso, o Louco vê a Roda da Fortuna girar. Aprende que a vida se move em ciclos, que há forças maiores do que a sua vontade, e que a sorte sobe e desce sem pedir licença. Percebe que resistir à mudança é sofrer em vão, e que a sabedoria está em fluir com o movimento. Nem sempre conduz a roda, mas pode escolher como a atravessa.`
  },
  {
    roman: "XI",
    cardEn: "Justice",
    title: "O Peso dos Atos",
    text: `A Roda leva-o à Justiça, de espada e balança. Ali o Louco compreende a lei da causa e do efeito: tudo o que fez tem consequências, e é chamado a assumi-las. Aprende a pesar com verdade, a agir com integridade e a responsabilizar-se pelo que semeou. É um momento de honestidade profunda consigo mesmo.`
  },
  {
    roman: "XII",
    cardEn: "The Hanged Man",
    title: "A Suspensão",
    text: `Então o Louco para, e torna-se o Enforcado, suspenso de cabeça para baixo. Deixa de lutar e rende-se, e ao ver o mundo do avesso encontra uma nova perspetiva. Aprende que há alturas em que avançar é ficar quieto, e que se ganha visão sacrificando o velho olhar. É uma pausa fértil, o silêncio antes de uma grande mudança.`
  },
  {
    roman: "XIII",
    cardEn: "Death",
    title: "A Grande Passagem",
    text: `Da suspensão nasce a Morte, que raramente é literal. O Louco atravessa o fim de um ciclo, deixa morrer o que já cumpriu o seu tempo e liberta-se do que o prendia ao passado. É doloroso e é necessário, tão natural como a mudança das estações. Do que termina abre-se espaço para o que ainda vai nascer.`
  },
  {
    roman: "XIV",
    cardEn: "Temperance",
    title: "A Justa Medida",
    text: `Depois da passagem, surge a Temperança, um anjo que verte a água entre duas taças. O Louco aprende a arte de conciliar opostos, a temperar os excessos e a encontrar a justa medida. É a cura serena que se segue à perda, a alquimia paciente que integra o que estava separado. Reencontra o equilíbrio, agora mais sábio.`
  },
  {
    roman: "XV",
    cardEn: "The Devil",
    title: "O Encontro com a Sombra",
    text: `O caminho leva o Louco a enfrentar o Diabo, e com ele a sua própria sombra. Vê os apegos, os vícios e os medos, e percebe que as correntes que o prendem estão largas: foi ele que as apertou. Reconhecer a jaula é o princípio da liberdade. Só quem olha a sua sombra de frente lhe pode escapar.`
  },
  {
    roman: "XVI",
    cardEn: "The Tower",
    title: "O Raio que Liberta",
    text: `De súbito, um raio atinge a Torre e tudo o que estava mal fundado desmorona. O Louco vê ruir as estruturas falsas que a ilusão sustentava, e o choque, ainda que doloroso, limpa o terreno. É uma revelação que destrói para libertar. Sobre a verdade nua, poderá finalmente reconstruir.`
  },
  {
    roman: "XVII",
    cardEn: "The Star",
    title: "A Esperança Renovada",
    text: `Depois do desabamento, o céu abre-se na Estrela. O Louco, nu e sem defesas, ajoelha-se junto à água e sente a esperança regressar. É a cura, a fé renovada, a serenidade de quem se reconcilia com a vida e com o alto. Depois de tudo cair, aprende que a luz nunca se apagou de todo.`
  },
  {
    roman: "XVIII",
    cardEn: "The Moon",
    title: "A Travessia da Noite",
    text: `A esperança guia-o, mas o caminho atravessa a Lua, o território dos medos e das ilusões. O Louco avança pela noite do subconsciente, entre o que é real e o que a imaginação distorce, sem poder ver com clareza. Aprende a confiar no instinto quando as certezas faltam. Quem atravessa a própria noite chega mais forte à manhã.`
  },
  {
    roman: "XIX",
    cardEn: "The Sun",
    title: "O Regresso da Luz",
    text: `Vencida a noite, ergue-se o Sol, e com ele a alegria e a clareza. O Louco redescobre a vitalidade simples, a verdade que brilha sem se esconder, a confiança de uma criança em pleno jardim. É um dos momentos mais luminosos da viagem. Depois de tanto, volta a sentir a felicidade genuína de existir.`
  },
  {
    roman: "XX",
    cardEn: "Judgement",
    title: "O Chamado",
    text: `Quase no fim, o Louco ouve o Julgamento, a trombeta que o chama a despertar. Olha para trás e avalia o percurso com honestidade, perdoa e perdoa-se, e sente-se convocado a erguer-se para uma consciência maior. É um renascimento, a resposta a uma vocação que já não pode ignorar. Reconhece quem se tornou ao longo do caminho.`
  },
  {
    roman: "XXI",
    cardEn: "The World",
    title: "A Totalidade",
    text: `E assim o Louco chega ao Mundo, dançando dentro da coroa de louros, com os quatro elementos a testemunhar. O ciclo completou-se: tudo o que viveu integrou-se numa totalidade serena. Alcança a plenitude, o sentido de estar inteiro e no lugar certo. E porque toda a chegada é também um começo, o Louco prepara-se para partir de novo, noutro nível, com o primeiro passo sempre a recomeçar.`
  }
];
