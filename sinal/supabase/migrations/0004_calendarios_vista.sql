-- Maré, calendarios que a app mostra sem escrever neles.
--
-- calendario_google_id continua a ser o unico onde a app escreve, as
-- obrigacoes da casa. Esta lista e so de leitura: serve para ver na app
-- o que ja esta marcado noutro lado, por exemplo o calendario da conta
-- conjunta com concertos, giras e consultas.
--
-- Separado de proposito. A app nunca escreve nestes, por isso um erro
-- meu nunca pode mexer em eventos que nao criou.
--
-- Nota: cada calendario desta lista tem de estar partilhado com as
-- contas pessoais das duas pessoas, senao o token de cada uma nao o
-- consegue ler.

alter table espacos
  add column if not exists calendarios_vista text[] not null default '{}';
