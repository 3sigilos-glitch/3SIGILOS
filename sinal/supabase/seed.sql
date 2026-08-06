-- Maré, semente do espaco da casa.
--
-- Correr depois de pelo menos uma pessoa ter entrado na app, para
-- existir em perfis. Pode ser corrido as vezes que forem precisas: nao
-- duplica o espaco nem os membros, so acrescenta quem falta. Quando a
-- segunda pessoa entrar, correr de novo.

-- 1. Criar o espaco "Casa", se ainda nao existir
insert into espacos (nome)
select 'Casa'
where not exists (select 1 from espacos where nome = 'Casa');

-- 2. Juntar ao espaco toda a gente que ja entrou na app
insert into espaco_membros (espaco_id, user_id)
select e.id, p.id
from espacos e, perfis p
where e.nome = 'Casa'
on conflict do nothing;

-- 3. Mostrar quem ficou dentro
select p.nome
from espaco_membros m
join perfis p on p.id = m.user_id;


-- ============================================================
-- Calendario partilhado, passo separado
-- ============================================================
-- So depois de existir o calendario da casa no Google, partilhado com
-- as duas contas pessoais com permissao de fazer alteracoes a eventos.
-- O id do calendario ve se nas definicoes desse calendario, e costuma
-- ter o aspecto de um email a acabar em @group.calendar.google.com
--
-- Sem isto, tudo funciona excepto marcar obrigacoes com data.
--
-- update espacos
--    set calendario_google_id = 'COLAR_AQUI_O_ID_DO_CALENDARIO'
--  where nome = 'Casa';
