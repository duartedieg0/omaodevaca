# Fase 0 — Scaffold · Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a fundação do **O mão de vaca**: Next.js 16 + Supabase com login exclusivo via Google OAuth, área `/app/**` protegida, tabela `profiles` com RLS, dashboard em empty state, configurações editáveis, dark mode e README completo.

**Architecture:** App Router com Server Components por padrão. Sessão Supabase em cookies via `@supabase/ssr`. O `src/proxy.ts` renova a sessão e faz um redirect otimista; a autorização real acontece no servidor (`requireUserId()` no layout e nas Server Actions) e no banco (RLS + privilégios por coluna). O acesso a dados de profile passa só por `src/data/profile.ts`.

**Tech Stack:** Next.js 16.3.8, React 19, TypeScript (strict), Tailwind CSS v4, shadcn 4.21.2 (base `radix`, preset `nova`), lucide-react, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117.2, Zod 4, next-themes, sonner, pnpm 9.

**Spec:** `docs/superpowers/specs/2026-10-05-fase0-scaffold-design.md` · **Requisitos originais:** `prompts/Fase0-Scaffold.md`

## Global Constraints

- Package manager: **pnpm**. TypeScript `strict: true`.
- Nenhum teste automatizado nesta fase (decisão do usuário). Cada task é verificada com `pnpm lint`, `pnpm typecheck`, `pnpm build` e checagens manuais descritas.
- Supabase: **só código**. Nada é aplicado em banco remoto; nenhuma chamada MCP/CLI que altere projeto Supabase.
- Somente Google OAuth. Sem email/senha, magic link ou cadastro manual.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`. **Nunca** service role key.
- Preferências aceitas: `currency = BRL`, `locale = pt-BR`, `timezone = America/Sao_Paulo` (valor único, exibido em select com "Mais opções em breve").
- Paleta: preto/cinzas/branco + verde musgo/esmeralda. Sem porquinhos, cifrões ou memes. Nenhum dado financeiro fake.
- Todo texto de UI em português do Brasil. Nenhuma mensagem interna do Supabase é exibida ao usuário. Sem `console.log`.
- Não implementar nada de fases futuras (accounts, transactions, categories, budgets, credit_cards, investments, goals, recurrences, imports, open_finance, notifications, ai).
- Cada commit termina com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Next 16: o arquivo de middleware chama-se `proxy.ts` e exporta `proxy`; `error.tsx` recebe `retry` (não `reset`); `PageProps<"/rota">` e `LayoutProps<"/rota">` são tipos globais gerados por `next typegen`.

## Estrutura final de arquivos

```text
src/
  proxy.ts
  app/
    layout.tsx  globals.css  icon.svg  page.tsx  error.tsx
    auth/callback/route.ts
    auth/erro/page.tsx
    app/
      layout.tsx  page.tsx  loading.tsx
      dashboard/page.tsx
      configuracoes/page.tsx  configuracoes/actions.ts
  components/
    ui/                       (gerado pelo shadcn)
    brand/logo.tsx  brand/cow-pattern.tsx
    theme/theme-provider.tsx  theme/theme-options.ts  theme/theme-toggle.tsx  theme/theme-select.tsx
    layout/nav-items.ts  layout/user-avatar.tsx  layout/user-menu.tsx  layout/app-sidebar.tsx  layout/app-header.tsx
    auth/google-login-button.tsx  auth/sign-out-button.tsx
    settings/profile-form.tsx
    dashboard/welcome-card.tsx  dashboard/coming-soon-card.tsx
  hooks/use-mobile.ts         (gerado pelo shadcn, reescrito)
  lib/
    utils.ts                  (gerado pelo shadcn)
    preferences.ts
    supabase/env.ts  supabase/client.ts  supabase/server.ts  supabase/proxy.ts
    auth/safe-redirect.ts  auth/session.ts  auth/actions.ts
    validations/profile.ts
  data/profile.ts
supabase/
  migrations/20261005000000_create_profiles.sql
  tests/rls-check.sql
