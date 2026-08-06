# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The web tier of xiaoheiFS (小黑云) — **one** Vue 3 SPA, served by the Go backend from
`./static`, carrying four realms:

| Realm | Routes | Auth |
|---|---|---|
| Public site | `/`, `/products`, `/help`, `/docs`, `/announcements`, `/activities`, `/tutorials`, `/:category/:slug` | none |
| Commerce (public) | `/buy`, `/cart` | none until checkout |
| Auth / installer | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/install` | none |
| User console | `/console/*` | `stores/auth` (`user_token`) |
| Admin console | `/<admin_path>/*` — the prefix is an operator setting, resolved and registered at runtime | `stores/adminAuth` (`admin_token`) |

Routing is **history mode**. The backend falls back to `index.html` for any non-API GET
that does not resolve to a file, so there are no hash URLs anywhere.

## UI standard: Art Design Pro (Element Plus)

**Read `../docs/frontend/adp-conventions.md` before writing any page.** It is the extracted
API reference for the template: `useTable`, `ArtTable`, `ArtTableHeader`, `ArtSearchBar`,
`ArtForm`, the full `--art-*` custom property list, the route `meta` schema, and the
gotchas that silently break things.

Non-negotiable rules:

- List pages use `useTable` + `ArtTable` + `ArtTableHeader` + `ArtSearchBar`. Do not
  hand-roll fetch/pagination.
- No hardcoded colours, no `!important`. Every page must be correct in light **and** dark.
- Pages live in `src/views/**` — the template's component loader globs
  `import.meta.glob('../../views/**/*.vue')`.
- Every page declares `defineOptions({ name: 'XxxYyy' })`; the multi-tab cache needs it.

Element Plus components, the `Art*` components, and the `vue` / `vue-router` / `pinia` /
`@vueuse/core` APIs are all auto-imported — do not import them by hand.

## Development Commands

```bash
npm i
npm run dev         # :5173
npm run typecheck   # vue-tsc --noEmit — keep this at zero
npm run lint        # eslint
npm run lint:stylelint
npm run build       # -> dist/, copied to ./static at deploy time
```

Node `20.19+` or `22.12+` (Vite 7). There is no frontend test runner yet, so
CONTRIBUTING.md's `npm test` does not apply here.

## API Proxy

Dev server proxies to the Go backend on `http://localhost:8080`: `/api`, `/admin/api`,
`/sdk`, `/uploads`. `VITE_API_BASE` can point the built app at an absolute backend.

Note there are **no `.env` files**: the repository's root `.gitignore` swallows `.env*`,
so the handful of template env vars are inlined via `define` in `vite.config.ts`.

## Directory Structure

```
src/
├── assets/styles/     # ADP style system (tailwind.css holds the --art-* vars, SCSS mixins)
├── components/
│   ├── core/          # ADP component library — vendored, do not edit
│   └── business/      # this project's shared components (Element Plus)
├── config/ enums/ directives/ hooks/ locales/ plugins/   # ADP infrastructure
├── router/
│   ├── core/          # RouteRegistry / ComponentLoader / MenuProcessor
│   ├── guards/        # three-realm guard: install gate, impersonation, auth, permissions
│   ├── realm.ts       # realm resolution + admin-path prefixing
│   ├── routes/        # static routes, split per area
│   └── modules/       # admin menu-routes, registered dynamically
├── services/          # API layer: http, user, admin, types, sse, adminPath
├── store/             # ADP infrastructure stores (setting/worktab/menu/table/user)
├── stores/            # business stores (auth/adminAuth/cart/orders/catalog/site/...)
└── views/             # pages
```

**Two store directories, on purpose.** Always write the full path — `@/store/modules/*`
for template infrastructure, `@/stores/*` for business state.

### Legacy code being removed

`src/pages`, `src/layouts`, and the Ant Design components at the top level of
`src/components` are the pre-migration UI. Nothing routes to them, they are excluded from
`tsconfig.json`, and they exist only as a porting reference. Do not add to them; do not
import from them. `ant-design-vue` is still in `package.json` for the same reason and is
removed once the last page is converted.

## API Layer Patterns

- One Axios instance in `services/http.ts`; tokens are injected by URL prefix (`/api` →
  user token, `/admin/api` → admin token), plus `X-API-Key` via the `withApiKey()` helper.
- Interceptor contracts that must not be broken: admin 2FA gate
  (`admin_2fa_required` / `admin_2fa_bind_required`), the real-name gate (single-instance
  confirm → `/console/realname`), 401 logout-and-redirect with `redirect`, 5xx
  notification. Errors are **always** re-rejected; callers `try/catch` for local state.
- `services/sse.ts` is a hand-written SSE client over `fetch` + `ReadableStream` (needed
  because `EventSource` cannot send `Authorization`), with `Last-Event-ID` resume and
  backoff. Used by order detail and probe detail.

## Backend Field Naming

The Go backend returns `snake_case`, `camelCase` and `PascalCase` depending on whether a
handler goes through a DTO or serialises a GORM model directly. Code uses `row.id ?? row.ID`
and the interfaces in `services/types.ts` declare both. **This is a real contract — do not
"normalise" it away.**

## Key Settings Keys

`robot_webhook_url`, `robot_webhook_key`, `smtp_host`, `smtp_port`, `smtp_user`,
`smtp_pass`, `smtp_from`, `email_enabled`, `email_expire_enabled`, `expire_reminder_days`,
`emergency_renew_days`, `emergency_renew_interval_hours`, `admin_path`.

## API Endpoints

**User** (`/api/v1/`): `captcha`, `auth/register`, `auth/login`, `me`, dashboard, catalog,
cart, orders, `vps`, `vps/{id}/*`, `orders/{id}/events` (SSE), wallet, tickets,
notifications, realname, CMS blocks/posts, settings.

**Admin** (`/admin/api/v1/`): `auth/login`, users, orders (approve/reject/retry), VPS
(lock/unlock/delete/resize/refresh/status/emergency-renew), catalog (regions, plan-groups,
packages, system-images), settings, API keys, email templates, audit logs.
