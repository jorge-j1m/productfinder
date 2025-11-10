import { ORPCError, os, type } from "@orpc/server";
import {
  storeBrandSchema,
  newStoreBrandSchema,
  DB,
  storeBrands,
  asStoreBrandId,
} from "@repo/database";

const osdb = os.$context<{ db: DB }>();

export const storeBrandsProcedures = {
  get: osdb
    .input(type<{ id: string }>())
    .output(storeBrandSchema)
    .handler(async ({ input, context }) => {
      const id = asStoreBrandId(input.id);
      const brand = await context.db.query.storeBrands.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!brand) {
        throw new ORPCError(`Store brand with id ${input.id} not found`, {
          status: 404,
        });
      }

      return brand;
    }),

  create: osdb
    .input(newStoreBrandSchema.omit({ id: true }))
    .output(storeBrandSchema)
    .handler(async ({ input, context }) => {
      const [storeBrand] = await context.db
        .insert(storeBrands)
        .values(input)
        .returning();

      if (!storeBrand) {
        throw new ORPCError("Failed to create store brand", { status: 500 });
      }

      return storeBrand;
    }),
};
