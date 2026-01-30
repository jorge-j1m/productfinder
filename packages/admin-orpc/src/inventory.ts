import { os } from "@orpc/server";
import { z } from "zod";
import {
  inventorySchema,
  newInventorySchema,
  DB,
  inventory,
  isInventoryId,
  asInventoryId,
  isStoreId,
  asStoreId,
  isProductId,
  asProductId,
  storeIdSchema,
  productIdSchema,
  inventoryIdSchema,
} from "@repo/database";
import { eq, asc, desc, count, and, sql } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "Internal server error",
  },
  NOT_FOUND: {
    status: 404,
    message: "Inventory record not found",
  },
  STORE_NOT_FOUND: {
    status: 404,
    message: "Store not found",
  },
  PRODUCT_NOT_FOUND: {
    status: 404,
    message: "Product not found",
  },
  CONFLICT: {
    status: 409,
    message:
      "Inventory record for this store-product combination already exists",
  },
  INVALID_SALE_PRICE: {
    status: 400,
    message: "Sale price must be less than regular price",
  },
  INSUFFICIENT_STOCK: {
    status: 400,
    message: "Operation would result in negative stock quantity",
  },
});

const pathBase = "/inventory";

// Sorting schemas
const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");
const sortFieldSchema = z
  .enum(["quantity", "regularPrice", "salePrice", "id"])
  .default("id");

// Paginated response schema
const paginatedInventorySchema = z.object({
  data: z.array(inventorySchema),
  pagination: z.object({
    page: z.number().positive(),
    pageSize: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
});

// Schema for inventory with relations
const inventoryWithRelationsSchema = inventorySchema.extend({
  store: z
    .object({
      id: storeIdSchema,
      name: z.string(),
    })
    .optional(),
  product: z
    .object({
      id: productIdSchema,
      name: z.string(),
      stockType: z.enum(["WEIGHT", "UNITS"]),
    })
    .optional(),
});

// Combined input schema for getAll
const getAllInventoryInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  storeId: z
    .string()
    .refine(isStoreId, { message: "Invalid StoreId format" })
    .optional(),
  productId: z
    .string()
    .refine(isProductId, { message: "Invalid ProductId format" })
    .optional(),
  sortBy: sortFieldSchema,
  sortOrder: sortOrderSchema,
});

// Effective price response schema
const effectivePriceSchema = z.object({
  inventoryId: inventoryIdSchema,
  effectivePrice: z.number().int().positive(),
  isOnSale: z.boolean(),
  regularPrice: z.number().int().positive(),
  salePrice: z.number().int().positive().nullable(),
  saleStartDate: z.date().nullable(),
  saleEndDate: z.date().nullable(),
});

// Helper to validate sale price against regular price
function validateSalePrice(
  salePrice: number | null | undefined,
  regularPrice: number,
): boolean {
  if (salePrice === null || salePrice === undefined) return true;
  return salePrice < regularPrice;
}

// Helper to check if sale is currently active
function isSaleActive(
  salePrice: number | null,
  saleStartDate: Date | null,
  saleEndDate: Date | null,
): boolean {
  if (salePrice === null) return false;

  const now = new Date();

  if (saleStartDate && now < saleStartDate) return false;
  if (saleEndDate && now > saleEndDate) return false;

  return true;
}

