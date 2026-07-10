# Tarot by 3SIGILOS

Web app de consulta das 78 cartas do Tarot Rider-Waite, em português europeu.
Grimório moderno: tinta-noite, dourado velho, pergaminho. PWA instalável no
Android e no iOS, funciona offline depois da primeira utilização.

Os textos das cartas vivem em `source/tarot-rider-waite.html` (fonte de
verdade). O script `scripts/extract-data.mjs` extrai-os para
`src/data/cards.json` e valida que saem exactamente 78 cartas completas.
As imagens são as gravuras de 1909 de Pamela Colman Smith, em domínio
público, servidas pelo Wikimedia Commons.

## Comandos

```bash
npm install        # primeira vez
npm run dev        # abre a app em http://localhost:5173
npm run build      # valida os dados e compila para dist/
npm run preview    # serve o build final localmente
npm run extract    # só re-extrai os dados do HTML
```

Para actualizar um texto de uma carta: edita `source/tarot-rider-waite.html`
e corre `npm run extract` (ou simplesmente `npm run build`, que já o faz).

## Publicar no Vercel (recomendado)

Passo a passo, sem precisar de saber programar:

1. Cria conta em https://vercel.com (podes entrar com o GitHub).
2. Carrega em **Add New… > Project** e escolhe o repositório **3SIGILOS**.
3. O Vercel detecta Vite sozinho. Não mexas em mais nada.
4. Carrega em **Deploy** e espera um minuto.
5. No fim recebes um link do tipo `https://3sigilos-xxxx.vercel.app`. É esse
   que partilhas. Podes mudar o nome em **Settings > Domains**.

A partir daí, cada `git push` ao ramo principal publica sozinho.

## Alternativa: GitHub Pages

O build precisa de caminhos relativos ao repositório:

```bash
GHPAGES=1 npm run build
```

Depois publica a pasta `dist/` no ramo `gh-pages` (por exemplo com
`npx gh-pages -d dist`). O Vercel é mais simples: usa o Vercel.

## Instalar no telemóvel

- **Android (Chrome)**: abre o link, menu de três pontos, "Adicionar ao ecrã
  principal" ou "Instalar aplicação".
- **iPhone (Safari)**: abre o link, botão de partilha, "Adicionar ao ecrã
  principal".
