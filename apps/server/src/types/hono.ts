import { type DB } from "@repo/database";

declare module "hono" {
  interface ContextVariableMap {
    db: DB;
  }
}
