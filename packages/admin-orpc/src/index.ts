import { RouterClient } from "@orpc/server";
import { storeBrandsProcedures } from "./store_brands";
import { storesProcedures } from "./stores";

export const adminRouter = {
  storeBrands: {
    ...storeBrandsProcedures,
  },
  stores: {
    ...storesProcedures,
  },
};

export type AdminRouter = RouterClient<typeof adminRouter>;