.env.example
README.md
```

Desvios conscientes em relação à estrutura sugerida no prompt:
- `mobile-nav.tsx` não existe: o shadcn `Sidebar` já entrega o drawer mobile (Sheet), o foco e o atalho de teclado.
- `theme-toggle`/`theme-select` ficam em `components/theme/`, junto do provider e das opções compartilhadas.
- `requireUser()` do spec virou `requireUserId()` em `lib/auth/session.ts`, porque só o id é necessário.
- Há um único `src/app/error.tsx` raiz. Ele também captura erros lançados pelo layout de `/app`, o que um `error.tsx` dentro de `/app` não faria.

---

### Task 1: Scaffold do projeto

**Files:**
- Create: projeto Next.js na raiz (via `create-next-app`), `components.json`, `src/components/ui/*`, `src/lib/utils.ts`, `src/hooks/use-mobile.ts`, `.env.example`, `src/app/icon.svg`
- Modify: `package.json` (script `typecheck`), `.gitignore` (liberar `.env.example`)
- Delete: `public/*.svg`, `src/app/favicon.ico`

**Interfaces:**
- Produces: componentes shadcn em `@/components/ui/*` (`button`, `card`, `badge`, `avatar`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `tooltip`); `cn()` em `@/lib/utils`; `useIsMobile()` em `@/hooks/use-mobile`; script `pnpm typecheck`.

- [ ] **Step 1: Gerar o projeto Next.js numa pasta temporária e mover para a raiz**

O `create-next-app` recusa diretórios com arquivos desconhecidos (a pasta `prompts/` já existe). Por isso o projeto é gerado em `.scaffold/` e depois movido.

```bash
pnpm dlx create-next-app@16.3.8 .scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --disable-git --skip-install --yes
cp -r .scaffold/. .
rm -rf .scaffold
pnpm install
```

Expected: `package.json`, `src/app/*`, `eslint.config.mjs`, `tsconfig.json` (com `"strict": true`), `AGENTS.md` e `CLAUDE.md` (regras do Next para agentes, que devem ser mantidas) na raiz.

- [ ] **Step 2: Inicializar o shadcn (Radix + preset Nova) e adicionar os componentes**

```bash
pnpm dlx shadcn@4.21.2 init -b radix -p nova -y
pnpm dlx shadcn@4.21.2 add sidebar avatar badge button card dropdown-menu input label select separator skeleton sonner -y
```

Expected: `components.json` com `"style": "radix-nova"`, componentes em `src/components/ui/` (o `sidebar` traz `sheet`, `tooltip` e `src/hooks/use-mobile.ts`) e dependências `radix-ui`, `next-themes`, `sonner`, `lucide-react`, `cn` e `class-variance-authority` no `package.json`. O pacote `cn` é o utilitário oficial do shadcn (repo `shadcn-ui/cn`) e é esperado.

- [ ] **Step 3: Instalar as dependências da aplicação**

```bash
pnpm add @supabase/ssr@0.12.7 @supabase/supabase-js@2.117.2 zod@4.6.5 server-only
```

- [ ] **Step 4: Reescrever `src/hooks/use-mobile.ts`**

A versão gerada chama `setState` dentro de `useEffect` e falha na regra `react-hooks/set-state-in-effect` do ESLint do Next 16. Substitua o arquivo inteiro por:

```ts
import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
```

- [ ] **Step 5: Adicionar o script `typecheck` ao `package.json`**

Os tipos `PageProps`/`LayoutProps` vêm de `next typegen`, então o typecheck precisa gerá-los antes. Em `"scripts"`, deixe:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "next typegen && tsc --noEmit"
}
```

- [ ] **Step 6: Variáveis de ambiente**

Crie `.env.example`:

```env
# URL do projeto Supabase (Project Settings → Data API / botão "Connect")
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co

# Publishable key (Project Settings → API Keys). Começa com sb_publishable_.
# É pública por design: a segurança dos dados vem do RLS.
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

# URL pública da aplicação (metadata/SEO). O fluxo OAuth usa a origem real da requisição.
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

No `.gitignore` gerado existe a linha `.env*`. Logo abaixo dela, acrescente:

```gitignore
!.env.example
```

- [ ] **Step 7: Limpar assets padrão e criar o ícone**

```bash
rm -f public/*.svg src/app/favicon.ico
```

Crie `src/app/icon.svg` (ícone Lucide `hand-coins` sobre quadrado verde):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#13724f"/>
  <g transform="translate(4 4)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/>
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/>
    <path d="m2 16 6 6"/>
    <circle cx="16" cy="9" r="2.9"/>
    <circle cx="6" cy="5" r="3"/>
  </g>
</svg>
```

- [ ] **Step 8: Verificar**

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Expected: os três passam. O build lista as rotas `/` e `/_not-found`. A página inicial ainda é a padrão do create-next-app, e o `layout.tsx` ainda referencia a fonte Geist (será substituído na Task 4).

- [ ] **Step 9: Commit**

```bash
git add -A
git reset prompts
git commit -m "chore: scaffold Next.js 16 + shadcn/ui + Supabase deps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(A pasta `prompts/` fica fora do controle de versão, a menos que o usuário peça o contrário.)

---

### Task 2: Migration de `profiles` e script de verificação de RLS

**Files:**
- Create: `supabase/migrations/20261005000000_create_profiles.sql`
- Create: `supabase/tests/rls-check.sql`

**Interfaces:**
- Produces: tabela `public.profiles (id, name, email, avatar_url, currency, locale, timezone, created_at, updated_at)`. O role `authenticated` só pode fazer `SELECT` nas próprias linhas e `UPDATE` nas colunas `name, currency, locale, timezone` das próprias linhas. Usado por `src/data/profile.ts` (Task 3).

- [ ] **Step 1: Criar a migration**

`supabase/migrations/20261005000000_create_profiles.sql`:

```sql
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
```

- [ ] **Step 2: Criar o script manual de verificação**

`supabase/tests/rls-check.sql`:

```sql
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
```

- [ ] **Step 3: Revisar contra o spec (sem banco disponível)**

Não há banco nesta fase. Confira manualmente cada item:
- `id` referencia `auth.users(id)` com `on delete cascade`.
- Os defaults são `BRL`, `pt-BR` e `America/Sao_Paulo`.
- O trigger é `security definer` com `set search_path = ''` e nomes qualificados (`public.profiles`).
- O trigger usa `on conflict (id) do nothing`.
- Há fallback para `full_name` → `name` → parte local do email, e para `avatar_url` → `picture` → `null`.
- O RLS está habilitado e as policies usam `(select auth.uid())`.
- Existe `grant update` apenas nas quatro colunas editáveis.

- [ ] **Step 4: Commit**

```bash
git add supabase
git commit -m "feat(db): add profiles table, auto-create trigger and RLS

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Infraestrutura Supabase, sessão e camada de dados

**Files:**
- Create: `src/lib/supabase/env.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/proxy.ts`, `src/proxy.ts`
- Create: `src/lib/auth/safe-redirect.ts`, `src/lib/auth/session.ts`, `src/lib/auth/actions.ts`
- Create: `src/lib/preferences.ts`, `src/lib/validations/profile.ts`, `src/data/profile.ts`

**Interfaces:**
- Consumes: tabela `public.profiles` (Task 2).
- Produces:
  - `createClient()` (browser) em `@/lib/supabase/client`; `createClient(): Promise<SupabaseClient>` (server) em `@/lib/supabase/server`.
  - `DEFAULT_AUTHENTICATED_PATH = "/app/dashboard"` e `safeRedirectPath(next: string | null | undefined): string` em `@/lib/auth/safe-redirect`.
  - `getCurrentUserId(): Promise<string | null>` (com `cache`) e `requireUserId(): Promise<string>` (redireciona para `/`) em `@/lib/auth/session`.
  - Server Action `signOut(): Promise<void>` em `@/lib/auth/actions`.
  - `CURRENCIES`, `LOCALES`, `TIMEZONES` (tuplas `as const`), `CURRENCY_LABELS`, `LOCALE_LABELS`, `TIMEZONE_LABELS` em `@/lib/preferences`.
  - `profileUpdateSchema` e o tipo `ProfileUpdate = { name: string; currency: "BRL"; locale: "pt-BR"; timezone: "America/Sao_Paulo" }` em `@/lib/validations/profile`.
  - O tipo `Profile`, `getCurrentProfile(): Promise<Profile | null>` (com `cache`) e `updateCurrentProfile(input: ProfileUpdate): Promise<boolean>` em `@/data/profile`.

- [ ] **Step 1: `src/lib/supabase/env.ts`**

```ts
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (veja .env.example).",
    );
  }

  return { url, publishableKey };
}
```

- [ ] **Step 2: `src/lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
```

- [ ] **Step 3: `src/lib/supabase/server.ts`**

A ordem importa: `cookies()` vem antes de `getSupabaseEnv()`. Assim a rota vira dinâmica antes de exigir as variáveis, e o `pnpm build` funciona sem `.env.local`.

```ts
import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

export async function createClient() {
  // cookies() vem primeiro: torna a rota dinâmica antes de ler as variáveis.
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseEnv();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de um Server Component, que não pode gravar
          // cookies. O proxy já renova a sessão a cada requisição.
        }
      },
    },
  });
}
```

- [ ] **Step 4: `src/lib/supabase/proxy.ts`**

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseEnv } from "./env";

function isProtectedPath(pathname: string) {
  return pathname === "/app" || pathname.startsWith("/app/");
}

/**
 * Renova a sessão do Supabase (cookies) a cada requisição e faz um redirect
 * otimista de /app/** para a landing quando não há sessão. A autorização de
 * verdade acontece no servidor (layout, Server Actions) e no banco (RLS).
 */
export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });
  let cacheHeaders: Record<string, string> = {};

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        cacheHeaders = headers;
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Não coloque código entre createServerClient e getClaims: a chamada
  // renova o token quando necessário e precisa acontecer primeiro.
  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", `${pathname}${search}`);

    const redirect = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    Object.entries(cacheHeaders).forEach(([key, value]) =>
      redirect.headers.set(key, value),
    );
    return redirect;
  }

  return response;
}
```

- [ ] **Step 5: `src/proxy.ts`**

```ts
import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
```

- [ ] **Step 6: `src/lib/auth/safe-redirect.ts`**

```ts
export const DEFAULT_AUTHENTICATED_PATH = "/app/dashboard";

const BASE = "http://localhost";

/**
 * Retorna um caminho interno seguro dentro de /app para redirecionar após o
 * login. Qualquer outro valor (URL absoluta, //host, \host, path traversal)
 * cai no destino padrão, evitando open redirect.
 */
