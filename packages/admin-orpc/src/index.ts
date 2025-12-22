import { RouterClient } from "@orpc/server";
import { storeBrandsProcedures } from "./store_brands";
import { storesProcedures } from "./stores";
import { employeesProcedures } from "./employees";

export const adminRouter = {
  storeBrands: {
    ...storeBrandsProcedures,
  },
  stores: {
    ...storesProcedures,
  },
  employees: {
    ...employeesProcedures,
  },
};

export type AdminRouter = RouterClient<typeof adminRouter>;
