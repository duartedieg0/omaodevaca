# Fase 0 — Scaffold · Design

- **Data:** 2026-10-05
- **Fonte dos requisitos:** `prompts/Fase0-Scaffold.md` (este documento registra apenas as decisões de design; requisitos não repetidos aqui continuam valendo conforme o prompt)
- **Status:** aprovado em brainstorming

## 1. Objetivo

Entregar a fundação do **O mão de vaca**: Next.js + Supabase com login exclusivo via Google OAuth, área autenticada protegida, tabela `profiles` com RLS, dashboard em empty state, página de configurações, dark mode, README completo e build passando. Nenhuma funcionalidade financeira.

## 2. Decisões tomadas no brainstorming

| Tema | Decisão |
|---|---|
| Supabase | **Só código.** Gerar migrations e código; nada é aplicado em banco nesta fase. O README explica como aplicar. |
| Preferências | **Valor único por ora:** `BRL`, `pt-BR`, `America/Sao_Paulo`. Campos exibidos como selects de uma opção ("mais opções em breve"). |
| Paleta | Preto (degradês em cinza), branco e verde musgo/esmeralda. Referência sutil a "vaca" (manchas preto/branco). |
| Testes | **Nenhum teste automatizado.** Checklist manual no README + script SQL manual de RLS. Lint, typecheck e build obrigatórios. |
| Proteção de rotas | `proxy.ts` (refresh de sessão + redirect rápido) **e** verificação no servidor (layout + Server Actions) **e** RLS. |
| Tema | `next-themes` (light/dark/system, localStorage, sem flash). |

## 3. Stack

Versões estáveis atuais no momento da implementação: Next.js (App Router, `proxy.ts`), React, TypeScript (`strict: true`), Tailwind CSS v4, shadcn/ui, Lucide, `@supabase/supabase-js`, `@supabase/ssr`, Zod, `next-themes`, `sonner` (via shadcn). Package manager: pnpm. Deploy: Vercel.

Nenhuma outra dependência sem necessidade real.

## 4. Arquitetura

### 4.1 Estrutura de diretórios

```text
src/
  proxy.ts                        # chama updateSession; redirect rápido /app/** → /
  app/
    layout.tsx                    # ThemeProvider, fontes, Toaster, metadata
    globals.css                   # tokens OKLCH (light/dark)
    page.tsx                      # landing; usuário logado → /app/dashboard
    auth/
      callback/route.ts           # exchangeCodeForSession + safeRedirect(next)
      erro/page.tsx               # erro genérico de autenticação
    app/
      layout.tsx                  # requireUser() + getCurrentProfile(); SidebarProvider
      loading.tsx                 # skeletons
      error.tsx                   # erro genérico + "Tentar novamente"
      dashboard/page.tsx
      configuracoes/
        page.tsx
        actions.ts                # updateProfileAction
  components/
    ui/                           # shadcn (gerados)
    brand/logo.tsx                # HandCoins + "O mão de vaca"
    brand/cow-pattern.tsx         # SVG inline de manchas, baixa opacidade
    layout/
      app-sidebar.tsx             # composição do shadcn Sidebar
      app-header.tsx              # SidebarTrigger + título + ThemeToggle
      user-menu.tsx               # avatar/nome/email + Dropdown (Configurações, Sair)
      theme-toggle.tsx
    auth/
      google-login-button.tsx     # client
      sign-out-button.tsx
    settings/
      profile-form.tsx            # client, useActionState
      theme-select.tsx            # client
    dashboard/
      welcome-card.tsx
      coming-soon-card.tsx
    theme-provider.tsx
  lib/
    supabase/
      client.ts                   # createBrowserClient
      server.ts                   # createServerClient (cookies())
      proxy.ts                    # updateSession(request)
    auth/
      safe-redirect.ts
      require-user.ts             # server-only
      actions.ts                  # signOut (Server Action)
    validations/
      profile.ts                  # schema Zod
    preferences.ts                # constantes, defaults, tipo UserPreferences
  data/
    profile.ts                    # server-only: getCurrentProfile, updateCurrentProfile
supabase/
  migrations/20261005000000_create_profiles.sql
  tests/rls-check.sql             # verificação manual de RLS
.env.example
README.md
```

