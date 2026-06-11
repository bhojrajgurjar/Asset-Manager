# Alexandria — Library Management System

A full-stack Library Management System with role-based access for Admins and Students. Manages book inventory, issue/return workflows, automatic overdue fines, and a notification center.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/library-app run dev` — run the frontend (port 21015)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Default Credentials

- **Admin**: `admin@library.com` / `admin123`
- **Student**: `student@library.com` / `student123`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + bcryptjs
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (users, books, transactions, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/` — session and auth middleware
- `artifacts/library-app/src/` — React frontend

## Architecture decisions

- Session-based auth (express-session + connect-pg-simple) stored in PostgreSQL — no JWTs to manage
- Fine calculation: $1/day after the due date, computed at return time and also estimated live for overdue display
- `updateOverdueStatus()` runs on every transaction/dashboard read to keep status current without a cron job
- Books table tracks `quantity`; available copies computed dynamically from active transaction count
- Role-based routing enforced both server-side (middleware) and client-side (ProtectedRoute in AuthContext)

## Product

- **Admin**: view dashboard stats (total books, users, active/overdue rentals, fines collected, category chart), manage books (add/edit/delete), view all transactions, manage users
- **Student**: view personal dashboard, browse and issue books, see due dates, return books, track fines, receive notifications

## Gotchas

- Run `pnpm run typecheck:libs` after any schema change in `lib/db/src/schema/` before checking artifact typechecks
- Re-run codegen after any OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- Session cookie `sameSite` is `"none"` in production and `"lax"` in development
