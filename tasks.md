# Audit Findings & Fix Tasks

## Iteration 1 — done

### CRITICAL
- [x] **Auth header spoofing (`x-user-id`)** — replaced unsigned header trust with signed JWT session cookie (`lumora_session`, HS256, httpOnly, sameSite=Lax, secure in prod). Files: `apps/api/src/infra/session.ts` (new), `apps/api/src/infra/auth.ts`.

### HIGH
- [x] **Signup/admin-setup skip `usageQuotas`** — `auth.routes.ts ensureDefaultWorkspace` inserts quota row with `onConflictDoNothing()`.
- [x] **Logout no-op** — `/auth/logout` clears cookie via `deleteCookie`.
- [x] **`/me` trusts unsigned header** — now reads + verifies JWT cookie.

### MEDIUM
- [x] **Email not normalized** — `loginSchema`/`signupSchema` apply `.trim().toLowerCase()`.

## Iteration 2 — done

### LOW cleanups
- [x] Removed unused `useApi` imports in `apps/web/app/pages/login.vue` and `signup.vue`.
- [x] Deleted dead `apps/api/src/modules/auth/auth.repository.ts` (all helpers were duplicated locally in routes).

### MEDIUM additions
- [x] **`users.isAdmin` column added** — schema + migration `0001_add_users_is_admin.sql`. `admin/setup` sets `isAdmin=true` and issues session cookie. `/me`, `/login`, `/signup` responses include `isAdmin`.
- [x] **Web: no auth route guard** — only login/signup/admin-setup pages had middleware; authenticated pages were renderable. Renamed `auth.ts` → `auth.global.ts` and added `PUBLIC_PATHS` allow list.
- [x] **SSR cookie forwarding** — `useApi` now forwards request `cookie` header on server-side `$fetch` so SSR session check works on first render.

## Iteration 4 — done

### MEDIUM
- [x] **Body size DoS surface** — added global `bodyLimit` (15MB hard ceiling, 413 on overflow) in `apps/api/src/app.ts`. Storage service still enforces its 10MB image limit.
- [x] **Admin bootstrap could be reused** — `/auth/admin/setup` now refuses (409) once any user has `isAdmin=true`. First-admin only.
- [x] Login/signup response surface `isAdmin` for client gating.

### Tests
- [x] `auth.routes.test.ts` +1 case: rejects second admin bootstrap.

## Iteration 3 — done

### MEDIUM additions
- [x] **Rate limiting** — new `apps/api/src/infra/rate-limit.ts` (sliding-window per IP, in-memory). Applied: `/auth/login` (10/min), `/auth/signup` (5/min), `/auth/admin/setup` (5/min). Bypass via `DISABLE_RATE_LIMIT=true`.
- [x] **`requireAdmin` middleware** — `apps/api/src/infra/auth.ts` exports `requireAdmin` returning 403 unless `users.isAdmin`. Available for future admin routes.

## Remaining (deferred)

- [ ] `auth-guest` middleware surface fetchMe errors instead of swallowing (low value — 401 is expected for guests).
- [ ] Mount admin-only routes behind `requireAdmin` once spec defines them.
- [ ] Run `pnpm db:migrate` once DB is reachable to apply 0001 migration.
- [ ] For multi-instance prod, swap rate-limit store to Redis.

## Verification

```
pnpm typecheck   # 4/4 pass
pnpm test        # 93 tests pass (73 baseline + 20 new)
```

New tests:
- `apps/api/src/infra/session.test.ts` — 5 cases.
- `apps/api/src/infra/rate-limit.test.ts` — 4 cases.
- `apps/api/src/modules/auth/auth.routes.test.ts` — 10 cases (incl. login rate-limit hit).

## Env

- `SESSION_SECRET` (>=16 chars) required in production. Documented in `.env.example`.
- Old `JWT_SECRET` key removed.
