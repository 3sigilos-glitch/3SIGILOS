-- Maré, endurecimento de seguranca.
-- Correr no editor SQL do Supabase depois do 0001 e do 0002.

-- ============================================================
-- 1. Fixar o search_path da funcao e_membro
-- ============================================================
-- e_membro corre como SECURITY DEFINER, ou seja, com os privilegios de
-- quem a criou, e e ela que decide quem ve as tarefas da casa, as
-- decisoes e os sinais. Sem search_path fixo, a resolucao dos nomes das
-- tabelas depende do search_path de quem chama, e quem consiga criar um
-- objecto num esquema anterior na lista pode fazer a funcao ler outra
-- tabela e devolver verdadeiro. Fixamos em public, como ja estava na
-- funcao tratar_novo_utilizador.

create or replace function e_membro(e uuid) returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from espaco_membros m
    where m.espaco_id = e and m.user_id = auth.uid()
  );
$$;

-- ============================================================
-- 2. Sinais expirados deixam de ser legiveis
-- ============================================================
-- O ecra Nos mostra so o sinal activo, sem historico, de proposito: a
-- regra combinada e que ninguem pergunta e ninguem consulta. Mas a
-- politica anterior deixava ler a tabela toda, por isso o historico de
-- todos os dias continuava acessivel a quem falasse com a base de dados
-- directamente. Passamos a regra para a base de dados: um sinal so e
-- legivel enquanto nao expira.
--
-- A aplicacao nao muda, ja filtrava por expira_em.

drop policy if exists sinais_seleccao on sinais;

create policy sinais_seleccao on sinais
  for select using (e_membro(espaco_id) and expira_em > now());
