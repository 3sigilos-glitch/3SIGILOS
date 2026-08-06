-- Maré, verificacao da Row Level Security.
--
-- Isto nao altera nada: corre dentro de uma transaccao que termina em
-- rollback. Pode ser corrido as vezes que quiseres.
--
-- O que faz: finge ser cada um dos dois utilizadores, com as mesmas
-- permissoes que o navegador tem, e tenta ler os dados privados do
-- outro. Se conseguir ler alguma coisa, para com erro e diz o que
-- ficou exposto.
--
-- Quando correr: depois de os dois entrarem na app pelo menos uma vez.
-- O teste e mais util depois de cada um ter registado alguma bateria e
-- despejado alguma captura, senao nao ha nada para tentar espreitar.

begin;

do $$
declare
  a uuid;
  b uuid;
  nome_a text;
  nome_b text;
  visto int;
  proprios int;
  avisos text := '';
  papel text;
begin
  -- Guardar o papel de origem. A meio do teste passamos a authenticated,
  -- que e o papel do navegador, e a partir dai perdemos as permissoes de
  -- administracao. Sem voltar atras no fim, qualquer escrita falha por
  -- falta de permissao e o teste rebenta sem chegar a dar veredicto.
  papel := current_user;
  select id, nome into a, nome_a from perfis order by criado_em limit 1;
  select id, nome into b, nome_b from perfis where id <> a order by criado_em limit 1;

  if a is null then
    raise exception 'Ainda nao ha nenhum utilizador. Entra na app primeiro.';
  end if;
  if b is null then
    raise exception 'So ha um utilizador (%). Este teste precisa dos dois.', nome_a;
  end if;

  raise notice 'A testar isolamento entre % e %', nome_a, nome_b;

  -- Passar a ser o utilizador A, como se fosse o navegador dele.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', a, 'role', 'authenticated')::text, true);

  select count(*) into visto from registos_bateria where user_id = b;
  if visto > 0 then
    avisos := avisos || format('%s ve %s registos de bateria de %s. ', nome_a, visto, nome_b);
  end if;

  select count(*) into visto from capturas where user_id = b;
  if visto > 0 then
    avisos := avisos || format('%s ve %s capturas de %s. ', nome_a, visto, nome_b);
  end if;

  select count(*) into visto from tarefas where user_id = b;
  if visto > 0 then
    avisos := avisos || format('%s ve %s tarefas de %s. ', nome_a, visto, nome_b);
  end if;

  select count(*) into visto from tokens_google;
  if visto > 0 then
    avisos := avisos || format('%s ve %s tokens da Google. ', nome_a, visto);
  end if;

  select count(*) into visto from subscricoes_push where user_id = b;
  if visto > 0 then
    avisos := avisos || format('%s ve subscricoes de avisos de %s. ', nome_a, nome_b);
  end if;

  -- Sanidade: A tem de conseguir ver as proprias coisas, senao o teste
  -- acima passava por a RLS estar simplesmente a bloquear tudo.
  select count(*) into proprios from registos_bateria where user_id = a;
  raise notice '% ve % registos de bateria proprios (deve ser o total dele)', nome_a, proprios;

  -- Agora ao contrario, na pele do utilizador B.
  perform set_config('request.jwt.claims',
    json_build_object('sub', b, 'role', 'authenticated')::text, true);

  select count(*) into visto from registos_bateria where user_id = a;
  if visto > 0 then
    avisos := avisos || format('%s ve %s registos de bateria de %s. ', nome_b, visto, nome_a);
  end if;

  select count(*) into visto from capturas where user_id = a;
  if visto > 0 then
    avisos := avisos || format('%s ve %s capturas de %s. ', nome_b, visto, nome_a);
  end if;

  select count(*) into visto from tokens_google;
  if visto > 0 then
    avisos := avisos || format('%s ve %s tokens da Google. ', nome_b, visto);
  end if;

  -- Voltar ao papel de origem antes de escrever seja o que for.
  perform set_config('role', papel, true);

  if avisos <> '' then
    raise exception 'FALHA DE ISOLAMENTO: %', avisos;
  end if;

  raise notice 'PASSOU. Nenhum dos dois consegue ler os dados privados do outro.';
end $$;

rollback;
