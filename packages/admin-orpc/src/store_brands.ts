import { os } from "@orpc/server";
import { z } from "zod";
import {
  storeBrandSchema,
  newStoreBrandSchema,
  DB,
  storeBrands,
  asStoreBrandId,
} from "@repo/database";
import { eq, asc, desc, ilike, count } from "drizzle-orm";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "Internal server error",
  },
  NOT_FOUND: {
    status: 404,
    message: "Store brand not found",
  },
  VALIDATION_ERROR: {
    status: 400,
    message: "Validation error",
  },
  CONFLICT: {
    status: 409,
    message: "Store brand with this name already exists",
  },
});

const pathBase = "/store-brands";

// Pagination and sorting schemas
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
});

const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");
const sortFieldSchema = z.enum(["name", "id"]).default("name");

const searchSchema = z.object({
  search: z.string().optional(),
});

// Paginated response schema
const paginatedStoreBrandsSchema = z.object({
  data: z.array(storeBrandSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const storeBrandsProcedures = {
  getAll: osdb
    .route({ method: "GET", path: pathBase, summary: "Get All Store Brands" })
    .input(
      paginationSchema.and(searchSchema).and(
        z.object({
          sortBy: sortFieldSchema,
          sortOrder: sortOrderSchema,
        }),
      ),
    )
    .output(paginatedStoreBrandsSchema)
    .handler(async ({ input, context }) => {
      const { page, pageSize, search, sortBy, sortOrder } = input;
      const offset = (page - 1) * pageSize;

      // Build where clause for search
      const whereClause = search
        ? ilike(storeBrands.name, `%${search}%`)
        : undefined;

      // Get total count
      const countResult = await context.db
        .select({ value: count() })
        .from(storeBrands)
        .where(whereClause);

      const total = countResult[0]?.value ?? 0;

      // Build order by clause
      const orderByClause =
        sortBy === "name"
          ? sortOrder === "asc"
            ? asc(storeBrands.name)
            : desc(storeBrands.name)
          : sortOrder === "asc"
            ? asc(storeBrands.id)
            : desc(storeBrands.id);

      // Get paginated data
      const brands = await context.db
        .select()
        .from(storeBrands)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(pageSize)
        .offset(offset);

      return {
        data: brands,
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
      summary: "Get Store Brand by ID",
    })
    .input(z.object({ id: z.string() }))
    .output(storeBrandSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asStoreBrandId(input.id);
      const brand = await context.db.query.storeBrands.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!brand) {
        throw errors.NOT_FOUND();
      }

      return brand;
    }),

  create: osdb
    .route({
      method: "POST",
      path: pathBase,
      summary: "Create Store Brand",
      successStatus: 201,
    })
    .input(newStoreBrandSchema.omit({ id: true }))
    .output(storeBrandSchema)
    .handler(async ({ input, context, errors }) => {
      // Check for duplicate name
      const existing = await context.db.query.storeBrands.findFirst({
        where: (fields, { eq }) => eq(fields.name, input.name),
      });

      if (existing) {
        throw errors.CONFLICT();
      }

      const [storeBrand] = await context.db
        .insert(storeBrands)
        .values(input)
        .returning();

      if (!storeBrand) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return storeBrand;
    }),

  update: osdb
    .route({
      method: "PUT",
      path: `${pathBase}/{id}`,
      summary: "Update Store Brand",
    })
    .input(
      z.object({
        id: z.string(),
        data: newStoreBrandSchema.omit({ id: true }).partial(),
      }),
    )
    .output(storeBrandSchema)
    .handler(async ({ input, context, errors }) => {
      const id = asStoreBrandId(input.id);

      // Check if brand exists
      const existing = await context.db.query.storeBrands.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      // Check for duplicate name if name is being updated
      if (input.data.name && input.data.name !== existing.name) {
        const duplicate = await context.db.query.storeBrands.findFirst({
          where: (fields, { eq }) => eq(fields.name, input.data.name!),
        });

        if (duplicate) {
          throw errors.CONFLICT();
        }
      }

      const [updated] = await context.db
        .update(storeBrands)
        .set(input.data)
        .where(eq(storeBrands.id, id))
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
      summary: "Delete Store Brand",
    })
    .input(z.object({ id: z.string() }))
    .output(z.object({ success: z.boolean(), id: z.string() }))
    .handler(async ({ input, context, errors }) => {
      const id = asStoreBrandId(input.id);

      // Check if brand exists
      const existing = await context.db.query.storeBrands.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existing) {
        throw errors.NOT_FOUND();
      }

      await context.db.delete(storeBrands).where(eq(storeBrands.id, id));

      return { success: true, id: input.id };
    }),
};
