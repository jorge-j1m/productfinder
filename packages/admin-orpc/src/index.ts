import { RouterClient } from "@orpc/server";
import { storeBrandsProcedures } from "./store_brands";
import { storesProcedures } from "./stores";
import { employeesProcedures } from "./employees";
import { productsProcedures } from "./products";
import { inventoryProcedures } from "./inventory";

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
  inventory: {
    ...inventoryProcedures,
  },
};

export type AdminRouter = RouterClient<typeof adminRouter>;
