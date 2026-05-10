# Task: Auth pages + admin user creation

Build signup/signin pages and admin user creation mechanism.

## Goals
- Frontend: signup + signin pages with password auth ✅
- Backend: signup endpoint, login with password verification, admin creation ✅
- Admin setup endpoint (protected by secret key) ✅

## Checklist
- [x] Backend: add passwordHash field to users table + bcryptjs
- [x] Backend: POST /auth/signup endpoint
- [x] Backend: update login to verify password
- [x] Backend: POST /auth/admin/setup endpoint (ADMIN_SETUP_SECRET protected)
- [x] Backend: /me endpoint returns user info (without password)
- [x] Frontend: /signup.vue page (name, email, password, confirm)
- [x] Frontend: update /login.vue (email + password)
- [x] Frontend: update useAuth composable (signup method + export state)
- [x] Frontend: /admin-setup.vue page with setup secret protection
- [x] Update .env.example with ADMIN_SETUP_SECRET
- [x] Verify: pnpm typecheck passes

## Notes
- Auth: bcryptjs for password hashing, cost factor 12
- Admin setup: protected by ADMIN_SETUP_SECRET env var
- First user gets owner role via ensureDefaultWorkspace
- Admin user = owner of workspace with full access
- auth-guest middleware for signup/login/admin pages (redirect if authenticated)
- auth middleware for all other pages (redirect to /login if not)