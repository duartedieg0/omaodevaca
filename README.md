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
| Produção | `https://<seu-domínio>/**` | Domínio final; também é o **Site URL** |

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
