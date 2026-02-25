import { os } from "@orpc/server";
import { z } from "zod";
import {
  DB,
  inventory,
  inventorySchema,
  productSchema,
  storeSchema,
  storeBrandSchema,
  isProductId,
  asProductId,
  isStoreId,
} from "@repo/database";
import { eq } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  NOT_FOUND: {
    status: 404,
    message: "Not found",
  },
});

const pathBase = "/prices";

// Raw inventory record with store + brand relations
const inventoryWithStoreSchema = inventorySchema.extend({
  store: storeSchema.extend({
    brand: storeBrandSchema,
  }),
});

// Raw inventory record with product relation
const inventoryWithProductSchema = inventorySchema.extend({
  product: productSchema,
});

export const pricesProcedures = {
  /**
   * Returns the product info + all raw inventory records (with store & brand)
   * for a given product. No computed fields — the frontend handles
   * effective price, sale detection, distance, sorting, filtering, and stats.
   */
  compare: osdb
    .route({
      method: "GET",
      path: `${pathBase}/compare/{productId}`,
      summary: "Get All Inventory for a Product",
    })
    .input(
      z.object({
        productId: z
          .string()
          .refine(isProductId, { message: "Invalid ProductId format" }),
      }),
    )
    .output(
      z.object({
        product: productSchema,
        inventory: z.array(inventoryWithStoreSchema),
      }),
    )
    .handler(async ({ input, context, errors }) => {
      const productId = asProductId(input.productId);

      const product = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, productId),
      });

      if (!product) {
        throw errors.NOT_FOUND();
      }

      const inventoryData = await context.db.query.inventory.findMany({
        where: eq(inventory.productId, productId),
        with: {
          store: {
            with: { brand: true },
          },
        },
      });

      return { product, inventory: inventoryData };
    }),

  /**
   * Returns all raw inventory records (with product) for a given store.
   * No filtering, sorting, or pagination — the frontend handles everything.
   */
  forStore: osdb
    .route({
      method: "GET",
      path: `${pathBase}/store/{storeId}`,
      summary: "Get All Inventory for a Store",
    })
    .input(
      z.object({
        storeId: z
          .string()
          .refine(isStoreId, { message: "Invalid StoreId format" }),
      }),
    )
    .output(z.array(inventoryWithProductSchema))
    .handler(async ({ input, context }) => {
      return context.db.query.inventory.findMany({
        where: eq(inventory.storeId, input.storeId),
        with: { product: true },
      });
    }),
};
