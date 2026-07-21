import type { Weapon } from "./types";

// As 9 armas mitologicas. `rune` e o id da runa que abre a arma.
export const WEAPONS: Weapon[] = [
  { n: "Espada Mágica de Freyr", epi: "Espada do Brilho Estrelar", deity: "Freyr", rune: 0,
    d: "Espada de vontade própria; rompe os cordões que drenam a energia vital e combate seres negativos. Costuma durar de 7 a 9 dias.", module: "branco" },
  { n: "Arco e Flecha Élfico", epi: "Rajadas de Luz", deity: "Freyr", rune: 0,
    d: "Cria um elo entre a pessoa e um Deus, ou desfaz emaranhados energéticos de origem emocional.", module: "branco" },
  { n: "Martelo Mjolnir", epi: "O Fiel Martelo dos Raios", deity: "Thorn", rune: 2,
    d: "Nunca abandona o dono; desfere raios e é fulminante contra o astral inferior.", module: "branco" },
  { n: "Cinturão Megingjard", epi: "A Força de Thorn", deity: "Thorn", rune: 2,
    d: "Envolve o corpo espiritual numa áurea que intensifica e expande a atuação. Fica sempre a 10 por cento.", module: "branco" },
  { n: "Espada Balmung", epi: "O Fio Perfeito", deity: "Siegfried", rune: 4,
    d: "Corta cordões, correntes e amarrações. Na vertente passiva, cicatriza e cura.", module: "branco" },
  { n: "Armadura dos Dragões", epi: "A Couraça Impenetrável", deity: "Siegfried", rune: 4,
    d: "Escamas que absorvem qualquer elemento e fortalecem quem a usa. Proteção de 9 a 99 dias.", module: "branco" },
  { n: "Colar de Brisingamen", epi: "A mais bela das Jóias", deity: "Freya", rune: 6,
    d: "Torna o corpo espiritual dourado; magnetismo que atrai o benéfico e repele o hostil. Cerca de 9 dias.", module: "branco" },
  { n: "Espada Hofund", epi: "Lâmina dos Sentidos", deity: "Heimdall", rune: 14,
    d: "Detecta impurezas e atua nos sentidos espirituais; rompe o que impede o contato com os guias.", module: "branco" },
  { n: "Lança Gungnir", epi: "Alcance Certeiro", deity: "Odin", rune: 24,
    d: "Representa as Runas; alcança realidades paralelas de onde vem o negativo e anula-o.", module: "branco" },
];

export const weaponByName = (n: string): Weapon | undefined =>
  WEAPONS.find((w) => w.n === n);
