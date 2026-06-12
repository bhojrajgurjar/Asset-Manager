---
name: Orval path-param vs body mutation patterns
description: Orval generates different argument shapes for path-param mutations vs body mutations — mixing them up causes runtime or TypeScript errors.
---

## Rule

- **Path-param only** (e.g. DELETE /items/:id, POST /notifications/:id/read): `mutation.mutate({ id })`
- **Body only** (e.g. POST /items): `mutation.mutate({ data: { ...fields } })`
- **Both** (e.g. PATCH /items/:id): `mutation.mutate({ id, data: { ...fields } })`

**Why:** Orval derives the argument type from the OpenAPI operation — params go in the top-level object, request body goes in `data`. Using `{ data: { notificationId } }` for a path-param mutation causes a TS2353 error and the request never reaches the right URL.

**How to apply:** When writing mutation calls, check the operationId in the generated `api.ts` file to confirm whether params are path-based or body-based before writing the `.mutate()` call.