export function safeRedirectPath(next: string | null | undefined): string {
  if (
    !next ||
    !next.startsWith("/") ||
    next.includes("//") ||
    next.includes("\\")
  ) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  let url: URL;
  try {
    url = new URL(next, BASE);
  } catch {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  const isInternal = url.origin === BASE;
  const isAppPath =
    url.pathname === "/app" || url.pathname.startsWith("/app/");

  if (!isInternal || !isAppPath) {
    return DEFAULT_AUTHENTICATED_PATH;
  }

  return `${url.pathname}${url.search}`;
}
```

- [ ] **Step 7: Checar `safeRedirectPath` manualmente**

O Node 24 executa TypeScript sem build (type stripping). Rode:

```bash
node --input-type=module -e '
import { safeRedirectPath as s } from "./src/lib/auth/safe-redirect.ts";
const cases = {
  "/app/configuracoes?x=1": "/app/configuracoes?x=1",
  "/app": "/app",
  "": "/app/dashboard",
  "//evil.com": "/app/dashboard",
  "/\\evil.com": "/app/dashboard",
  "https://evil.com/app": "/app/dashboard",
  "/app/../admin": "/app/dashboard",
  "/app/%2e%2e/admin": "/app/dashboard",
  "/apps": "/app/dashboard",
  "/": "/app/dashboard",
};
let ok = true;
for (const [input, expected] of Object.entries(cases)) {
  const got = s(input);
  if (got !== expected) { ok = false; process.stdout.write(`FALHOU ${JSON.stringify(input)} -> ${got}\n`); }
}
process.stdout.write(ok ? "safeRedirectPath OK\n" : "");
'
```

Expected: `safeRedirectPath OK`. O aviso "Reparsing as ES module…" é esperado e inofensivo. Este é um check pontual, não um arquivo de teste (decisão do usuário).

- [ ] **Step 8: `src/lib/auth/session.ts`**

```ts
import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/** Id do usuário autenticado, validado a partir do JWT da sessão. */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims.sub;
});

/** Garante um usuário autenticado; caso contrário, volta para a landing. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/");
  }

  return userId;
}
```

- [ ] **Step 9: `src/lib/auth/actions.ts`**

```ts
"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
```

- [ ] **Step 10: `src/lib/preferences.ts`**

```ts
// Opções de preferência aceitas pela aplicação. Para liberar novas opções,
// basta acrescentá-las aqui: o banco valida apenas o formato dos valores.

export const CURRENCIES = ["BRL"] as const;
export const LOCALES = ["pt-BR"] as const;
export const TIMEZONES = ["America/Sao_Paulo"] as const;

export type Currency = (typeof CURRENCIES)[number];
export type Locale = (typeof LOCALES)[number];
export type Timezone = (typeof TIMEZONES)[number];

export const CURRENCY_LABELS: Record<Currency, string> = {
  BRL: "Real brasileiro (R$)",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
};

export const TIMEZONE_LABELS: Record<Timezone, string> = {
  "America/Sao_Paulo": "Horário de Brasília (GMT-3)",
};
```

- [ ] **Step 11: `src/lib/validations/profile.ts`**

```ts
import { z } from "zod";

import { CURRENCIES, LOCALES, TIMEZONES } from "@/lib/preferences";

export const profileUpdateSchema = z.object({
  name: z
    .string({ error: "Informe seu nome." })
    .trim()
    .min(1, { error: "Informe seu nome." })
    .max(100, { error: "Use no máximo 100 caracteres." }),
  currency: z.enum(CURRENCIES, { error: "Escolha uma moeda válida." }),
  locale: z.enum(LOCALES, { error: "Escolha um idioma válido." }),
  timezone: z.enum(TIMEZONES, { error: "Escolha um fuso horário válido." }),
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
```

- [ ] **Step 12: `src/data/profile.ts`**

```ts
import "server-only";

import { cache } from "react";

import { getCurrentUserId } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { ProfileUpdate } from "@/lib/validations/profile";

export type Profile = {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  currency: string;
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

const PROFILE_COLUMNS =
  "id, name, email, avatar_url, currency, locale, timezone, created_at, updated_at";

/** Profile do usuário autenticado (deduplicado por requisição). */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) {
    throw new Error("Não foi possível carregar o perfil.");
  }

  return data;
});

/** Atualiza somente os campos editáveis do profile do usuário autenticado. */
export async function updateCurrentProfile(
  input: ProfileUpdate,
): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name: input.name,
      currency: input.currency,
      locale: input.locale,
      timezone: input.timezone,
    })
    .eq("id", userId);

  return !error;
}
```

- [ ] **Step 13: Verificar**

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Expected: os três passam, e o build mostra `ƒ Proxy (Middleware)`.

- [ ] **Step 14: Commit**

```bash
git add src
git commit -m "feat(auth): add Supabase SSR clients, proxy, session helpers and profile DAL

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Identidade visual, tema, landing e fluxo de login

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/components/brand/logo.tsx`, `src/components/brand/cow-pattern.tsx`
- Create: `src/components/theme/theme-provider.tsx`, `src/components/theme/theme-options.ts`, `src/components/theme/theme-toggle.tsx`, `src/components/theme/theme-select.tsx`
- Create: `src/components/auth/google-login-button.tsx`, `src/components/auth/sign-out-button.tsx`
- Create: `src/app/auth/callback/route.ts`, `src/app/auth/erro/page.tsx`, `src/app/error.tsx`

**Interfaces:**
- Consumes: `createClient` (browser/server), `safeRedirectPath`, `getCurrentUserId`, `signOut` (Task 3).
- Produces:
  - `<Logo className? />` e `<CowPattern className? />`.
  - `<ThemeToggle />` (dropdown) e `<ThemeSelect />` (botões), além de `THEME_OPTIONS`.
  - `<GoogleLoginButton next: string />` e `<SignOutButton />` (form + Server Action).
  - A utility CSS `bg-hero` e a fonte `font-heading` (Bricolage Grotesque).

- [ ] **Step 1: Fontes e paleta em `src/app/globals.css`**

No bloco `@theme inline` gerado pelo shadcn, troque estas duas linhas:

```css
  --font-sans: var(--font-sans);
  --font-heading: var(--font-sans);
```

por:

```css
  --font-sans: var(--font-geist-sans);
  --font-heading: var(--font-bricolage);
```

Depois substitua **todo** o trecho entre o fim do bloco `@theme inline { ... }` e o início de `@layer base`, ou seja, os blocos `:root { ... }` e `.dark { ... }` gerados, por:

```css
/*
 * O mão de vaca — paleta provisória.
 * Preto e branco (com degradês em cinza levemente esverdeado) + verde
 * musgo/esmeralda como única cor de destaque.
 */