O `mobile-nav.tsx` sugerido no prompt não existe como arquivo separado: o shadcn `Sidebar` já fornece o drawer mobile (Sheet), o foco gerenciado e a navegação por teclado.

### 4.2 Fluxo de autenticação

1. `google-login-button` (client) chama `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${next}` } })`. Usar `window.location.origin` faz o fluxo funcionar em localhost, preview e produção sem domínio hardcoded. O `next` vem do parâmetro `?next=` da landing, quando existir.
2. Google → Supabase → `/auth/callback?code=...&next=...`.
3. `auth/callback/route.ts`:
   - sem `code` ou com `error` → redirect `/auth/erro`;
   - `exchangeCodeForSession(code)`; em falha → redirect `/auth/erro`;
   - sucesso → redirect `safeRedirect(next)` na própria origem da requisição.
4. Logout: Server Action `signOut()` → `supabase.auth.signOut()` → `redirect("/")`.

### 4.3 `safeRedirect(next)`

Retorna `next` somente se for um caminho relativo que começa com `/app/` (ou é exatamente `/app`), e não contém `//`, `\`, esquema (`:`) antes da primeira `/` nem caracteres de controle. Qualquer outro valor (inclusive ausente) → `/app/dashboard`. O redirect final sempre é montado como `new URL(path, origin)` com a origem da requisição.

### 4.4 Proteção em camadas

1. **`proxy.ts`:** usa `updateSession` (padrão oficial `@supabase/ssr`) para renovar os cookies da sessão. Se a rota é `/app/**` e não há usuário, redireciona para `/` preservando `?next=` com o caminho original. O matcher exclui assets estáticos e imagens.
2. **Servidor:** `requireUser()` (via `supabase.auth.getClaims()`, que valida o JWT) no `app/app/layout.tsx`; sem usuário → `redirect("/")`. As funções do `data/profile.ts` e todas as Server Actions também obtêm o usuário da sessão e nunca recebem `user_id` do client.
3. **Banco:** RLS + privilégios por coluna (seção 5).

### 4.5 Data Access Layer

`src/data/profile.ts` (`import "server-only"`):

- `getCurrentProfile(): Promise<Profile | null>`: obtém o usuário da sessão e faz select em `profiles` por `id`.
- `updateCurrentProfile(input: ProfileUpdate): Promise<{ ok: true } | { ok: false }>`: faz update apenas de `name`, `currency`, `locale`, `timezone` onde `id = usuário da sessão`.

Os componentes não chamam o Supabase diretamente para dados de profile.

### 4.6 Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Nenhuma service role key. `NEXT_PUBLIC_APP_URL` é usada em metadata (`metadataBase`) e documentação; o fluxo OAuth usa a origem real da requisição. O `.env.local` é ignorado pelo git.

## 5. Banco de dados

Uma única migration: `supabase/migrations/20261005000000_create_profiles.sql`.

### 5.1 Tabela `public.profiles`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | `uuid` | PK, `references auth.users(id) on delete cascade` |
| `name` | `text` | nullable, `char_length(name) <= 100` |
| `email` | `text` | `not null` |
| `avatar_url` | `text` | nullable |
| `currency` | `text` | `not null default 'BRL'`, `check (currency ~ '^[A-Z]{3}$')` |
| `locale` | `text` | `not null default 'pt-BR'`, `check (char_length(locale) between 2 and 35)` |
| `timezone` | `text` | `not null default 'America/Sao_Paulo'`, `check (char_length(timezone) between 1 and 64)` |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()` |

As constraints validam formato, não uma lista de valores. A restrição ao valor único fica no Zod, então ampliar opções não exige migration.

### 5.2 Funções e triggers

- `public.set_updated_at()` com trigger `before update on public.profiles`.
- `public.handle_new_user()`: `security definer`, `set search_path = ''`, nomes totalmente qualificados. Trigger `after insert on auth.users`.

  ```text
  meta       = coalesce(new.raw_user_meta_data, '{}'::jsonb)
  email      = coalesce(new.email, meta->>'email', '')
  name       = coalesce(nullif(trim(meta->>'full_name'), ''),
                        nullif(trim(meta->>'name'), ''),
                        nullif(split_part(email, '@', 1), ''))
               truncado em 100 caracteres
  avatar_url = coalesce(nullif(meta->>'avatar_url', ''), nullif(meta->>'picture', ''))
  insert ... on conflict (id) do nothing
  ```

  Nenhum metadado é tratado como obrigatório. O usuário existente não dispara o trigger, e o `on conflict` impede duplicidade em qualquer caso.
- `revoke execute on function public.handle_new_user() from public, anon, authenticated`.

### 5.3 RLS e privilégios

```text
alter table public.profiles enable row level security;

