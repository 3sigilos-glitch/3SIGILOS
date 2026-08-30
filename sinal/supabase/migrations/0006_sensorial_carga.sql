-- A escala sensorial passa a medir carga, nao bateria.
--
-- Ate aqui as duas colunas usavam a mesma escala: 1 mau, 5 bom. Isso
-- estava errado do lado sensorial. Sensorialmente nao ha bateria que se
-- gaste, ha estimulo que entra: um dia mau e um dia com muito ruido,
-- muita luz, muita gente. Escrever 5 nesse dia e o que a pessoa faz
-- naturalmente, e a app estava a guardar isso como "sensorial cheia",
-- ou seja, um bom dia.
--
-- A coluna mantem se, o significado inverte se:
--   1 = calmo        5 = saturado
--
-- Os registos ja gravados foram respondidos com a escala antiga, por
-- isso tem de ser virados: 1 passa a 5, 2 a 4, 3 fica, e assim por
-- diante. Sem isto, a semana passada e a proxima ficavam no mesmo
-- grafico a dizer coisas opostas.

-- Registo do que ja foi aplicado. Isto existe para o caso de alguem
-- correr o ficheiro duas vezes: virar duas vezes desfazia a correccao,
-- em silencio e sem erro nenhum, que e a pior maneira de perder dados.
create table if not exists migracoes_aplicadas (
  nome text primary key,
  aplicada_em timestamptz not null default now()
);

alter table migracoes_aplicadas enable row level security;
-- Sem politicas: so o service role lhe toca. Ninguem precisa de a ler
-- pela aplicacao.

do $$
begin
  if not exists (
    select 1 from migracoes_aplicadas where nome = '0006_sensorial_carga'
  ) then
    update registos_bateria set sensorial = 6 - sensorial;
    insert into migracoes_aplicadas (nome) values ('0006_sensorial_carga');
    raise notice 'Escala sensorial invertida nos registos existentes.';
  else
    raise notice 'Ja tinha sido aplicada. Nada a fazer.';
  end if;
end $$;