:root {
  --background: oklch(0.99 0.002 160);
  --foreground: oklch(0.17 0.006 160);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.17 0.006 160);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.17 0.006 160);
  --primary: oklch(0.47 0.1 160);
  --primary-foreground: oklch(0.985 0.01 160);
  --secondary: oklch(0.955 0.004 160);
  --secondary-foreground: oklch(0.22 0.008 160);
  --muted: oklch(0.955 0.004 160);
  --muted-foreground: oklch(0.48 0.012 160);
  --accent: oklch(0.94 0.025 160);
  --accent-foreground: oklch(0.3 0.07 160);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.91 0.005 160);
  --input: oklch(0.91 0.005 160);
  --ring: oklch(0.6 0.1 160);
  --chart-1: oklch(0.47 0.1 160);
  --chart-2: oklch(0.62 0.12 160);
  --chart-3: oklch(0.35 0.06 160);
  --chart-4: oklch(0.55 0.01 160);
  --chart-5: oklch(0.25 0.006 160);
  --radius: 0.75rem;
  --sidebar: oklch(0.975 0.003 160);
  --sidebar-foreground: oklch(0.17 0.006 160);
  --sidebar-primary: oklch(0.47 0.1 160);
  --sidebar-primary-foreground: oklch(0.985 0.01 160);
  --sidebar-accent: oklch(0.935 0.015 160);
  --sidebar-accent-foreground: oklch(0.22 0.05 160);
  --sidebar-border: oklch(0.91 0.005 160);
  --sidebar-ring: oklch(0.6 0.1 160);
}

.dark {
  --background: oklch(0.15 0.005 160);
  --foreground: oklch(0.96 0.004 160);
  --card: oklch(0.19 0.006 160);
  --card-foreground: oklch(0.96 0.004 160);
  --popover: oklch(0.19 0.006 160);
  --popover-foreground: oklch(0.96 0.004 160);
  --primary: oklch(0.74 0.14 158);
  --primary-foreground: oklch(0.17 0.03 160);
  --secondary: oklch(0.25 0.007 160);
  --secondary-foreground: oklch(0.96 0.004 160);
  --muted: oklch(0.25 0.007 160);
  --muted-foreground: oklch(0.7 0.012 160);
  --accent: oklch(0.28 0.035 160);
  --accent-foreground: oklch(0.92 0.06 160);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.6 0.12 160);
  --chart-1: oklch(0.74 0.14 158);
  --chart-2: oklch(0.6 0.12 160);
  --chart-3: oklch(0.85 0.08 160);
  --chart-4: oklch(0.55 0.01 160);
  --chart-5: oklch(0.4 0.008 160);
  --sidebar: oklch(0.12 0.005 160);
  --sidebar-foreground: oklch(0.96 0.004 160);
  --sidebar-primary: oklch(0.74 0.14 158);
  --sidebar-primary-foreground: oklch(0.17 0.03 160);
  --sidebar-accent: oklch(0.22 0.02 160);
  --sidebar-accent-foreground: oklch(0.96 0.004 160);
  --sidebar-border: oklch(1 0 0 / 8%);
  --sidebar-ring: oklch(0.6 0.12 160);
}

/* Fundo da landing: brilho verde suave no topo sobre degradê de cinzas. */
@utility bg-hero {
  background-image:
    radial-gradient(
      ellipse 80% 50% at 50% -10%,
      color-mix(in oklch, var(--primary) 18%, transparent),
      transparent 70%
    ),
    linear-gradient(to bottom, var(--background), var(--secondary));
}
```

Mantenha os `@import` do topo, o `@custom-variant dark` e o `@layer base` gerados.

- [ ] **Step 2: `src/components/theme/theme-provider.tsx`**

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider(
  props: React.ComponentProps<typeof NextThemesProvider>,
) {
  return <NextThemesProvider {...props} />;
}
```

- [ ] **Step 3: `src/app/layout.tsx` (substituir inteiro)**

```tsx
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "O mão de vaca",
    template: "%s · O mão de vaca",
  },
  description:
    "Seu dinheiro merece mais controle e menos sustos. Organize sua vida financeira de forma simples, visual e sem complicação.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfb" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1210" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

O `suppressHydrationWarning` no `<html>` é necessário porque o `next-themes` injeta a classe antes da hidratação. É isso que evita o flash de tema incorreto.

- [ ] **Step 4: `src/components/brand/logo.tsx`**

```tsx
import { HandCoins } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 font-heading text-base font-bold tracking-tight",
        className,
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <HandCoins className="size-4.5" aria-hidden="true" />
      </span>
      <span>O mão de vaca</span>
    </span>
  );
}
```

- [ ] **Step 5: `src/components/brand/cow-pattern.tsx`**

```tsx
import { cn } from "@/lib/utils";

/**
 * Textura decorativa de manchas de vaca. Use com opacidade bem baixa
 * (ex.: `opacity-[0.05]`) dentro de um container `relative overflow-hidden`.
 */
export function CowPattern({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 size-full text-foreground",
        className,
      )}
    >
      <defs>
        <pattern
          id="cow-spots"
          width="420"
          height="420"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-14)"
        >
          <g fill="currentColor">
            <path d="M58 40c22-26 70-30 94-8 14 13 9 30 24 42 17 14 12 42-10 52-20 9-34-6-56 2-25 9-52 4-62-18-8-17 6-30 2-46-3-11 0-17 8-24z" />
            <path d="M262 18c18-8 42 2 50 18 6 12-4 22 4 34 9 13-2 30-20 30-14 0-20-10-34-8-16 2-30-8-30-24 0-14 14-18 14-32 0-8 6-14 16-18z" />
            <path d="M176 196c30-14 76-6 92 22 9 16-2 30 8 46 12 20-4 46-32 50-24 4-36-12-62-6-28 6-56-8-58-34-2-20 16-28 18-46 2-16 14-24 34-32z" />
            <path d="M24 286c14-10 36-6 44 8 5 9-1 17 4 26 6 11-3 24-18 24-11 0-16-8-27-6-12 2-22-6-21-18 1-10 10-14 11-24 1-4 3-7 7-10z" />
            <path d="M338 300c16-6 36 4 40 20 3 11-5 18 0 28 6 12-4 26-20 26-12 0-18-9-30-6-13 3-25-6-24-19 1-11 11-15 13-26 2-10 9-19 21-23z" />
            <path d="M372 130c9-4 21 1 24 10 2 6-2 10 1 16 3 7-3 15-12 15-7 0-10-5-17-4-8 1-14-4-13-11 1-7 6-9 7-15 1-5 4-9 10-11z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cow-spots)" />
    </svg>
  );
}
```

- [ ] **Step 6: `src/components/theme/theme-options.ts`**

```ts
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

export type ThemeOption = {
  value: "light" | "dark" | "system";
  label: string;
  icon: LucideIcon;
};

export const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];
```

- [ ] **Step 7: `src/components/theme/theme-toggle.tsx`**

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { THEME_OPTIONS } from "./theme-options";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Alterar tema">
          <Sun className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon aria-hidden="true" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 8: `src/components/theme/theme-select.tsx`**

```tsx
"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { THEME_OPTIONS } from "./theme-options";

const subscribe = () => () => {};

