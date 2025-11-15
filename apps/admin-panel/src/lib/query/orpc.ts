import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { client } from "#/lib/orpc";
import { type __brand } from "@repo/database/types";

export const orpc = createTanstackQueryUtils(client);
