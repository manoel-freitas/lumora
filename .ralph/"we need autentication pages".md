# Task: Authentication pages for Lumora web app

## Context
- Backend auth module already exists (auth.routes.ts, auth.repository.ts)
- `/api/auth/login` expects `{ email, name? }`, creates/upserts user, returns workspace
- `/api/auth/me` returns current user and workspaces
- No login page existed on the frontend
- No auth composable existed to manage session state

## Goals
- [x] Login page at `/login`
- [x] Auth composable with state management
- [x] Auth middleware to protect pages
- [x] Header sign in/out controls
- [x] Proxy auth headers to backend
- [x] Session restore via plugin

## Implementation

### Files created

- `app/composables/useAuth.ts` — reactive auth state: user, workspaces, workspaceId
- `app/pages/login.vue` — login form, name + email, redirect on success
- `app/middleware/auth.ts` — protect routes, redirect to /login
- `app/plugins/auth.ts` — restore session on every page load
- `app/composables/useApi.ts` (updated) — forward x-user-id, x-workspace-id headers

### Auth flow
1. Plugin: `useAuth().fetchMe()` on app start → restores session from `/api/auth/me`
2. Middleware: non-/login routes check auth → redirect to /login if not authenticated
3. Login page: `auth.login(email, name)` → upserts user + creates workspace → redirect to /
4. Logout: clears state + redirects to /login

### Verification
- `pnpm typecheck` ✅ (web, api, shared)
- `pnpm test` ✅ (73 tests passing)
- TypeScript strict pass on new files

### Checklist
- [x] Login page renders and submits
- [x] Middleware protects dashboard, gallery, characters, generate, campaigns, approvals, calendar
- [x] Auth composable reactive state works across page navigation
- [x] Logout clears session and redirects
- [x] Unauthenticated users see login page; authenticated see app
- [x] Auth headers forwarded to API proxy

## Notes
- Backend auth uses header-based auth (x-user-id, x-workspace-id) — no JWT cookie yet
- Workspace switcher is next iteration
- Auth composable stores workspaceId in state; API proxy sends headers automatically