import { os } from "@orpc/server";
import { z } from "zod";
import {
  productSchema,
  DB,
  products,
  isProductId,
  asProductId,
} from "@repo/database";
import { eq, ilike, count, and, asc, desc } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  NOT_FOUND: {
    status: 404,
    message: "Product not found",
  },
});

const pathBase = "/products";

const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");
const sortFieldSchema = z.enum(["name", "id"]).default("name");

const paginatedProductsSchema = z.object({
  data: z.array(productSchema),
  pagination: z.object({
    page: z.number().positive(),
    pageSize: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
});

const searchProductsInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  query: z.string().optional(),
  stockType: z.enum(["WEIGHT", "UNITS"]).optional(),
  sortBy: sortFieldSchema,
  sortOrder: sortOrderSchema,
});

export const productsProcedures = {
  search: osdb
    .route({ method: "GET", path: pathBase, summary: "Search Products" })
    .input(searchProductsInputSchema)
    .output(paginatedProductsSchema)
    .handler(async ({ input, context }) => {
      const { page, pageSize, query, stockType, sortBy, sortOrder } = input;
      const offset = (page - 1) * pageSize;

      const whereConditions = [];

      // Search across name, sku, and barcode
      if (query) {
        whereConditions.push(ilike(products.name, `%${query}%`));
      }
      if (stockType) {
        whereConditions.push(eq(products.stockType, stockType));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      const countResult = await context.db
        .select({ value: count() })
        .from(products)
        .where(whereClause);

      const total = countResult[0]?.value ?? 0;

      const orderByClause =
        sortBy === "name"
          ? sortOrder === "asc"
            ? asc(products.name)
            : desc(products.name)
          : sortOrder === "asc"
            ? asc(products.id)
            : desc(products.id);

      const data = await context.db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset);

      return {
        data,
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
      summary: "Get Product by ID",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isProductId, { message: "Invalid ProductId format" }),
      }),
    )
    .output(productSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asProductId(input.id);

      const product = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!product) {
        throw errors.NOT_FOUND();
      }

      return product;
    }),

  getByBarcode: osdb
    .route({
      method: "GET",
      path: `${pathBase}/barcode/{barcode}`,
      summary: "Get Product by Barcode",
    })
    .input(z.object({ barcode: z.string().min(1) }))
    .output(productSchema)
    .handler(async ({ input, context, errors }) => {
      const product = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.barcode, input.barcode),
      });

      if (!product) {
        throw errors.NOT_FOUND();
      }

      return product;
    }),
};
