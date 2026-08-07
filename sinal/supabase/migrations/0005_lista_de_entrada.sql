-- Maré, so entra quem esta na lista.
--
-- Ate aqui, qualquer pessoa que descobrisse o endereco entrava com a
-- conta Google dela. Nao veria dados de ninguem, a RLS trata disso, mas
-- ficava com conta criada, gastava lugar no limite de 100 utilizadores
-- da autorizacao Google, e enchia a base de dados de gente que nao tem
-- nada que ver com a casa.
--
-- A partir daqui, uma conta que nao esteja na lista nao chega sequer a
-- ser criada.

create table if not exists emails_permitidos (
  email text primary key,
  nota text,
  criado_em timestamptz not null default now()
);

alter table emails_permitidos enable row level security;
-- Sem politicas de proposito: ninguem le nem escreve isto pelo cliente.
-- So o editor SQL e a chave de servico.

-- Semear com quem ja entrou, para nao correr o risco de me enganar a
-- escrever um email a mao e trancar a porta a quem devia entrar.
insert into emails_permitidos (email, nota)
select u.email, coalesce(u.raw_user_meta_data ->> 'full_name', '')
from auth.users u
where u.email is not null
on conflict (email) do nothing;

-- Trava antes de a conta existir.
create or replace function verificar_email_permitido()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null
     or not exists (
       select 1 from emails_permitidos p
       where lower(p.email) = lower(new.email)
     )
  then
    raise exception 'Esta aplicacao e privada.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

drop trigger if exists ao_validar_email on auth.users;
create trigger ao_validar_email
  before insert on auth.users
  for each row execute function verificar_email_permitido();

-- Ver quem esta autorizado:
--   select * from emails_permitidos;
--
-- Autorizar mais alguem, um dia:
--   insert into emails_permitidos (email, nota)
--   values ('pessoa@exemplo.pt', 'quem e');
--
-- Retirar autorizacao (nao apaga a conta nem os dados dela):
--   delete from emails_permitidos where email = 'pessoa@exemplo.pt';
