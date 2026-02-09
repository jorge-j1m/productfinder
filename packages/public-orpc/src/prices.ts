import { os } from "@orpc/server";
import { z } from "zod";
import {
  DB,
  inventory,
  storeIdSchema,
  productIdSchema,
  inventoryIdSchema,
  storeBrandSchema,
  isProductId,
  asProductId,
  isStoreId,
  isStoreBrandId,
} from "@repo/database";
import { eq, and, gt } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  NOT_FOUND: {
    status: 404,
    message: "Product not found",
  },
});

const pathBase = "/prices";

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

// Schema for a single store's pricing for a product
const storePricingSchema = z.object({
  inventoryId: inventoryIdSchema,
  store: z.object({
    id: storeIdSchema,
    name: z.string(),
    address: z.string(),
    city: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    brand: storeBrandSchema,
  }),
  quantity: z.number().int().nonnegative(),
  inStock: z.boolean(),
  regularPrice: z.number().int().positive(),
  salePrice: z.number().int().positive().nullable(),
  effectivePrice: z.number().int().positive(),
  isOnSale: z.boolean(),
  saleEndDate: z.date().nullable(),
  distanceKm: z.number().nonnegative().optional(),
});

const priceComparisonSchema = z.object({
  product: z.object({
    id: productIdSchema,
    name: z.string(),
    stockType: z.enum(["WEIGHT", "UNITS"]),
    image: z.string().nullable(),
  }),
  stores: z.array(storePricingSchema),
  lowestPrice: z.number().int().positive().nullable(),
  highestPrice: z.number().int().positive().nullable(),
  storeCount: z.number().int().nonnegative(),
});

const compareInputSchema = z.object({
  productId: z
    .string()
    .refine(isProductId, { message: "Invalid ProductId format" }),
  // Optional location for distance-sorted results
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(100).default(25),
  // Only show in-stock stores
  inStockOnly: z.coerce.boolean().default(false),
  // Filter to specific store brand
  brandId: z
    .string()
    .refine(isStoreBrandId, { message: "Invalid StoreBrandId format" })
    .optional(),
  // Sort by price or distance
  sortBy: z.enum(["price", "distance"]).default("price"),
});

