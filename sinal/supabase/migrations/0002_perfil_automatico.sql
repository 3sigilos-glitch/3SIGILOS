-- SINAL, criacao automatica de perfil ao registar utilizador
-- Sempre que a Google cria um utilizador em auth.users, criamos a
-- linha correspondente em perfis. Assim o cliente nunca precisa de
-- fazer o insert, e o nome vem dos metadados da Google.

create or replace function tratar_novo_utilizador()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_utilizador on auth.users;
create trigger ao_criar_utilizador
  after insert on auth.users
  for each row execute function tratar_novo_utilizador();
