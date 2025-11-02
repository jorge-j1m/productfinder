import type { drizzle } from "drizzle-orm/node-postgres";
import type * as schema from "../db/schema";

declare module "hono" {
  interface ContextVariableMap {
    db: ReturnType<typeof drizzle<typeof schema>>;
  }
}
