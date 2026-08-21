---
name: OpenAPI numeric compatibility
description: OpenAPI integer schemas currently generate z.int(), which is incompatible with this workspace's installed Zod 3 runtime.
---

Use `type: number` for generated API numeric fields unless the workspace Zod version is upgraded to one that supports `z.int()`.

**Why:** The code generator completed successfully but the shared library typecheck failed on every generated integer schema.

**How to apply:** Check the installed Zod major version before introducing integer fields into shared OpenAPI contracts.