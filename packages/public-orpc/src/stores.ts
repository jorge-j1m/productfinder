import { os } from "@orpc/server";
import { z } from "zod";
import {
  storeSchema,
  storeBrandSchema,
  DB,
  stores,
  isStoreId,
  asStoreId,
  isStoreBrandId,
  asStoreBrandId,
} from "@repo/database";
import { count, sql, and, eq } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  NOT_FOUND: {
    status: 404,
    message: "Store not found",
  },
});

const pathBase = "/stores";

const storeWithBrandSchema = storeSchema.extend({
  brand: storeBrandSchema,
});

// Extends store with computed distance field for proximity queries
const storeWithDistanceSchema = storeWithBrandSchema.extend({
  distanceKm: z.number().nonnegative(),
});

const paginatedStoresSchema = z.object({
  data: z.array(storeWithDistanceSchema),
  pagination: z.object({
    page: z.number().positive(),
    pageSize: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
});

const nearbyStoresInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  // Max radius in km, defaults to 25km
  radiusKm: z.coerce.number().positive().max(100).default(25),
  brandId: z
    .string()
    .refine(isStoreBrandId, { message: "Invalid StoreBrandId format" })
    .optional(),
});

export const storesProcedures = {
  nearby: osdb
    .route({
      method: "GET",
      path: pathBase,
      summary: "Get Nearby Stores",
    })
    .input(nearbyStoresInputSchema)
    .output(paginatedStoresSchema)
    .handler(async ({ input, context }) => {
      const { page, pageSize, latitude, longitude, radiusKm, brandId } = input;
      const offset = (page - 1) * pageSize;

      // Haversine formula in SQL for distance calculation (returns km)
      const distanceExpression = sql<number>`
        6371 * acos(
          cos(radians(${latitude}))
          * cos(radians(${stores.latitude}))
          * cos(radians(${stores.longitude}) - radians(${longitude}))
          + sin(radians(${latitude}))
          * sin(radians(${stores.latitude}))
        )
      `;

      const whereConditions = [sql`${distanceExpression} <= ${radiusKm}`];

      if (brandId) {
        whereConditions.push(eq(stores.brandId, asStoreBrandId(brandId)));
      }

      const whereClause = and(...whereConditions);

      // Count stores within radius
      const countResult = await context.db
        .select({ value: count() })
        .from(stores)
        .where(whereClause);

      const total = countResult[0]?.value ?? 0;

      // Fetch stores sorted by distance, with brand relation
      const storesData = await context.db.query.stores.findMany({
        where: whereClause,
        with: { brand: true },
        extras: {
          distanceKm: distanceExpression.as("distance_km"),
        },
        orderBy: distanceExpression,
        limit: pageSize,
        offset,
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
        with: { brand: true },
      });

      if (!store) {
        throw errors.NOT_FOUND();
      }

      return store;
    }),
};
