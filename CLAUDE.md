# CLAUDE.md

Ficheiro de contexto para o Claude Code. Ler no inicio de cada sessao.

## Instrucoes de eficiencia

- Antes de escrever codigo, mostra sempre um plano ou lista de ficheiros a alterar e espera confirmacao.
- Divide o trabalho em tarefas pequenas e fechadas (uma funcionalidade ou um ficheiro de cada vez), nunca "constroi a app toda de uma vez".
- Le este ficheiro no inicio de cada sessao para relembrar decisoes ja tomadas sobre este projeto (stack, convencoes, particularidades).
- Junta correccoes pequenas num unico pedido quando nao dependem umas das outras, em vez de pedidos isolados repetidos.
- Faz commits pequenos e frequentes, com mensagens claras, e mantem a branch principal sempre estavel.
- Este projeto e usado apenas em Android (sem dispositivos iOS), tem isso em conta em qualquer decisao de UI ou PWA.

## Lingua e escrita

- Tudo em portugues europeu (PT-PT), no codigo, nos comentarios, nos commits e nas respostas.
- Nunca usar travessao em nenhum output.
- Respostas directas, sem rodeios.
- Avisar antes de executar tarefas pesadas ou demoradas.

## Este projeto

**Tarot by 3SIGILOS**: PWA de tarot Rider-Waite em portugues europeu, instalavel no telemovel.

- Stack: React 18, TypeScript, Vite, React Router, Framer Motion, vite-plugin-pwa. Deploy no Vercel.
- `source/tarot-rider-waite.html` e a fonte de verdade dos dados; `scripts/extract-data.mjs` extrai e valida as 78 cartas para `src/data/cards.json`. Nao editar o JSON a mao.
- `npm run build` corre a extraccao antes do build.
- Imagens: gravuras de Pamela Colman Smith (1909), dominio publico, do Wikimedia Commons.
- Estetica de grimorio a luz de vela: tinta escura, ouro velho, pergaminho, serif de livro.
- Ver o README para o estado real do projeto e para as armadilhas ja conhecidas.