export const pricesProcedures = {
  compare: osdb
    .route({
      method: "GET",
      path: `${pathBase}/compare/{productId}`,
      summary: "Compare Prices Across Stores",
    })
    .input(compareInputSchema)
    .output(priceComparisonSchema)
    .handler(async ({ input, context, errors }) => {
      const productId = asProductId(input.productId);

      // Verify product exists and get its info
      const product = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, productId),
      });

      if (!product) {
        throw errors.NOT_FOUND();
      }

      // Build where conditions for inventory query
      const whereConditions = [eq(inventory.productId, productId)];

      if (input.inStockOnly) {
        whereConditions.push(gt(inventory.quantity, 0));
      }

      // Fetch all inventory records for this product with store + brand
      const inventoryData = await context.db.query.inventory.findMany({
        where: and(...whereConditions),
        with: {
          store: {
            with: { brand: true },
          },
        },
      });

      // Filter by brand if specified
      let filtered = inventoryData;
      if (input.brandId) {
        filtered = filtered.filter(
          (inv) => inv.store.brandId === input.brandId,
        );
      }

      // Compute effective price, distance, and sale status per store
      const hasLocation =
        input.latitude !== undefined && input.longitude !== undefined;

      const storePricings = filtered
        .map((inv) => {
          const onSale = isSaleActive(
            inv.salePrice,
            inv.saleStartDate,
            inv.saleEndDate,
          );
          const effectivePrice = onSale ? inv.salePrice! : inv.regularPrice;

          let distanceKm: number | undefined;
          if (hasLocation) {
            // Haversine distance in JS for filtering/sorting
            distanceKm = haversineKm(
              input.latitude!,
              input.longitude!,
              inv.store.latitude,
              inv.store.longitude,
            );
          }

          return {
            inventoryId: inv.id,
            store: {
              id: inv.store.id,
              name: inv.store.name,
              address: inv.store.address,
              city: inv.store.city,
              latitude: inv.store.latitude,
              longitude: inv.store.longitude,
              brand: inv.store.brand,
            },
            quantity: inv.quantity,
            inStock: inv.quantity > 0,
            regularPrice: inv.regularPrice,
            salePrice: inv.salePrice,
            effectivePrice,
            isOnSale: onSale,
            saleEndDate: inv.saleEndDate,
            distanceKm,
          };
        })
        .filter((sp) => {
          // Filter by radius if location provided
          if (hasLocation && sp.distanceKm !== undefined) {
            return sp.distanceKm <= input.radiusKm;
          }
          return true;
        });

      // Sort results
      storePricings.sort((a, b) => {
        if (input.sortBy === "distance" && hasLocation) {
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
        }
        return a.effectivePrice - b.effectivePrice;
      });

      const effectivePrices = storePricings.map((sp) => sp.effectivePrice);

      return {
        product: {
          id: product.id,
          name: product.name,
          stockType: product.stockType,
          image: product.image,
        },
        stores: storePricings,
        lowestPrice:
          effectivePrices.length > 0 ? Math.min(...effectivePrices) : null,
        highestPrice:
          effectivePrices.length > 0 ? Math.max(...effectivePrices) : null,
        storeCount: storePricings.length,
      };
    }),

  forStore: osdb
    .route({
      method: "GET",
      path: `${pathBase}/store/{storeId}`,
      summary: "Get All Prices for a Store",
    })
    .input(
      z.object({
        storeId: z
          .string()
          .refine(isStoreId, { message: "Invalid StoreId format" }),
        page: z.coerce.number().int().positive().default(1),
        pageSize: z.coerce.number().int().positive().max(50).default(20),
        inStockOnly: z.coerce.boolean().default(false),
        onSaleOnly: z.coerce.boolean().default(false),
      }),
    )
    .output(
      z.object({
        data: z.array(
          z.object({
            inventoryId: inventoryIdSchema,
            product: z.object({
              id: productIdSchema,
              name: z.string(),
              stockType: z.enum(["WEIGHT", "UNITS"]),
              image: z.string().nullable(),
            }),
            quantity: z.number().int().nonnegative(),
            inStock: z.boolean(),
            regularPrice: z.number().int().positive(),
            salePrice: z.number().int().positive().nullable(),
            effectivePrice: z.number().int().positive(),
            isOnSale: z.boolean(),
            saleEndDate: z.date().nullable(),
          }),
        ),
        pagination: z.object({
          page: z.number().positive(),
          pageSize: z.number().positive(),
          total: z.number().nonnegative(),
          totalPages: z.number().nonnegative(),
        }),
      }),
    )
    .handler(async ({ input, context }) => {
      const whereConditions = [eq(inventory.storeId, input.storeId)];

      if (input.inStockOnly) {
        whereConditions.push(gt(inventory.quantity, 0));
      }

      const inventoryData = await context.db.query.inventory.findMany({
        where: and(...whereConditions),
        with: {
          product: true,
        },
      });

      // Compute effective prices and apply sale filter in JS
      // (sale status depends on date logic that's easier in application code)
      let results = inventoryData.map((inv) => {
        const onSale = isSaleActive(
          inv.salePrice,
          inv.saleStartDate,
          inv.saleEndDate,
        );

        return {
          inventoryId: inv.id,
          product: {
            id: inv.product.id,
            name: inv.product.name,
            stockType: inv.product.stockType,
            image: inv.product.image,
          },
          quantity: inv.quantity,
          inStock: inv.quantity > 0,
          regularPrice: inv.regularPrice,
          salePrice: inv.salePrice,
          effectivePrice: onSale ? inv.salePrice! : inv.regularPrice,
          isOnSale: onSale,
          saleEndDate: inv.saleEndDate,
        };
      });

      if (input.onSaleOnly) {
        results = results.filter((r) => r.isOnSale);
      }

      // Sort by effective price ascending
      results.sort((a, b) => a.effectivePrice - b.effectivePrice);

      // Manual pagination
      const total = results.length;
      const offset = (input.page - 1) * input.pageSize;
      const paginated = results.slice(offset, offset + input.pageSize);

      return {
        data: paginated,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        },
      };
    }),
};

/** Haversine distance between two lat/lng points in kilometers */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
