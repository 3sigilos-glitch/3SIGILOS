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
--
-- Decisao tomada: estes calendarios sao partilhados apenas com "Ver
-- todos os detalhes do evento", nunca com permissao de alteracao.
--
-- A separacao entre escrever e ler ja existe no codigo, ha um so sitio
-- que cria eventos e vai sempre buscar o id a calendario_google_id. Mas
-- essa garantia depende do codigo estar certo, e o ambito que a Google
-- concede (calendar.events) permitiria escrever em qualquer calendario
-- que a conta alcance. Partilhando so em leitura, a impossibilidade
-- passa a ser imposta pela Google e deixa de depender de mim.
--
-- Custo aceite: para juntar um evento a estes calendarios e preciso
-- entrar na conta que os detem.

alter table espacos
  add column if not exists calendarios_vista text[] not null default '{}';
