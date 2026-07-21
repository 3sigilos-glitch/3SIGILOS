# Magia Nórdica · Runas

Aplicação web de referência e prática para o curso de Magia Nórdica
(Módulo Branco). Ferramenta de estudo e de uso durante os atendimentos,
pensada para o telemóvel em primeiro lugar.

## Direção visual "Nórdica mística" (redesign)

Estética escura com aurora boreal animada ao fundo, dourado envelhecido
(#c9a86a) como acento, velas que tremeluzem com glow, glifos rúnicos
reais (Noto Sans Runic, com normalização de tamanho por canvas) e
tipografia Cinzel (títulos, navegação) + EB Garamond (corpo).
Navegação no header sticky com blur. Animações respeitam
prefers-reduced-motion. Tokens completos em app/globals.css.

## Ecrãs (5 separadores na navegação do header)

1. **Runas**: grelha de cartões com glifo dourado e marca-de-água,
   pesquisa (por qualquer um dos dois nomes, regente ou palavra-chave,
   insensível a acentos) e filtros por classe, elemento, pólo e
   intenção. As descrições de armas e seres vivem na ficha da runa.
2. **Matriz**: a grelha 9x3 (elementos x pólos). O Odin, tríade, ocupa
   as três células que faltam e a matriz fecha certa.
3. **Altar**: procedimento de atendimento (8 passos para marcar),
   evocações preenchidas automaticamente (tipo + regente), determinações
   e mudras.
4. **Templo**: o Montador de Templo. De 2 a 9 runas, escudo de geometria
   sagrada (linha, triângulo, quadrado, pentagrama, estrela de seis,
   estrelas de 7 a 9 pontas) com a cor da vela em cada vértice e o
   cálice ao centro.
5. **Guardados**: favoritos e notas pessoais, persistentes no
   dispositivo.

## Regras do sistema (a matriz)

- Cor da vela = cor do elemento do regente.
- Pólo define a classe: Irradiador = Guerreiro (vermelho),
  Neutro = Sacerdote (branco), Absorvedor = Mago (preto).
- Odin/Wyrd é tríade: Cristalino, Vazio e Temporal, três velas
  (branca, preta, roxa), classe Híbrido (cinza).
- Nome em destaque: o do Eduardo (anglo-saxónico). Por baixo, o nome
  moderno (Elder Futhark). A pesquisa encontra pelos dois.

## Arquitetura

```
app/          ecrãs (/, /matriz, /altar, /templo, /guardados)
components/   AppShell, BottomNav, Sheet (ficha), RuneCard, RuneGlyph, ...
lib/          dados tipados e regras:
              runes.ts, weapons.ts, beings.ts, elements.ts,
              evocations.ts (fórmulas), geo.ts (traços SVG das runas),
              temple.ts (templeShape), maps.ts (cores), rules.ts,
              useStore.ts (persistência em localStorage)
```

Os dados vêm tal e qual do protótipo `runas-app-prototipo.html`
(fonte de verdade); as correspondências não foram alteradas. A estrutura
aceita os Módulos Vermelho e Preto sem reescrever nada (campo `module`
em runas, armas e seres). A persistência está isolada no hook
`useStore`, pronta a trocar por Supabase sem mexer nos ecrãs.

## Correr localmente

```bash
cd runas
npm install
npm run dev      # abre em http://localhost:3000
npm run build    # compila e valida os tipos
```

## Publicar (Vercel)

Projeto Vercel próprio, separado da app de Tarot na raiz do repositório:
ao criar o projeto, define **Root Directory = `runas`**. O resto é
automático (framework Next.js detetado).