/** Seletor de tema com três botões; o tema só é lido após a hidratação. */
export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <div className="grid grid-cols-3 gap-2" aria-label="Tema" role="group">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border bg-background p-3 text-sm font-medium transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              selected && "border-primary bg-accent text-accent-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 9: `src/components/auth/google-login-button.tsx`**

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.44.35-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.95l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function GoogleLoginButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleClick() {
    setPending(true);
    setFailed(false);

    try {
      const supabase = createClient();
      const redirectTo = new URL("/auth/callback", window.location.origin);
      redirectTo.searchParams.set("next", next);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectTo.toString() },
      });

      if (error) {
        throw error;
      }
      // Em caso de sucesso o navegador é redirecionado para o Google.
    } catch {
      setPending(false);
      setFailed(true);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        size="lg"
        variant="outline"
        onClick={handleClick}
        disabled={pending}
        className="h-12 min-w-64 gap-3 rounded-full bg-background px-6 text-base shadow-sm"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        {pending ? "Redirecionando…" : "Entrar com Google"}
      </Button>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          Não foi possível iniciar o login. Tente novamente.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 10: `src/components/auth/sign-out-button.tsx`**

```tsx
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost">
        <LogOut aria-hidden="true" />
        Sair
      </Button>
    </form>
  );
}
```

- [ ] **Step 11: `src/app/page.tsx` (substituir inteiro)**

```tsx
import { redirect } from "next/navigation";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { CowPattern } from "@/components/brand/cow-pattern";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { getCurrentUserId } from "@/lib/auth/session";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const { next } = await searchParams;
  const nextPath = safeRedirectPath(typeof next === "string" ? next : null);

  if (await getCurrentUserId()) {
    redirect(nextPath);
  }

  return (
    <div className="bg-hero relative isolate flex min-h-dvh flex-col overflow-hidden">
      <CowPattern className="-z-10 opacity-[0.035] dark:opacity-[0.05]" />

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <span className="mb-6 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          Finanças pessoais, sem drama
        </span>
        <h1 className="font-heading text-5xl font-extrabold tracking-tight text-balance sm:text-7xl">
          O mão de vaca
        </h1>
        <p className="mt-5 text-xl font-medium text-balance sm:text-2xl">
          Seu dinheiro merece mais controle e{" "}
          <span className="text-primary">menos sustos.</span>
        </p>
        <p className="mt-3 max-w-md text-pretty text-muted-foreground">
          Organize sua vida financeira de forma simples, visual e sem complicação.
        </p>
        <div className="mt-10">
          <GoogleLoginButton next={nextPath} />
        </div>
      </main>

      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        Feito para quem conta cada centavo.
      </footer>
    </div>
  );
}
```

- [ ] **Step 12: `src/app/auth/callback/route.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL("/auth/erro", origin));
}
```

- [ ] **Step 13: `src/app/auth/erro/page.tsx`**

```tsx
import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Não foi possível entrar",
};

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Não foi possível entrar</h1>
        <p className="max-w-sm text-muted-foreground">
          Algo deu errado durante o login com o Google. Tente novamente em
          alguns instantes.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Tentar novamente</Link>
      </Button>
    </main>
  );
}
```

- [ ] **Step 14: `src/app/error.tsx`**

Este é o error boundary raiz. Ele também captura erros do layout de `/app`, como o caso "perfil não encontrado". O botão Sair permite recuperar uma sessão quebrada.

```tsx
"use client";

import Link from "next/link";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Algo deu errado</h1>
        <p className="max-w-sm text-muted-foreground">
          Não conseguimos carregar esta página. Tente novamente; se o problema
          continuar, saia e entre de novo.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => retry()}>Tentar novamente</Button>
        <Button asChild variant="outline">
          <Link href="/">Ir para o início</Link>
        </Button>
        <SignOutButton />
      </div>
    </main>
  );
}
```

- [ ] **Step 15: Verificar build e rotas com env fictícia**

```bash
pnpm lint && pnpm typecheck && pnpm build
printf 'NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_fake\nNEXT_PUBLIC_APP_URL=http://localhost:3000\n' > .env.local
pnpm build && pnpm start -p 3456
```

Em outro terminal:

```bash
for u in "/" "/auth/erro" "/auth/callback" "/auth/callback?code=x&next=//evil.com" "/?next=https://evil.com"; do
  printf "%-42s " "$u"; curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "http://localhost:3456$u"
done
```

Expected:
- `/` → `200`
- `/auth/erro` → `200`
- `/auth/callback` → `307 -> http://localhost:3456/auth/erro`
- `/auth/callback?code=x&next=//evil.com` → `307 -> http://localhost:3456/auth/erro` (o código fictício falha na troca e nunca redireciona para fora)
- `/?next=https://evil.com` → `200`

Abra `http://localhost:3456/` no navegador e confira:
- A landing aparece no tema claro e no escuro (pelo toggle) sem flash ao recarregar.
- As manchas ficam bem sutis, com cara de "vaca" e não de bolinhas.
- O layout funciona a 375px de largura.
- Clicar em "Entrar com Google" mostra "Redirecionando…". Com a env fictícia, a navegação vai para `example.supabase.co` e falha, o que é esperado sem projeto real.

Encerre o servidor **pelo PID** (Ctrl+C no terminal). Não use `taskkill /IM node.exe`, que derruba todos os processos Node da máquina. Depois apague o arquivo de env fictícia: `rm .env.local`.

- [ ] **Step 16: Commit**

```bash
git add src
git commit -m "feat: add brand identity, theme switching, landing page and OAuth callback

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Área autenticada (layout, sidebar, dashboard)

**Files:**
- Create: `src/components/layout/nav-items.ts`, `src/components/layout/user-avatar.tsx`, `src/components/layout/user-menu.tsx`, `src/components/layout/app-sidebar.tsx`, `src/components/layout/app-header.tsx`
- Create: `src/components/dashboard/welcome-card.tsx`, `src/components/dashboard/coming-soon-card.tsx`
- Create: `src/app/app/layout.tsx`, `src/app/app/page.tsx`, `src/app/app/loading.tsx`, `src/app/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `requireUserId`, `getCurrentProfile`, `signOut`, `DEFAULT_AUTHENTICATED_PATH` (Task 3); `Logo`, `CowPattern`, `ThemeToggle` (Task 4).
- Produces:
  - `<UserAvatar name: string; avatarUrl: string | null; className? />`, reutilizado nas configurações (Task 6).
  - O tipo `SidebarUser = { name: string; email: string; avatarUrl: string | null }`.
  - `NAV_ITEMS` e `isNavItemActive(pathname, href)`.

- [ ] **Step 1: `src/components/layout/nav-items.ts`**

```ts
import { LayoutDashboard, Settings, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  title: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/app/dashboard", title: "Dashboard", icon: LayoutDashboard },
  { href: "/app/configuracoes", title: "Configurações", icon: Settings },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
```

- [ ] **Step 2: `src/components/layout/user-avatar.tsx`**

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return initials || "?";
}

type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  className?: string;
};

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />
      )}
      <AvatarFallback className="bg-primary/10 font-medium text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
```

- [ ] **Step 3: `src/components/layout/user-menu.tsx`**

```tsx
"use client";

import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth/actions";

import { UserAvatar } from "./user-avatar";

export type SidebarUser = {
  name: string;
  email: string;
  avatarUrl: string | null;
};

export function UserMenu({ user }: { user: SidebarUser }) {
  const { setOpenMobile } = useSidebar();
  const [signingOut, startSignOut] = useTransition();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar
                name={user.name}
                avatarUrl={user.avatarUrl}
                className="size-8 rounded-lg"
              />
              <span className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto" aria-hidden="true" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          >
            <DropdownMenuLabel className="font-normal">
              <span className="block truncate font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/app/configuracoes" onClick={() => setOpenMobile(false)}>
                <Settings aria-hidden="true" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={signingOut}
              onSelect={() => startSignOut(() => signOut())}
            >
              <LogOut aria-hidden="true" />
              {signingOut ? "Saindo…" : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
```

- [ ] **Step 4: `src/components/layout/app-sidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { isNavItemActive, NAV_ITEMS } from "./nav-items";
import { UserMenu, type SidebarUser } from "./user-menu";

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link
          href="/app/dashboard"
          onClick={() => setOpenMobile(false)}
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isNavItemActive(pathname, item.href)}
                  >
                    <Link href={item.href} onClick={() => setOpenMobile(false)}>
                      <item.icon aria-hidden="true" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
```

- [ ] **Step 5: `src/components/layout/app-header.tsx`**

```tsx
"use client";

import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { isNavItemActive, NAV_ITEMS } from "./nav-items";

export function AppHeader() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => isNavItemActive(pathname, item.href));

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="-ml-1" aria-label="Abrir ou fechar menu" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <span className="text-sm font-medium">{current?.title}</span>
      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 6: `src/app/app/layout.tsx`**

