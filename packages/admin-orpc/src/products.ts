import { z } from "zod";
import {
  productSchema,
  newProductSchema,
  products,
  isProductId,
  asProductId,
} from "@repo/database";
import { eq, asc, desc, ilike, count, and } from "drizzle-orm";
import { protectedProcedure } from "./base";

const osdb = protectedProcedure.errors({
  NOT_FOUND: {
    status: 404,
    message: "Product not found",
  },
  CONFLICT_NAME: {
    status: 409,
    message: "Product with this name already exists",
  },
  CONFLICT_SKU: {
    status: 409,
    message: "Product with this SKU already exists",
  },
  CONFLICT_BARCODE: {
    status: 409,
    message: "Product with this barcode already exists",
  },
});

const pathBase = "/products";

// Sorting schemas
const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");
const sortFieldSchema = z.enum(["name", "id", "sku"]).default("name");

// Stock type filter schema
const stockTypeFilterSchema = z.enum(["WEIGHT", "UNITS"]).optional();

// Paginated response schema
const paginatedProductsSchema = z.object({
  data: z.array(productSchema),
  pagination: z.object({
    page: z.number().positive(),
    pageSize: z.number().positive(),
    total: z.number().nonnegative(),
    totalPages: z.number().nonnegative(),
  }),
});

// Combined input schema for getAll with field-based filtering
const getAllProductsInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  name: z.string().optional(),
  sku: z.string().optional(),
  stockType: stockTypeFilterSchema,
  sortBy: sortFieldSchema,
  sortOrder: sortOrderSchema,
});

export const productsProcedures = {
  getAll: osdb
    .route({ method: "GET", path: pathBase, summary: "Get All Products" })
    .input(getAllProductsInputSchema)
    .output(paginatedProductsSchema)
    .handler(async ({ input, context }) => {
      const { page, pageSize, name, sku, stockType, sortBy, sortOrder } = input;
      const offset = (page - 1) * pageSize;

      // Build where clause for field-based filtering
      const whereConditions = [];

      if (name) {
        whereConditions.push(ilike(products.name, `%${name}%`));
      }
      if (sku) {
        whereConditions.push(ilike(products.sku, `%${sku}%`));
      }
      if (stockType) {
        whereConditions.push(eq(products.stockType, stockType));
      }

      const whereClause =
        whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Get total count
      const countResult = await context.db
        .select({ value: count() })
        .from(products)
        .where(whereClause);

      const total = countResult[0]?.value ?? 0;

      // Build order by clause
      const orderByClause =
        sortBy === "name"
          ? sortOrder === "asc"
            ? asc(products.name)
            : desc(products.name)
          : sortBy === "sku"
            ? sortOrder === "asc"
              ? asc(products.sku)
              : desc(products.sku)
            : sortOrder === "asc"
              ? asc(products.id)
              : desc(products.id);

      // Get paginated data
      const productsData = await context.db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset);

      return {
        data: productsData,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      };
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

  create: osdb
    .route({
      method: "POST",
      path: pathBase,
      summary: "Create Product",
      successStatus: 201,
    })
    .input(newProductSchema.omit({ id: true }))
    .output(productSchema)
    .handler(async ({ input, context, errors }) => {
      // Check for duplicate name
      const existingName = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.name, input.name),
      });

      if (existingName) {
        throw errors.CONFLICT_NAME();
      }

      // Check for duplicate SKU
      const existingSku = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.sku, input.sku),
      });

      if (existingSku) {
        throw errors.CONFLICT_SKU();
      }

      // Check for duplicate barcode if provided
      if (input.barcode) {
        const existingBarcode = await context.db.query.products.findFirst({
          where: (fields, { eq }) => eq(fields.barcode, input.barcode!),
        });

        if (existingBarcode) {
          throw errors.CONFLICT_BARCODE();
        }
      }

      const [product] = await context.db
        .insert(products)
        .values(input)
        .returning();

      if (!product) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return product;
    }),

  update: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/{id}`,
      summary: "Update Product",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isProductId, { message: "Invalid ProductId format" }),
        data: newProductSchema.omit({ id: true }).partial(),
      }),
    )
    .output(productSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asProductId(input.id);

      // Check if product exists
      const existing = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      // Check for duplicate name if name is being updated
      if (input.data.name && input.data.name !== existing.name) {
        const duplicate = await context.db.query.products.findFirst({
          where: (fields, { eq }) => eq(fields.name, input.data.name!),
        });

        if (duplicate) {
          throw errors.CONFLICT_NAME();
        }
      }

      // Check for duplicate SKU if SKU is being updated
      if (input.data.sku && input.data.sku !== existing.sku) {
        const duplicate = await context.db.query.products.findFirst({
          where: (fields, { eq }) => eq(fields.sku, input.data.sku!),
        });

        if (duplicate) {
          throw errors.CONFLICT_SKU();
        }
      }

      // Check for duplicate barcode if barcode is being updated
      if (input.data.barcode && input.data.barcode !== existing.barcode) {
        const duplicate = await context.db.query.products.findFirst({
          where: (fields, { eq }) => eq(fields.barcode, input.data.barcode!),
        });

        if (duplicate) {
          throw errors.CONFLICT_BARCODE();
        }
      }

      const [updated] = await context.db
        .update(products)
        .set(input.data)
        .where(eq(products.id, id))
        .returning();

      if (!updated) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return updated;
    }),

  delete: osdb
    .route({
      method: "DELETE",
      path: `${pathBase}/{id}`,
      summary: "Delete Product",
    })
    .input(
      z.object({
        id: z
          .string()
          .refine(isProductId, { message: "Invalid ProductId format" }),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        id: z
          .string()
          .refine(isProductId, { message: "Invalid ProductId format" }),
      }),
    )
    .handler(async ({ input, context, errors }) => {
      const id = asProductId(input.id);

      // Check if product exists
      const existing = await context.db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      await context.db.delete(products).where(eq(products.id, id));

      return { success: true, id: input.id };
    }),
};
