-- Verificação manual do trigger, do RLS e dos privilégios de public.profiles.
-- Rode no SQL Editor do Supabase (ou via psql) DEPOIS de aplicar as migrations.
-- Tudo acontece numa transação desfeita no final: nenhum dado permanece.
-- Sucesso: a execução termina com o aviso "Todas as verificações passaram".
-- Falha: um erro "FALHOU: ..." interrompe o script.

begin;

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.com',
   '{"full_name": "Ana Teste", "avatar_url": "https://example.com/ana.png"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bruno@example.com',
   '{"name": "Bruno", "picture": "https://example.com/bruno.png"}'),
  ('00000000-0000-0000-0000-00000000000c', 'carla@example.com',
   '{}');

-- 1. Trigger: profiles criados com metadados e fallbacks
do $$
begin
  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-00000000000a'
      and name = 'Ana Teste'
      and email = 'ana@example.com'
      and avatar_url = 'https://example.com/ana.png'
      and currency = 'BRL' and locale = 'pt-BR' and timezone = 'America/Sao_Paulo'
  ) then
    raise exception 'FALHOU: profile da Ana (full_name/avatar_url) incorreto';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-00000000000b'
      and name = 'Bruno'
      and avatar_url = 'https://example.com/bruno.png'
  ) then
    raise exception 'FALHOU: profile do Bruno (name/picture) incorreto';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = '00000000-0000-0000-0000-00000000000c'
      and name = 'carla'
      and avatar_url is null
  ) then
    raise exception 'FALHOU: fallback sem metadados (Carla) incorreto';
  end if;
end;
$$;

-- 2. anon não acessa profiles
set local role anon;
do $$
begin
  begin
    perform 1 from public.profiles;
    raise exception 'FALHOU: anon conseguiu ler profiles';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
reset role;

-- 3. Usuária autenticada (Ana)
set local role authenticated;
set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

do $$
declare
  n integer;
begin
  select count(*) into n from public.profiles;
  if n <> 1 then
    raise exception 'FALHOU: Ana deveria ver apenas o próprio profile (viu %)', n;
  end if;

  select count(*) into n from public.profiles
  where id = '00000000-0000-0000-0000-00000000000b';
  if n <> 0 then
    raise exception 'FALHOU: Ana conseguiu ler o profile do Bruno';
  end if;

  update public.profiles set name = 'Invasora'
  where id = '00000000-0000-0000-0000-00000000000b';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'FALHOU: Ana conseguiu alterar o profile do Bruno';
  end if;

  update public.profiles set name = 'Ana Atualizada'
  where id = '00000000-0000-0000-0000-00000000000a';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'FALHOU: Ana não conseguiu alterar o próprio nome';
  end if;

  begin
    update public.profiles set email = 'outro@example.com'
    where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FALHOU: Ana conseguiu alterar o próprio email';
  exception when insufficient_privilege then
    null;
  end;

  begin
    update public.profiles set avatar_url = 'https://evil.example.com/x.png'
    where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FALHOU: Ana conseguiu alterar o próprio avatar_url';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.profiles (id, email)
    values (gen_random_uuid(), 'novo@example.com');
    raise exception 'FALHOU: Ana conseguiu inserir um profile';
  exception when insufficient_privilege then
    null;
  end;

  begin
    delete from public.profiles
    where id = '00000000-0000-0000-0000-00000000000a';
    raise exception 'FALHOU: Ana conseguiu apagar o próprio profile';
  exception when insufficient_privilege then
    null;
  end;

  raise notice 'Todas as verificações passaram';
end;
$$;

rollback;