```tsx
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getCurrentProfile } from "@/data/profile";
import { requireUserId } from "@/lib/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  await requireUserId();
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Perfil não encontrado.");
  }

  const user = {
    name: profile.name || profile.email,
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <AppHeader />
        <div className="flex-1 p-4 md:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
```

- [ ] **Step 7: `src/app/app/page.tsx`**

```tsx
import { redirect } from "next/navigation";

import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/safe-redirect";

export default function AppIndexPage() {
  redirect(DEFAULT_AUTHENTICATED_PATH);
}
```

- [ ] **Step 8: `src/app/app/loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-8" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-56 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
```

- [ ] **Step 9: `src/components/dashboard/welcome-card.tsx`**

```tsx
import { CowPattern } from "@/components/brand/cow-pattern";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function WelcomeCard({ firstName }: { firstName: string | null }) {
  return (
    <Card className="relative overflow-hidden">
      <CowPattern className="opacity-[0.04] dark:opacity-[0.06]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/15 blur-3xl"
      />
      <CardHeader className="relative">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Olá{firstName ? `, ${firstName}` : ""} <span aria-hidden="true">👋</span>
        </h1>
        <p className="text-lg font-medium">Bem-vindo ao O mão de vaca.</p>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <p className="max-w-2xl text-muted-foreground">
          Aqui você vai acompanhar suas finanças, entender para onde seu dinheiro
          está indo e descobrir onde dá para economizar.
        </p>
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="font-medium">Estamos começando sua vida financeira por aqui.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Na próxima etapa você poderá cadastrar suas contas e começar a
            organizar suas movimentações.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 10: `src/components/dashboard/coming-soon-card.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ComingSoonCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ComingSoonCard({ title, description, icon: Icon }: ComingSoonCardProps) {
  return (
    <Card aria-disabled="true" className="border-dashed bg-muted/40 shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-base">
          <span className="flex size-9 items-center justify-center rounded-lg bg-background text-muted-foreground ring-1 ring-border">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {title}
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">Em breve</Badge>
        </CardAction>
        <CardDescription className="pt-2">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
```

- [ ] **Step 11: `src/app/app/dashboard/page.tsx`**

```tsx
import { ArrowLeftRight, Landmark, Target, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoonCard } from "@/components/dashboard/coming-soon-card";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { getCurrentProfile } from "@/data/profile";

export const metadata: Metadata = {
  title: "Dashboard",
};

const COMING_SOON = [
  {
    title: "Contas",
    description: "Cadastre contas e carteiras para saber quanto você tem em cada lugar.",
    icon: Landmark,
  },
  {
    title: "Transações",
    description: "Registre entradas e saídas e veja para onde o dinheiro está indo.",
    icon: ArrowLeftRight,
  },
  {
    title: "Orçamentos",
    description: "Defina limites por categoria e evite sustos no fim do mês.",
    icon: Target,
  },
  {
    title: "Investimentos",
    description: "Acompanhe seus investimentos e quanto eles estão rendendo.",
    icon: TrendingUp,
  },
];

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const firstName = profile?.name?.trim().split(/\s+/)[0] || null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WelcomeCard firstName={firstName} />
      <section aria-labelledby="em-breve" className="space-y-4">
        <h2 id="em-breve" className="font-heading text-lg font-semibold">
          O que vem por aí
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {COMING_SOON.map((item) => (
            <ComingSoonCard key={item.title} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 12: Verificar**

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Expected: os três passam; o build lista `ƒ /app` e `ƒ /app/dashboard`.

Com a env fictícia (como na Task 4, Step 15) e `pnpm start -p 3456`:

```bash
for u in "/app" "/app/dashboard" "/app/dashboard?x=1"; do
  printf "%-24s " "$u"; curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" "http://localhost:3456$u"
done
```

Expected: todos retornam `307 -> http://localhost:3456/?next=<caminho codificado>`. A UI autenticada só pode ser vista com um projeto Supabase real (checklist do README). Encerre o servidor pelo PID e remova o `.env.local`.

- [ ] **Step 13: Commit**

```bash
git add src
git commit -m "feat: add authenticated shell with responsive sidebar and empty-state dashboard

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Página de configurações

**Files:**
- Create: `src/app/app/configuracoes/actions.ts`, `src/components/settings/profile-form.tsx`, `src/app/app/configuracoes/page.tsx`

**Interfaces:**
- Consumes:
  - `requireUserId` (Task 3)
  - `profileUpdateSchema` / `ProfileUpdate` (Task 3)
  - `updateCurrentProfile` / `getCurrentProfile` (Task 3)
  - constantes de `@/lib/preferences` (Task 3)
  - `UserAvatar` (Task 5)
  - `ThemeSelect` (Task 4)
- Produces:
  - Server Action `updateProfileAction(prev: ProfileFormState, formData: FormData): Promise<ProfileFormState>`
  - tipo `ProfileFormState = { ok: boolean; message?: string; fieldErrors?: Partial<Record<keyof ProfileUpdate, string[]>> }`

- [ ] **Step 1: `src/app/app/configuracoes/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updateCurrentProfile } from "@/data/profile";
import { requireUserId } from "@/lib/auth/session";
import {
  profileUpdateSchema,
  type ProfileUpdate,
} from "@/lib/validations/profile";

export type ProfileFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Partial<Record<keyof ProfileUpdate, string[]>>;
};

export async function updateProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  await requireUserId();

  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
    currency: formData.get("currency"),
    locale: formData.get("locale"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const saved = await updateCurrentProfile(parsed.data);

  if (!saved) {
    return {
      ok: false,
      message: "Não foi possível salvar suas alterações. Tente novamente.",
    };
  }

  revalidatePath("/app", "layout");
  return { ok: true, message: "Alterações salvas." };
}
```

- [ ] **Step 2: `src/components/settings/profile-form.tsx`**

Os selects ficam **habilitados**, mesmo com uma única opção: um `<select>` desabilitado não é enviado no `FormData`, e a validação falharia.

```tsx
"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  updateProfileAction,
  type ProfileFormState,
} from "@/app/app/configuracoes/actions";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CURRENCIES,
  CURRENCY_LABELS,
  LOCALES,
  LOCALE_LABELS,
  TIMEZONES,
  TIMEZONE_LABELS,
} from "@/lib/preferences";

export type ProfileFormValues = {
  name: string;
  email: string;
  avatarUrl: string | null;
  currency: string;
  locale: string;
  timezone: string;
};

const initialState: ProfileFormState = { ok: false };

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="text-sm text-destructive">
      {messages[0]}
    </p>
  );
}

type PreferenceSelectProps = {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  options: readonly string[];
  labels: Record<string, string>;
  errors?: string[];
};

