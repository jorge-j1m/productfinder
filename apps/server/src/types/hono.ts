import { DB } from "../db";

declare module "hono" {
  interface ContextVariableMap {
    db: DB;
  }
}
