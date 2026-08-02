-- SINAL, esquema inicial e Row Level Security
-- Fase 0. Aplica isto no editor SQL do Supabase, ou via CLI.
-- Nota de estilo: sem travessao em lado nenhum, nem em comentarios.

create extension if not exists "pgcrypto";

-- ============================================================
-- Tabelas
-- ============================================================

create table perfis (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);

create table espacos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  calendario_google_id text,
  criado_em timestamptz not null default now()
);

create table espaco_membros (
  espaco_id uuid not null references espacos on delete cascade,
  user_id uuid not null references perfis on delete cascade,
  primary key (espaco_id, user_id)
);

create table capturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references perfis on delete cascade,
  espaco_id uuid references espacos on delete set null,
  texto text not null,
  origem text not null default 'voz' check (origem in ('voz','teclado')),
  estado text not null default 'por_triar'
    check (estado in ('por_triar','hoje','um_dia','arquivada')),
  criado_em timestamptz not null default now()
);

create table tarefas (
  id uuid primary key default gen_random_uuid(),
  captura_id uuid references capturas on delete set null,
  user_id uuid not null references perfis on delete cascade,
  titulo text not null,
  passos jsonb not null default '[]'::jsonb,
  iniciada_em timestamptz,
  duracao_alvo_min int not null default 10,
  concluida_em timestamptz,
  criado_em timestamptz not null default now()
);

create table registos_bateria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references perfis on delete cascade,
  social smallint not null check (social between 1 and 5),
  sensorial smallint not null check (sensorial between 1 and 5),
  contexto text[] not null default '{}',
  nota text,
  registado_em timestamptz not null default now()
);

create table sinais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references perfis on delete cascade,
  espaco_id uuid not null references espacos on delete cascade,
  nivel text not null check (nivel in ('verde','amarelo','vermelho')),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '10 hours')
);

create table tarefas_casa (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references espacos on delete cascade,
  titulo text not null,
  criado_por uuid not null references perfis,
  pegou uuid references perfis,
  pegou_em timestamptz,
  concluida_em timestamptz,
  data_limite date,
  evento_google_id text,
  criado_em timestamptz not null default now()
);

create table decisoes (
  id uuid primary key default gen_random_uuid(),
  espaco_id uuid not null references espacos on delete cascade,
  titulo text not null,
  notas text,
  criado_por uuid not null references perfis,
  resolvida_em timestamptz,
  criado_em timestamptz not null default now()
);

create table tokens_google (
  user_id uuid primary key references perfis on delete cascade,
  refresh_token text not null,
  scope text,
  actualizado_em timestamptz not null default now()
);

create table subscricoes_push (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references perfis on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

-- ============================================================
-- Funcao auxiliar de pertenca a espaco
-- ============================================================

create or replace function e_membro(e uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from espaco_membros m
    where m.espaco_id = e and m.user_id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security, activar em todas as tabelas
-- ============================================================

alter table perfis            enable row level security;
alter table espacos           enable row level security;
alter table espaco_membros    enable row level security;
alter table capturas          enable row level security;
alter table tarefas           enable row level security;
alter table registos_bateria  enable row level security;
alter table sinais            enable row level security;
alter table tarefas_casa      enable row level security;
alter table decisoes          enable row level security;
alter table tokens_google     enable row level security;
alter table subscricoes_push  enable row level security;

-- ------------------------------------------------------------
-- perfis: cada um ve e escreve a sua propria linha.
-- Leitura tambem permitida a co membros de espaco, para mostrar
-- o nome de quem pegou numa tarefa ou definiu um sinal.
-- ------------------------------------------------------------
create policy perfis_seleccao_proprio on perfis
  for select using (id = auth.uid());

create policy perfis_seleccao_comembro on perfis
  for select using (
    exists (
      select 1
      from espaco_membros meu
      join espaco_membros dele on dele.espaco_id = meu.espaco_id
      where meu.user_id = auth.uid() and dele.user_id = perfis.id
    )
  );

create policy perfis_insercao_proprio on perfis
  for insert with check (id = auth.uid());

create policy perfis_actualizacao_proprio on perfis
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ------------------------------------------------------------
-- capturas: privadas ao utilizador
-- ------------------------------------------------------------
create policy capturas_proprio on capturas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- tarefas: privadas ao utilizador
-- ------------------------------------------------------------
create policy tarefas_proprio on tarefas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- registos_bateria: privados ao utilizador
-- ------------------------------------------------------------
create policy bateria_proprio on registos_bateria
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- subscricoes_push: privadas ao utilizador
-- ------------------------------------------------------------
create policy push_proprio on subscricoes_push
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- espacos: acesso a membros
-- ------------------------------------------------------------
create policy espacos_membro_seleccao on espacos
  for select using (e_membro(id));

-- ------------------------------------------------------------
-- espaco_membros: um membro ve as linhas do seu espaco
-- ------------------------------------------------------------
create policy espaco_membros_seleccao on espaco_membros
  for select using (e_membro(espaco_id));

-- ------------------------------------------------------------
-- tarefas_casa: leitura e escrita a membros do espaco
-- ------------------------------------------------------------
create policy tarefas_casa_seleccao on tarefas_casa
  for select using (e_membro(espaco_id));

create policy tarefas_casa_insercao on tarefas_casa
  for insert with check (e_membro(espaco_id) and criado_por = auth.uid());

create policy tarefas_casa_actualizacao on tarefas_casa
  for update using (e_membro(espaco_id)) with check (e_membro(espaco_id));

-- ------------------------------------------------------------
-- decisoes: leitura e escrita a membros do espaco
-- ------------------------------------------------------------
create policy decisoes_seleccao on decisoes
  for select using (e_membro(espaco_id));

create policy decisoes_insercao on decisoes
  for insert with check (e_membro(espaco_id) and criado_por = auth.uid());

create policy decisoes_actualizacao on decisoes
  for update using (e_membro(espaco_id)) with check (e_membro(espaco_id));

-- ------------------------------------------------------------
-- sinais: leitura a membros, escrita so do proprio
-- ------------------------------------------------------------
create policy sinais_seleccao on sinais
  for select using (e_membro(espaco_id));

create policy sinais_insercao on sinais
  for insert with check (e_membro(espaco_id) and user_id = auth.uid());

-- ------------------------------------------------------------
-- tokens_google: nenhuma politica. So a chave de servico acede.
-- Com RLS activo e sem policy, o cliente nao le nem escreve nada.
-- ------------------------------------------------------------
