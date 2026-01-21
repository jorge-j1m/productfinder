import { RouterClient } from "@orpc/server";
import { storeBrandsProcedures } from "./store_brands";
import { storesProcedures } from "./stores";
import { employeesProcedures } from "./employees";
import { productsProcedures } from "./products";

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
  products: {
    ...productsProcedures,
  },
};

export type AdminRouter = RouterClient<typeof adminRouter>;
