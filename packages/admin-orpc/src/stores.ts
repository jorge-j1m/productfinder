import { z } from "zod";
import {
  storeSchema,
  newStoreSchema,
  stores,
  isStoreId,
  asStoreId,
  storeBrandSchema,
} from "@repo/database";
import { eq, ilike, count, and } from "drizzle-orm";
import { protectedProcedure } from "./base";

const osdb = protectedProcedure.errors({
  NOT_FOUND: {
    status: 404,
    message: "Store not found",
  },
  BRAND_NOT_FOUND: {
    status: 404,
    message: "Store brand not found",
  },
  CONFLICT: {
    status: 409,
    message: "Store with this address and ZIP already exists",
  },
});

const pathBase = "/stores";

// Sorting schemas
const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");
const sortFieldSchema = z.enum(["name", "id", "city"]).default("name");

// Store with brand relation schema
const storeWithBrandSchema = storeSchema.extend({
  brand: storeBrandSchema,
});

// Paginated response schema
const paginatedStoresSchema = z.object({
  data: z.array(storeWithBrandSchema),
  pagination: z.object({
    page: z.number().positive(),
    pageSize: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
});

// Combined input schema for getAll with field-based filtering
const getAllStoresInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  name: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  sortBy: sortFieldSchema,
  sortOrder: sortOrderSchema,
});

export const storesProcedures = {
  getAll: osdb
    .route({ method: "GET", path: pathBase, summary: "Get All Stores" })
    .input(getAllStoresInputSchema)
    .output(paginatedStoresSchema)
    .handler(async ({ input, context }) => {
      const { page, pageSize, name, city, state, zip, sortBy, sortOrder } =
        input;
      const offset = (page - 1) * pageSize;

      // Build where clause for field-based filtering
      const whereConditions = [];

      if (name) {
        whereConditions.push(ilike(stores.name, `%${name}%`));
      }
      if (city) {
        whereConditions.push(ilike(stores.city, `%${city}%`));
      }
      if (state) {
        whereConditions.push(ilike(stores.state, `%${state}%`));
      }
      if (zip) {
        whereConditions.push(ilike(stores.zip, `%${zip}%`));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const countResult = await context.db
        .select({ value: count() })
        .from(stores)
        .where(whereClause);

      const total = countResult[0]?.value ?? 0;

      // Get paginated data with brand relation
      const storesData = await context.db.query.stores.findMany({
        where: (fields, operators) => {
          const conditions = [];

          if (name) {
            conditions.push(operators.ilike(fields.name, `%${name}%`));
          }
          if (city) {
            conditions.push(operators.ilike(fields.city, `%${city}%`));
          }
          if (state) {
            conditions.push(operators.ilike(fields.state, `%${state}%`));
          }
          if (zip) {
            conditions.push(operators.ilike(fields.zip, `%${zip}%`));
          }

          return conditions.length > 0
            ? operators.and(...conditions)
            : undefined;
        },
        with: {
          brand: true,
        },
        orderBy: (fields, operators) => {
          if (sortBy === "name") {
            return sortOrder === "asc"
              ? operators.asc(fields.name)
              : operators.desc(fields.name);
          } else if (sortBy === "city") {
            return sortOrder === "asc"
              ? operators.asc(fields.city)
              : operators.desc(fields.city);
          } else {
            return sortOrder === "asc"
              ? operators.asc(fields.id)
              : operators.desc(fields.id);
          }
        },
        limit: pageSize,
        offset: offset,
      });

      return {
        data: storesData,
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
      summary: "Get Store by ID",
    })
    .input(
      z.object({
        id: z.string().refine(isStoreId, { message: "Invalid StoreId format" }),
      }),
    )
    .output(storeWithBrandSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asStoreId(input.id);

      const store = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
        with: {
          brand: true,
        },
      });

      if (!store) {
        throw errors.NOT_FOUND();
      }

      return store;
    }),

  create: osdb
    .route({
      method: "POST",
      path: pathBase,
      summary: "Create Store",
      successStatus: 201,
    })
    .input(newStoreSchema.omit({ id: true }))
    .output(storeWithBrandSchema)
    .handler(async ({ input, context, errors }) => {
      // Validate that brandId exists
      const brandExists = await context.db.query.storeBrands.findFirst({
        where: (fields, { eq }) => eq(fields.id, input.brandId),
      });

      if (!brandExists) {
        throw errors.BRAND_NOT_FOUND();
      }

      // Check for duplicate address + ZIP
      const existing = await context.db.query.stores.findFirst({
        where: (fields, { eq, and }) =>
          and(eq(fields.address, input.address), eq(fields.zip, input.zip)),
      });

      if (existing) {
        throw errors.CONFLICT();
      }

      const [store] = await context.db.insert(stores).values(input).returning();

      if (!store) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      // Fetch the created store with brand relation
      const storeWithBrand = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, store.id),
        with: {
          brand: true,
        },
      });

      if (!storeWithBrand) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return storeWithBrand;
    }),

  update: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/{id}`,
      summary: "Update Store",
    })
    .input(
      z.object({
        id: z.string().refine(isStoreId, { message: "Invalid StoreId format" }),
        data: newStoreSchema.omit({ id: true, brandId: true }).partial(),
      }),
    )
    .output(storeWithBrandSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asStoreId(input.id);

      // Check if store exists
      const existing = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      // Check for duplicate address + ZIP if either is being updated
      if (input.data.address || input.data.zip) {
        const newAddress = input.data.address ?? existing.address;
        const newZip = input.data.zip ?? existing.zip;

        // Only check if the combination is different from current
        if (newAddress !== existing.address || newZip !== existing.zip) {
          const duplicate = await context.db.query.stores.findFirst({
            where: (fields, { eq, and, ne }) =>
              and(
                eq(fields.address, newAddress),
                eq(fields.zip, newZip),
                ne(fields.id, id),
              ),
          });

          if (duplicate) {
            throw errors.CONFLICT();
          }
        }
      }

      const [updated] = await context.db
        .update(stores)
        .set(input.data)
        .where(eq(stores.id, id))
        .returning();

      if (!updated) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      // Fetch the updated store with brand relation
      const storeWithBrand = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
        with: {
          brand: true,
        },
      });

      if (!storeWithBrand) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return storeWithBrand;
    }),

  delete: osdb
    .route({
      method: "DELETE",
      path: `${pathBase}/{id}`,
      summary: "Delete Store",
    })
    .input(
      z.object({
        id: z.string().refine(isStoreId, { message: "Invalid StoreId format" }),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        id: z.string().refine(isStoreId, { message: "Invalid StoreId format" }),
      }),
    )
    .handler(async ({ input, context, errors }) => {
      const id = asStoreId(input.id);

      // Check if store exists
      const existing = await context.db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      await context.db.delete(stores).where(eq(stores.id, id));

      return { success: true, id: input.id };
    }),
};
