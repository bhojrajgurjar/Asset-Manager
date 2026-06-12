---
name: connect-pg-simple session table
description: The createTableIfMissing option in connect-pg-simple does NOT reliably auto-create the session table — must create it manually before first request hits the session store.
---

## Rule

When using `connect-pg-simple` with `createTableIfMissing: true`, the session table is NOT reliably created automatically before requests arrive. Manually create it on provisioning or at startup.

## SQL to create the table

```sql
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
) WITH (OIDS=FALSE);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
```

**Why:** Without the table, all session reads silently return empty sessions, so every authenticated request returns 401. The `createTableIfMissing` option is only triggered lazily and may race with the first request.

**How to apply:** After provisioning a PostgreSQL DB for any project using express-session + connect-pg-simple, immediately run the SQL above via `executeSql` before starting the server.
