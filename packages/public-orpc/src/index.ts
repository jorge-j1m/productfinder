import { RouterClient } from "@orpc/server";
import { productsProcedures } from "./products";
import { storesProcedures } from "./stores";
import { pricesProcedures } from "./prices";

export const publicRouter = {
  products: {
    ...productsProcedures,
  },
  stores: {
    ...storesProcedures,
  },
  prices: {
    ...pricesProcedures,
  },
};

export type PublicRouter = RouterClient<typeof publicRouter>;