policy "profiles_select_own"  for select to authenticated using ((select auth.uid()) = id)
policy "profiles_update_own"  for update to authenticated using ((select auth.uid()) = id)
                                                          with check ((select auth.uid()) = id)
-- sem policies de insert/delete: insert só via trigger; delete via cascade de auth.users

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (name, currency, locale, timezone) on public.profiles to authenticated;
```

Os privilégios por coluna garantem no banco que o usuário não altera `email`, `avatar_url`, `id` nem timestamps, mesmo chamando a API diretamente.

### 5.4 `supabase/tests/rls-check.sql`

Script manual executado dentro de uma transação com `rollback`. Ele cria dois usuários de teste em `auth.users`, simula cada um com `set local role authenticated` + `set local request.jwt.claims` e verifica:

1. o trigger criou os dois profiles com os metadados esperados e os fallbacks;
2. A lê o próprio profile;
3. A não vê o profile de B (0 linhas);
4. o update de A no profile de B afeta 0 linhas;
5. A não consegue alterar o próprio `email` (erro de permissão);
6. A atualiza o próprio `name`.

Cada verificação usa `raise exception` em caso de falha, para que o resultado seja inequívoco.

## 6. UI e UX

### 6.1 Identidade

- **Marca:** ícone Lucide `HandCoins` + "O mão de vaca". O título usa Bricolage Grotesque e o corpo usa Geist, ambas via `next/font` (self-hosted).
- **Paleta (tokens OKLCH em `globals.css`):**
  - Light: fundo branco levemente frio, texto quase preto, escala de cinzas neutros.
  - Dark: grafite profundo com degradês sutis de cinza.
  - `primary`: verde esmeralda/musgo, mais claro no dark para manter contraste AA.
  - Nenhuma outra cor de destaque além de `destructive`.
- **Motivo "vaca":** `cow-pattern.tsx`, um SVG inline de manchas irregulares com opacidade de ~4–6%, usado só como textura na landing e no card de boas-vindas. Sem porquinhos, cifrões ou memes.

### 6.2 Landing (`/`)

- Header mínimo com logo e toggle de tema.
- Hero centralizado: "O mão de vaca", "Seu dinheiro merece mais controle e menos sustos.", "Organize sua vida financeira de forma simples, visual e sem complicação." e o botão **Entrar com Google** (ícone G em SVG inline).
- Ao clicar, o botão fica desabilitado e mostra "Redirecionando…" com spinner.
- Usuário já autenticado é redirecionado para `/app/dashboard`.

### 6.3 Layout autenticado

- shadcn `Sidebar`: fixa no desktop e em drawer no mobile.
- **Sidebar:** marca no topo; menu com Dashboard (`LayoutDashboard`) e Configurações (`Settings`), com item ativo via `usePathname`; no rodapé o `user-menu` com avatar, nome e email.
- **`user-menu`:** DropdownMenu com Configurações e **Sair**.
- **Header:** `SidebarTrigger`, título da página e `ThemeToggle` (Claro/Escuro/Sistema).
- **Avatar:** shadcn `Avatar` com a URL do Google e `referrerPolicy="no-referrer"`; o fallback são as iniciais do nome (ou do email).

### 6.4 Dashboard (`/app/dashboard`)

- `welcome-card` com "Olá, {primeiro nome} 👋", "Bem-vindo ao O mão de vaca." e "Aqui você vai acompanhar suas finanças, entender para onde seu dinheiro está indo e descobrir onde dá para economizar."
- Abaixo: "Estamos começando sua vida financeira por aqui." e "Na próxima etapa você poderá cadastrar suas contas e começar a organizar suas movimentações."
- Grade (2×2 no desktop, 1 coluna no mobile) de `coming-soon-card`: Contas (`Landmark`), Transações (`ArrowLeftRight`), Orçamentos (`Target`), Investimentos (`TrendingUp`).
  - Cada card tem uma frase curta e o badge **Em breve**.
  - Visual atenuado, `aria-disabled="true"`, não são links.
- Nenhum valor monetário, nem fake.

### 6.5 Configurações (`/app/configuracoes`)

- **Perfil:** avatar, nome (editável) e email (read-only, com a nota "Vem da sua conta Google e não pode ser alterado aqui.").
- **Preferências:** moeda, idioma/região e timezone como selects de uma única opção, com a nota "Mais opções em breve".
- **Aparência:** seletor de tema (Claro/Escuro/Sistema).
- O formulário de perfil e preferências é único, com `useActionState`.
  - Botão "Salvando…" enquanto pendente.
  - Erros de campo inline.
  - Toast (sonner) de sucesso ou erro geral.
  - `revalidatePath("/app", "layout")` após sucesso, para a sidebar refletir o novo nome.

### 6.6 Validação (`lib/validations/profile.ts`)

```text
name:     string, trim, min 1 ("Informe seu nome"), max 100
currency: z.enum(CURRENCIES)   // ["BRL"]
locale:   z.enum(LOCALES)      // ["pt-BR"]
timezone: z.enum(TIMEZONES)    // ["America/Sao_Paulo"]
```

As constantes e o tipo `UserPreferences` ficam em `lib/preferences.ts`. Formatadores não são criados agora, porque ainda não teriam uso.

### 6.7 Estados de carregamento e erro

| Situação | Feedback |
|---|---|
| Login em andamento | botão desabilitado + "Redirecionando…" |
| Callback | route handler sem UI; falha → `/auth/erro` |
| Erro de autenticação | `/auth/erro`: "Não foi possível entrar. Tente novamente." + botão para `/` |
| Carregamento de `/app/**` | `loading.tsx` com skeletons |
| Erro inesperado em `/app/**` | `error.tsx` genérico + "Tentar novamente" |
| Salvando configurações | botão pendente; toast de sucesso |
| Erro ao salvar | toast "Não foi possível salvar suas alterações." + erros de campo |

A Server Action retorna `{ ok: boolean; message?: string; fieldErrors?: Record<string, string[]> }`. Mensagens do Supabase nunca chegam ao usuário. Não há `console.log` no código final.

## 7. README

Seções exigidas pelo item 34 do prompt, além de:

- como aplicar a migration (SQL Editor do dashboard ou `supabase db push` com a CLI);
- passo a passo do Google Cloud Console e do Supabase Dashboard (itens 1–10 do prompt);
- URLs de auth: Site URL, `http://localhost:3000/**`, `https://*-<team>.vercel.app/**` para previews e o domínio de produção;
- variáveis de ambiente na Vercel (Production e Preview);
- **checklist manual de verificação:** os fluxos do item 31 (primeiro acesso, usuário existente, área protegida, logout), refresh da sessão, edição do profile, execução de `supabase/tests/rls-check.sql`, mobile e dark mode.

## 8. Qualidade e critérios de conclusão

- `pnpm lint`, `pnpm exec tsc --noEmit` e `pnpm build` passam sem erros. O build funciona com variáveis de ambiente de placeholder.
- Sem imports não usados, `console.log` ou código morto.
- Os critérios de aceite do item 35 do prompt que dependem de um projeto Supabase real (login, criação de profile, RLS) são verificados pelo usuário via checklist do README, já que nesta fase nada é aplicado em banco.

## 9. Fora do escopo

Tudo do item 33 do prompt (accounts, transactions, categories, budgets, credit_cards, investments, goals, recurrences, imports, open_finance, notifications, ai) e também:

- sincronização de email/avatar quando mudam no Google;
- persistir o tema no profile;
- testes automatizados;
- opções adicionais de moeda/idioma/timezone.