function PreferenceSelect({
  id,
  name,
  label,
  defaultValue,
  options,
  labels,
  errors,
}: PreferenceSelectProps) {
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={errors?.length ? errorId : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labels[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError id={errorId} messages={errors} />
    </div>
  );
}

export function ProfileForm({ profile }: { profile: ProfileFormValues }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.ok) {
      toast.success(state.message);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const nameErrors = state.fieldErrors?.name;

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
          <CardDescription>Como você aparece no O mão de vaca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={profile.name || profile.email}
              avatarUrl={profile.avatarUrl}
              className="size-16 text-lg"
            />
            <p className="text-sm text-muted-foreground">
              A foto vem da sua conta Google.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={profile.name}
              maxLength={100}
              autoComplete="name"
              required
              aria-invalid={nameErrors?.length ? true : undefined}
              aria-describedby={nameErrors?.length ? "name-error" : undefined}
            />
            <FieldError id="name-error" messages={nameErrors} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              readOnly
              aria-describedby="email-hint"
              className="bg-muted text-muted-foreground"
            />
            <p id="email-hint" className="text-sm text-muted-foreground">
              Vem da sua conta Google e não pode ser alterado aqui.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferências</CardTitle>
          <CardDescription>
            Usadas para formatar valores e datas. Mais opções em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-3">
          <PreferenceSelect
            id="currency"
            name="currency"
            label="Moeda"
            defaultValue={profile.currency}
            options={CURRENCIES}
            labels={CURRENCY_LABELS}
            errors={state.fieldErrors?.currency}
          />
          <PreferenceSelect
            id="locale"
            name="locale"
            label="Idioma e região"
            defaultValue={profile.locale}
            options={LOCALES}
            labels={LOCALE_LABELS}
            errors={state.fieldErrors?.locale}
          />
          <PreferenceSelect
            id="timezone"
            name="timezone"
            label="Fuso horário"
            defaultValue={profile.timezone}
            options={TIMEZONES}
            labels={TIMEZONE_LABELS}
            errors={state.fieldErrors?.timezone}
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
```

- [ ] **Step 3: `src/app/app/configuracoes/page.tsx`**

```tsx
import type { Metadata } from "next";

import { ProfileForm } from "@/components/settings/profile-form";
import { ThemeSelect } from "@/components/theme/theme-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/data/profile";

export const metadata: Metadata = {
  title: "Configurações",
};

export default async function SettingsPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    throw new Error("Perfil não encontrado.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie seu perfil e suas preferências.</p>
      </div>

      <ProfileForm
        profile={{
          name: profile.name ?? "",
          email: profile.email,
          avatarUrl: profile.avatar_url,
          currency: profile.currency,
          locale: profile.locale,
          timezone: profile.timezone,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>Escolha como o O mão de vaca aparece para você.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelect />
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verificar**

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Expected: os três passam, e o build lista `ƒ /app/configuracoes`. Com a env fictícia, `curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3456/app/configuracoes` deve retornar `307 -> http://localhost:3456/?next=%2Fapp%2Fconfiguracoes`. Ao final, remova o `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add src
git commit -m "feat: add settings page with profile and preferences form

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: README e verificação final

**Files:**
- Modify: `README.md` (substituir o gerado pelo create-next-app)

**Interfaces:**
- Consumes: tudo das tasks anteriores (nomes de env, caminhos de migration e script de RLS).

- [ ] **Step 1: Escrever `README.md` (substituir inteiro)**

````markdown
# O mão de vaca

Gerenciador financeiro pessoal. Seu dinheiro merece mais controle e menos sustos.

> **Status: Fase 0 — Scaffold.** Fundação técnica pronta: autenticação com Google, perfil do usuário, área autenticada, configurações e tema claro/escuro. Nenhuma funcionalidade financeira ainda.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components, Server Actions, `proxy.ts`)
- React 19 + TypeScript (strict)
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Radix) + Lucide Icons
- [Supabase](https://supabase.com): PostgreSQL, Auth (Google OAuth), Row Level Security
- `@supabase/ssr` + `@supabase/supabase-js` (sessão em cookies)
- Zod (validação), next-themes (tema), sonner (toasts)
- pnpm · Vercel

## Arquitetura

```text
src/
  app/          Rotas (App Router). / pública, /auth/* login, /app/** autenticada
  components/   UI: ui/ (shadcn), brand/, theme/, layout/, auth/, dashboard/, settings/
  data/         Acesso a dados (server-only). Ex.: profile.ts → getCurrentProfile()
  lib/          Infraestrutura: supabase/ (clients), auth/ (sessão, redirect seguro), validations/ (Zod), preferences.ts
  proxy.ts      Renova a sessão do Supabase e faz redirect otimista de /app/**
supabase/
  migrations/   SQL versionado (schema, triggers, RLS)
  tests/        Script manual de verificação de RLS
```

**Segurança em camadas:**

1. `src/proxy.ts`: renova os cookies da sessão e redireciona visitantes sem sessão para fora de `/app/**`. É só uma otimização.
2. Servidor: o layout de `/app` e todas as Server Actions validam a sessão com `supabase.auth.getClaims()`. O id do usuário vem sempre da sessão, nunca do client.
3. Banco: RLS em `profiles` (cada usuário só lê e altera a própria linha) e privilégios por coluna (só `name`, `currency`, `locale` e `timezone` são editáveis).

Componentes nunca chamam o Supabase diretamente para dados de domínio: eles usam as funções de `src/data/`.

## Rodando localmente

Pré-requisitos: Node.js 20.9+ (recomendado 24), pnpm 9+ e um projeto Supabase com o Google configurado (veja as seções abaixo).

```bash
pnpm install
cp .env.example .env.local   # preencha com os dados do seu projeto
pnpm dev                     # http://localhost:3000
```

Scripts:

| Comando | O que faz |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | Gera os tipos de rota do Next e roda `tsc --noEmit` |
| `pnpm build` | Build de produção |
| `pnpm start` | Serve o build |

## Supabase

1. Crie um projeto em <https://supabase.com/dashboard>. Guarde o **Project ref** (o subdomínio de `https://<project-ref>.supabase.co`).
2. Em **Project Settings → API Keys**, copie a **publishable key** (`sb_publishable_...`).
3. A **Project URL** aparece no botão **Connect** (ou em **Project Settings → Data API**).
4. Aplique as migrations (veja abaixo).
5. Configure o Google OAuth e as URLs de autenticação (veja abaixo).

> Nunca use a `service_role`/secret key nesta aplicação. Ela ignora o RLS e não deve existir em nenhuma variável `NEXT_PUBLIC_*`.

## Google OAuth

### 1. Google Cloud Console

1. Acesse <https://console.cloud.google.com>. Crie um projeto ou selecione um existente.
2. Abra **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - **Branding:** nome do app ("O mão de vaca"), email de suporte e logo opcional.
   - **Audience:** *External*. Enquanto o app estiver em *Testing*, adicione seu email em *Test users*.
   - **Authorized domains:** `<project-ref>.supabase.co` e o seu domínio de produção, se houver.
   - **Data access (scopes):** `openid`, `.../auth/userinfo.email` e `.../auth/userinfo.profile`.
3. Em **Clients → Create client**, escolha o tipo **Web application**:
   - **Authorized JavaScript origins:** `http://localhost:3000` e a URL de produção (ex.: `https://omaodevaca.vercel.app`).
   - **Authorized redirect URIs:** `https://<project-ref>.supabase.co/auth/v1/callback`. É o Supabase quem recebe o retorno do Google, não a nossa aplicação.
4. Copie o **Client ID** e o **Client Secret**.

### 2. Supabase Dashboard

1. Em **Authentication → Sign In / Providers → Google**, ative o provider e cole o **Client ID** e o **Client Secret**. O *Callback URL* mostrado ali é o mesmo que foi cadastrado no Google.
2. Em **Authentication → URL Configuration**:
   - **Site URL:** a URL de produção (ex.: `https://omaodevaca.vercel.app`). Para desenvolvimento sem produção, `http://localhost:3000`.
   - **Redirect URLs:** veja [Auth URLs](#auth-urls).

> O Client Secret fica **somente** no Supabase. Ele nunca vai para o código nem para variáveis de ambiente da aplicação.

## Migrations

As migrations ficam em `supabase/migrations/` e são aplicadas em ordem.

**Opção A: SQL Editor (mais simples).** No dashboard, abra **SQL Editor**, cole o conteúdo de `supabase/migrations/20261005000000_create_profiles.sql` e execute.

**Opção B: Supabase CLI.**

```bash
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <project-ref>
pnpm dlx supabase db push
```

**Verificando o RLS.** Depois de aplicar, rode `supabase/tests/rls-check.sql` no SQL Editor. O script cria usuários de teste numa transação desfeita no final e precisa terminar com o aviso `Todas as verificações passaram`. Qualquer falha aparece como erro `FALHOU: ...`.

## Environment Variables

| Variável | Onde obter | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Connect / Data API | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys | Chave pública do client; a proteção dos dados vem do RLS |
| `NEXT_PUBLIC_APP_URL` | URL onde o app roda | `metadataBase` (SEO/OG). O login usa a origem real da requisição, então previews funcionam sem ajustar esta variável |

O `.env.local` nunca é versionado. O modelo está em `.env.example`.

## Deploy Vercel

1. Envie o repositório para o GitHub, GitLab ou Bitbucket.
2. Em <https://vercel.com/new>, importe o projeto. O framework (Next.js) e o pnpm são detectados automaticamente.
3. Em **Settings → Environment Variables**, cadastre:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nos ambientes **Production** e **Preview** (e Development, se usar `vercel dev`);
   - `NEXT_PUBLIC_APP_URL` em **Production** com o domínio final (ex.: `https://omaodevaca.vercel.app`).
4. Faça o deploy.
5. Volte ao Supabase e ao Google e cadastre as URLs de produção e preview (veja abaixo).

## Auth URLs

O fluxo é: app → Supabase → Google → Supabase → `https://<origem-do-app>/auth/callback` → `/app/dashboard`.

O Supabase só redireciona de volta para URLs que estão na lista **Authentication → URL Configuration → Redirect URLs**. Cadastre uma por ambiente:

| Ambiente | Redirect URL no Supabase | Observação |
|---|---|---|
| Local | `http://localhost:3000/**` | Desenvolvimento com `pnpm dev` |
| Preview (Vercel) | `https://*-<team-slug>.vercel.app/**` | Cobre todos os deploys de preview do time. Troque `<team-slug>` pelo slug do seu time ou conta na Vercel |
| Produção | `https://<seu-dominio>/**` | Domínio final; também é o **Site URL** |

No Google Cloud, apenas o redirect URI do Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`) é necessário, e ele vale para todos os ambientes. As *JavaScript origins* são opcionais para este fluxo, mas é boa prática cadastrar localhost e produção.

Se o login cair na URL errada (por exemplo, sempre em produção), a origem atual quase certamente não está na lista de Redirect URLs. Nesse caso o Supabase usa o **Site URL** como fallback.

## Checklist manual de verificação

Use com um projeto Supabase real configurado:

- [ ] `pnpm lint`, `pnpm typecheck` e `pnpm build` passam
- [ ] **Primeiro acesso:** `/` → Entrar com Google → `/app/dashboard`. Uma linha nova aparece em `public.profiles`, com nome e avatar do Google
- [ ] **Usuário existente:** sair e entrar de novo não cria profile duplicado
- [ ] **Área protegida:** em aba anônima, `/app/dashboard` redireciona para `/?next=%2Fapp%2Fdashboard`. Após o login, o usuário volta para `/app/dashboard`
- [ ] **Redirect seguro:** `/?next=https://example.com` e `/auth/callback?next=//example.com` nunca saem do app
- [ ] **Refresh:** recarregar `/app/dashboard` mantém a sessão
- [ ] **Logout:** menu do usuário → Sair → `/`. Depois disso, `/app/dashboard` volta a exigir login
- [ ] **Dashboard:** mostra o primeiro nome real e os quatro cards "Em breve", sem valores financeiros
- [ ] **Avatar:** a foto do Google aparece na sidebar e nas configurações; sem foto, aparecem as iniciais
- [ ] **Configurações:** alterar o nome mostra o toast "Alterações salvas." e atualiza a sidebar. Nome vazio mostra erro no campo
- [ ] **Email:** não é editável na UI. O banco recusa a alteração (coberto pelo `rls-check.sql`)
- [ ] **RLS:** `supabase/tests/rls-check.sql` termina com "Todas as verificações passaram"
- [ ] **Erro de login:** `/auth/callback` sem `code` leva a `/auth/erro` com mensagem amigável
- [ ] **Tema:** Claro/Escuro/Sistema funcionam no header e nas configurações, persistem após recarregar e não piscam
- [ ] **Mobile (≤ 375px):** a sidebar vira menu lateral, a navegação funciona por teclado (Tab/Enter/Esc) e nada estoura a largura

## Próximas fases

- Fase 1 — Contas e categorias
- Fase 2 — Transações
- Fase 3 — Cartões de crédito
- Fase 4 — Orçamentos e metas
- Fase 5 — Dashboard e análises
- Fase 6 — Importações e Open Finance
- Fase 7 — Inteligência e automações
````

- [ ] **Step 2: Varredura de qualidade**

```bash
pnpm lint && pnpm typecheck && pnpm build
```

Depois, use a ferramenta de busca (Grep) em `src/` para confirmar que não sobrou nada indevido. Os três critérios abaixo devem retornar zero resultados:
- `console\.log`
- `service_role|SERVICE_ROLE` (também em `.env.example`)
- valores monetários fake (`R\$ ?\d`)

Expected: lint, typecheck e build passam, e as três buscas não encontram nada.

- [ ] **Step 3: Revisão visual final (env fictícia)**

Repita o Step 15 da Task 4. Confira a landing e `/auth/erro` em claro, escuro e a 375px, e encerre o servidor pelo PID. Remova o `.env.local`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, OAuth, migrations, deploy and checklist

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Relatório final ao usuário**

Apresente:
1. um resumo do que foi criado (rotas, componentes, migration);
2. as variáveis de ambiente necessárias (tabela do README);
3. os passos manuais pendentes:
   - no Supabase: criar o projeto, aplicar a migration, rodar o `rls-check.sql`, ativar o Google e configurar o Site URL e as Redirect URLs;
   - no Google Cloud: consent screen e OAuth client;
   - na Vercel: importar o projeto, cadastrar as env vars e fazer o deploy;
4. os itens do checklist que só podem ser verificados com um projeto Supabase real.
