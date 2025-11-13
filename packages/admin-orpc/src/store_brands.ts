import { os } from "@orpc/server";
import { z } from "zod";
import {
  storeBrandSchema,
  newStoreBrandSchema,
  DB,
  storeBrands,
  asStoreBrandId,
} from "@repo/database";

const osdb = os.$context<{ db: DB; requestId: string }>().errors({
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "Internal server error",
  },
});

const pathBase = "/store-brands";

export const storeBrandsProcedures = {
  getAll: osdb
    .route({ method: "GET", path: pathBase, summary: "Get All Store Brands" })
    .output(z.array(storeBrandSchema))
    .handler(async ({ context }) => {
      const brands = await context.db.query.storeBrands.findMany();
      return brands;
    }),

  get: osdb
    .route({
      method: "GET",
      path: `${pathBase}/{id}`,
      summary: "Get Store Brand by ID",
    }) // We use {id} to make it compatible with OpenAPI
    .input(z.object({ id: z.string() }))
    .output(storeBrandSchema)
    .errors({
      NOT_FOUND: {
        status: 404,
        message: "Store brand not found",
      },
    })
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
      const [storeBrand] = await context.db
        .insert(storeBrands)
        .values(input)
        .returning();

      if (!storeBrand) {
        throw errors.INTERNAL_SERVER_ERROR();
      }

      return storeBrand;
    }),
};