export const inventoryProcedures = {
  getAll: osdb
    .route({ method: "GET", path: pathBase, summary: "Get All Inventory" })
    .input(getAllInventoryInputSchema)
    .output(paginatedInventorySchema)
    .handler(async ({ input, context }) => {
      const { page, pageSize, storeId, productId, sortBy, sortOrder } = input;
      const offset = (page - 1) * pageSize;

      // Build where clause
      const whereConditions = [];

      if (storeId) {
        whereConditions.push(eq(inventory.storeId, asStoreId(storeId)));
      }
      if (productId) {
        whereConditions.push(eq(inventory.productId, asProductId(productId)));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const countResult = await context.db
        .select({ value: count() })
        .from(inventory)
        .where(whereClause);

      const total = countResult[0]?.value ?? 0;

      // Build order by clause
      const sortColumn =
        sortBy === "quantity"
          ? inventory.quantity
          : sortBy === "regularPrice"
            ? inventory.regularPrice
            : sortBy === "salePrice"
              ? inventory.salePrice
              : inventory.id;

      const orderByClause =
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      // Get paginated data
      const inventoryData = await context.db
        .select()
        .from(inventory)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset);

      return {
        data: inventoryData,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
    }),

  get: osdb
    .route({
      method: "GET",
      path: `${pathBase}/{id}`,
      summary: "Get Inventory by ID",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isInventoryId, { message: "Invalid InventoryId format" }),
      }),
    )
    .output(inventoryWithRelationsSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asInventoryId(input.id);

      const record = await context.db.query.inventory.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
        with: {
          store: {
            columns: { id: true, name: true },
          },
          product: {
            columns: { id: true, name: true, stockType: true },
          },
        },
      });

      if (!record) {
        throw errors.NOT_FOUND();
      }

      return record;
    }),

  getByStoreProduct: osdb
    .route({
      method: "GET",
      path: `${pathBase}/lookup`,
      summary: "Get Inventory by Store and Product",
    })
    .input(
      z.object({
        storeId: z
          .string()
          .refine(isStoreId, { message: "Invalid StoreId format" }),
        productId: z
          .string()
          .refine(isProductId, { message: "Invalid ProductId format" }),
      }),
    )
    .output(inventoryWithRelationsSchema)
    .handler(async ({ input, context, errors }) => {
      const storeId = asStoreId(input.storeId);
      const productId = asProductId(input.productId);

      const record = await context.db.query.inventory.findFirst({
        where: (fields, { eq, and }) =>
          and(eq(fields.storeId, storeId), eq(fields.productId, productId)),
        with: {
          store: {
            columns: { id: true, name: true },
          },
          product: {
            columns: { id: true, name: true, stockType: true },
          },
        },
      });

      if (!record) {
        throw errors.NOT_FOUND();
      }

      return record;
    }),

  getEffectivePrice: osdb
    .route({
      method: "GET",
      path: `${pathBase}/effective-price`,
      summary: "Get Effective Price for Inventory",
    })
    .input(
      z.object({
        storeId: z
          .string()
          .refine(isStoreId, { message: "Invalid StoreId format" }),
        productId: z
          .string()
          .refine(isProductId, { message: "Invalid ProductId format" }),
      }),
    )
    .output(effectivePriceSchema)
    .handler(async ({ input, context, errors }) => {
      const storeId = asStoreId(input.storeId);
      const productId = asProductId(input.productId);

      const record = await context.db.query.inventory.findFirst({
        where: (fields, { eq, and }) =>
          and(eq(fields.storeId, storeId), eq(fields.productId, productId)),
      });

      if (!record) {
        throw errors.NOT_FOUND();
      }

      const isOnSale = isSaleActive(
        record.salePrice,
        record.saleStartDate,
        record.saleEndDate,
      );
      const effectivePrice = isOnSale ? record.salePrice! : record.regularPrice;

      return {
        inventoryId: record.id,
        effectivePrice,
        isOnSale,
        regularPrice: record.regularPrice,
        salePrice: record.salePrice,
        saleStartDate: record.saleStartDate,
        saleEndDate: record.saleEndDate,
      };
    }),

  create: osdb
    .route({
      method: "POST",
      path: pathBase,
      summary: "Create Inventory",
      successStatus: 201,
    })
    .input(newInventorySchema.omit({ id: true }))
    .output(inventorySchema)
    .handler(async ({ input, context, errors }) => {
      const storeId = asStoreId(input.storeId);
      const productId = asProductId(input.productId);

      // Validate store exists
      const store = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, storeId),
      });

      if (!store) {
        throw errors.STORE_NOT_FOUND();
      }

      // Validate product exists
      const product = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, productId),
      });

      if (!product) {
        throw errors.PRODUCT_NOT_FOUND();
      }

      // Check for duplicate
      const existing = await context.db.query.inventory.findFirst({
        where: (fields, { eq, and }) =>
          and(eq(fields.storeId, storeId), eq(fields.productId, productId)),
      });

      if (existing) {
        throw errors.CONFLICT();
      }

      // Validate sale price
      if (!validateSalePrice(input.salePrice, input.regularPrice)) {
        throw errors.INVALID_SALE_PRICE();
      }

      const [record] = await context.db
        .insert(inventory)
        .values(input)
        .returning();

      if (!record) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return record;
    }),

  update: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/{id}`,
      summary: "Update Inventory",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isInventoryId, { message: "Invalid InventoryId format" }),
        data: newInventorySchema
          .omit({ id: true, storeId: true, productId: true })
          .partial(),
      }),
    )
    .output(inventorySchema)
    .handler(async ({ input, context, errors }) => {
      const id = asInventoryId(input.id);

      // Check if inventory exists
      const existing = await context.db.query.inventory.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      // Validate sale price if being updated
      const newRegularPrice = input.data.regularPrice ?? existing.regularPrice;
      const newSalePrice =
        input.data.salePrice === undefined
          ? existing.salePrice
          : input.data.salePrice;

      if (!validateSalePrice(newSalePrice, newRegularPrice)) {
        throw errors.INVALID_SALE_PRICE();
      }

      const [updated] = await context.db
        .update(inventory)
        .set(input.data)
        .where(eq(inventory.id, id))
        .returning();

      if (!updated) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return updated;
    }),

  upsert: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/upsert`,
      summary: "Upsert Inventory by Store and Product",
    })
    .input(newInventorySchema.omit({ id: true }))
    .output(inventorySchema)
    .handler(async ({ input, context, errors }) => {
      const storeId = asStoreId(input.storeId);
      const productId = asProductId(input.productId);

      // Validate store exists
      const store = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, storeId),
      });

      if (!store) {
        throw errors.STORE_NOT_FOUND();
      }

      // Validate product exists
      const product = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, productId),
      });

      if (!product) {
        throw errors.PRODUCT_NOT_FOUND();
      }

      // Validate sale price
      if (!validateSalePrice(input.salePrice, input.regularPrice)) {
        throw errors.INVALID_SALE_PRICE();
      }

      // Upsert using ON CONFLICT
      const [record] = await context.db
        .insert(inventory)
        .values(input)
        .onConflictDoUpdate({
          target: [inventory.storeId, inventory.productId],
          set: {
            quantity: input.quantity,
            regularPrice: input.regularPrice,
            salePrice: input.salePrice,
            saleStartDate: input.saleStartDate,
            saleEndDate: input.saleEndDate,
          },
        })
        .returning();

      if (!record) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return record;
    }),

  adjustStock: osdb
    .route({
      method: "POST",
      path: `${pathBase}/adjust`,
      summary: "Adjust Stock Quantity",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isInventoryId, { message: "Invalid InventoryId format" }),
        delta: z.number().int(),
      }),
    )
    .output(inventorySchema)
    .handler(async ({ input, context, errors }) => {
      const id = asInventoryId(input.id);

      // Check if inventory exists and get current quantity
      const existing = await context.db.query.inventory.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      // Check if adjustment would result in negative stock
      const newQuantity = existing.quantity + input.delta;
      if (newQuantity < 0) {
        throw errors.INSUFFICIENT_STOCK();
      }

      // Atomic update using SQL
      const [updated] = await context.db
        .update(inventory)
        .set({
          quantity: sql`${inventory.quantity} + ${input.delta}`,
        })
        .where(eq(inventory.id, id))
        .returning();

      if (!updated) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return updated;
    }),

  setSale: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/{id}/sale`,
      summary: "Set Sale Price",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isInventoryId, { message: "Invalid InventoryId format" }),
        salePrice: z.number().int().positive(),
        saleStartDate: z.coerce.date().optional(),
        saleEndDate: z.coerce.date().optional(),
      }),
    )
    .output(inventorySchema)
    .handler(async ({ input, context, errors }) => {
      const id = asInventoryId(input.id);

      // Check if inventory exists
      const existing = await context.db.query.inventory.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      // Validate sale price against regular price
      if (!validateSalePrice(input.salePrice, existing.regularPrice)) {
        throw errors.INVALID_SALE_PRICE();
      }

      const [updated] = await context.db
        .update(inventory)
        .set({
          salePrice: input.salePrice,
          saleStartDate: input.saleStartDate ?? null,
          saleEndDate: input.saleEndDate ?? null,
        })
        .where(eq(inventory.id, id))
        .returning();

      if (!updated) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return updated;
    }),

  clearSale: osdb
    .route({
      method: "DELETE",
      path: `${pathBase}/{id}/sale`,
      summary: "Clear Sale Price",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isInventoryId, { message: "Invalid InventoryId format" }),
      }),
    )
    .output(inventorySchema)
    .handler(async ({ input, context, errors }) => {
      const id = asInventoryId(input.id);

      // Check if inventory exists
      const existing = await context.db.query.inventory.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      const [updated] = await context.db
        .update(inventory)
        .set({
          salePrice: null,
          saleStartDate: null,
          saleEndDate: null,
        })
        .where(eq(inventory.id, id))
        .returning();

      if (!updated) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return updated;
    }),

  bulkUpsert: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/bulk-upsert`,
      summary: "Bulk Upsert Inventory",
    })
    .input(
      z.object({
        items: z
          .array(newInventorySchema.omit({ id: true }))
          .min(1)
          .max(100),
      }),
    )
    .output(z.object({ success: z.boolean(), count: z.number().int() }))
    .handler(async ({ input, context, errors }) => {
      // Validate all sale prices
      for (const item of input.items) {
        if (!validateSalePrice(item.salePrice, item.regularPrice)) {
          throw errors.INVALID_SALE_PRICE();
        }
      }

      // Collect unique store and product IDs for validation
      const storeIds = [...new Set(input.items.map((i) => i.storeId))];
      const productIds = [...new Set(input.items.map((i) => i.productId))];

      // Validate all stores exist
      for (const storeId of storeIds) {
        const store = await context.db.query.stores.findFirst({
          where: (fields, { eq }) => eq(fields.id, asStoreId(storeId)),
        });
        if (!store) {
          throw errors.STORE_NOT_FOUND();
        }
      }

      // Validate all products exist
      for (const productId of productIds) {
        const product = await context.db.query.products.findFirst({
          where: (fields, { eq }) => eq(fields.id, asProductId(productId)),
        });
        if (!product) {
          throw errors.PRODUCT_NOT_FOUND();
        }
      }

      // Bulk upsert
      await context.db
        .insert(inventory)
        .values(input.items)
        .onConflictDoUpdate({
          target: [inventory.storeId, inventory.productId],
          set: {
            quantity: sql`excluded.quantity`,
            regularPrice: sql`excluded.regular_price`,
            salePrice: sql`excluded.sale_price`,
            saleStartDate: sql`excluded.sale_start_date`,
            saleEndDate: sql`excluded.sale_end_date`,
          },
        });

      return { success: true, count: input.items.length };
    }),

  delete: osdb
    .route({
      method: "DELETE",
      path: `${pathBase}/{id}`,
      summary: "Delete Inventory",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isInventoryId, { message: "Invalid InventoryId format" }),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        id: z
          .string()
          .refine(isInventoryId, { message: "Invalid InventoryId format" }),
      }),
    )
    .handler(async ({ input, context, errors }) => {
      const id = asInventoryId(input.id);

      // Check if inventory exists
      const existing = await context.db.query.inventory.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      await context.db.delete(inventory).where(eq(inventory.id, id));

      return { success: true, id: input.id };
    }),
};
