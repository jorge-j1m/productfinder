import brands from "./brands.json";
import stores from "./stores_withcoordinates.json";
import { call, ORPCError } from "@orpc/server";
import { adminRouter } from "@repo/admin-orpc";
import { db, shutdownDb } from "../db";
import type { EmployeeSession, StoreBrandId } from "@repo/database";

// Synthetic ADMIN session used to satisfy the protectedProcedure middleware
// when invoking admin-orpc handlers from a trusted local seed script.
const seedSession = {
  user: {
    id: "emp_seed",
    email: "seed@local",
    emailVerified: true,
    name: "Seed Script",
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    firstName: "Seed",
    lastName: "Script",
    role: "ADMIN",
    storeId: "store_seed",
    status: "ACTIVE",
  },
  session: {
    id: "esess_seed",
    userId: "emp_seed",
    token: "seed",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
} as unknown as EmployeeSession;

const dbBrands: Record<string, StoreBrandId> = {};
for (const brand of brands) {
  try {
    const created = await call(
      adminRouter.storeBrands.create,
      { name: brand.name, logo: brand.logo },
      { context: { db, requestId: "seed-brand-stores", session: seedSession } },
    );

    console.log(`Created brand ${brand.name}, using id ${created.id}`);
    dbBrands[brand.name] = created.id;
  } catch (error) {
    if (error instanceof ORPCError && error.code === "CONFLICT") {
      const existing = await db.query.storeBrands.findFirst({
        where: (fields, { eq }) => eq(fields.name, brand.name),
      });
      if (!existing) {
        throw new Error(
          `Brand ${brand.name} already exists, but not in the database`,
        );
      }
      console.log(
        `Brand ${brand.name} already exists, using id ${existing.id}`,
      );
      dbBrands[brand.name] = existing.id;
      continue; // Skip if brand already exists
    } else {
      console.error(error);
      throw error;
    }
  }
}

for (const store of stores) {
  try {
    const brandId = dbBrands[store.brand];
    if (!brandId) {
      throw new Error(`Brand ${store.brand} not found`);
    }

    const created = await call(
      adminRouter.stores.create,
      {
        name: store.name,
        brandId,
        address: store.address,
        city: store.city,
        state: "FL",
        zip: store.zip,
        countryCode: "US",
        latitude: store.latitude,
        longitude: store.longitude,
      },
      { context: { db, requestId: "seed-brand-stores", session: seedSession } },
    );
    console.log(`Created store ${store.name}, using id ${created.id}`);
  } catch (error) {
    if (error instanceof ORPCError && error.code === "CONFLICT") {
      const existing = await db.query.stores.findFirst({
        where: (fields, { eq }) => eq(fields.name, store.name),
      });
      if (!existing) {
        throw new Error(
          `Store ${store.name} already exists, but not in the database`,
        );
      }
      console.log(
        `Store ${store.name} already exists, using id ${existing.id}`,
      );
      continue; // Skip if store already exists
    } else {
      console.error(error);
      throw error;
    }
  }
}

await shutdownDb(db);
console.log("Done");
