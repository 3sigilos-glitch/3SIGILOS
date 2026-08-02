-- SINAL, semente do espaco da casa
-- Correr uma vez, depois de os dois utilizadores terem entrado pelo
-- menos uma vez (para existirem em perfis).
--
-- Passos:
-- 1. Descobre os ids dos dois utilizadores:
--      select id, nome from perfis;
-- 2. Cria o espaco com o id do calendario partilhado da casa.
-- 3. Junta os dois membros.
--
-- Substitui os valores entre <> antes de correr.

-- 1. Criar o espaco
insert into espacos (nome, calendario_google_id)
values ('Casa', '<ID_DO_CALENDARIO_PARTILHADO_DA_CASA>')
returning id;
-- guarda o id devolvido, e usa em baixo como <ESPACO_ID>

-- 2. Juntar os dois membros
-- insert into espaco_membros (espaco_id, user_id) values
--   ('<ESPACO_ID>', '<USER_ID_PESSOA_1>'),
--   ('<ESPACO_ID>', '<USER_ID_PESSOA_2>');
