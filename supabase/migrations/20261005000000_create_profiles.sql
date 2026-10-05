-- O mão de vaca · Fase 0
-- Perfil do usuário, criado automaticamente a partir de auth.users.

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text check (name is null or char_length(name) <= 100),
  email text not null,
  avatar_url text,
  currency text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  locale text not null default 'pt-BR' check (char_length(locale) between 2 and 35),
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil e preferências do usuário. Uma linha por auth.users, criada pelo trigger on_auth_user_created.';

-- ---------------------------------------------------------------------------
-- updated_at automático
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Criação automática do profile a partir do Supabase Auth
-- ---------------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  user_email text := coalesce(new.email, meta ->> 'email', '');
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    left(
      coalesce(
        nullif(trim(meta ->> 'full_name'), ''),
        nullif(trim(meta ->> 'name'), ''),
        nullif(split_part(user_email, '@', 1), '')
      ),
      100
    ),
    user_email,
    coalesce(
      nullif(meta ->> 'avatar_url', ''),
      nullif(meta ->> 'picture', '')
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Sem policies de insert/delete: o insert acontece só pelo trigger
-- (security definer) e o delete por cascade a partir de auth.users.

-- ---------------------------------------------------------------------------
-- Privilégios: o usuário só pode alterar os campos editáveis.
-- email, avatar_url, id e timestamps ficam protegidos no próprio banco.
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (name, currency, locale, timezone) on table public.profiles to authenticated;
