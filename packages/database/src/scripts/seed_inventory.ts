/**
 * Seeds inventory (prices + stock levels) for all store × product combinations.
 *
 * Generates realistic prices using keyword-based heuristics from product names,
 * applies store-brand price modifiers (budget vs premium), simulates ~15% of items
 * on sale, and creates realistic stock distributions with ~8% out-of-stock rate.
 *
 * Idempotent & parallel-safe: checks existing inventory per-store before inserting,
 * uses ON CONFLICT DO NOTHING on the (store_id, product_id) unique constraint.
 *
 * Usage:
 *   bun run src/scripts/seed_inventory.ts
 *   bun run src/scripts/seed_inventory.ts --dry-run
 */

import { eq } from "drizzle-orm";
import { _localDb } from "../db";
import { products } from "../entities/products/schema";
import { stores } from "../entities/stores/schema";
import { storeBrands } from "../entities/store-brands/schema";
import { inventory } from "../entities/inventory/schema";

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Configuration ──────────────────────────────────────────────────────────

/** Fraction of products each store carries (0–1) */
const COVERAGE = 0.85;
/** Fraction of inventory rows that get a sale price */
const SALE_CHANCE = 0.15;
/** Fraction of inventory rows with zero stock */
const OUT_OF_STOCK_CHANCE = 0.08;
/** Sale discount range (fraction off regular price) */
const SALE_DISCOUNT: [number, number] = [0.1, 0.3];
/** Sale starts between N days ago and N days from now */
const SALE_START_RANGE: [number, number] = [-3, 7];
/** Sale duration in days */
const SALE_DURATION_RANGE: [number, number] = [3, 14];

// ─── Price Rules ────────────────────────────────────────────────────────────
// Checked top-to-bottom; first keyword match wins. Ranges in cents.
// More specific keywords MUST come before general ones.

const PRICE_RULES: { keywords: string[]; range: [number, number] }[] = [
  // Household
  { keywords: ["laundry detergent"], range: [599, 1499] },
  { keywords: ["dish soap"], range: [299, 599] },
  { keywords: ["paper towel"], range: [799, 1399] },
  { keywords: ["toilet paper"], range: [799, 1399] },

  // Pet
  { keywords: ["dog food"], range: [1299, 2999] },
  { keywords: ["cat food"], range: [999, 2499] },

  // Baby
  { keywords: ["infant formula"], range: [1999, 3499] },
  { keywords: ["baby food", "baby snack"], range: [149, 399] },

  // Coffee & Tea
  { keywords: ["ground coffee", "coffee capsule"], range: [799, 1499] },
  { keywords: ["instant coffee"], range: [499, 899] },
  { keywords: ["coffee drink"], range: [249, 499] },
  { keywords: ["yerba mate"], range: [499, 899] },
  { keywords: ["tea"], range: [299, 599] },

  // Alcohol
  { keywords: ["beer"], range: [799, 1499] },

  // Dairy — specific before general
  { keywords: ["cream cheese"], range: [249, 449] },
  { keywords: ["sour cream"], range: [199, 399] },
  { keywords: ["ice cream"], range: [399, 799] },
  { keywords: ["plant-based milk"], range: [349, 599] },
  { keywords: ["coconut milk"], range: [199, 349] },
  { keywords: ["milk"], range: [299, 549] },
  { keywords: ["yogurt"], range: [99, 449] },
  { keywords: ["cheese"], range: [349, 899] },
  { keywords: ["butter"], range: [349, 599] },
  { keywords: ["cream"], range: [249, 449] },
  { keywords: ["egg"], range: [299, 599] },

  // Beverages
  { keywords: ["energy drink"], range: [199, 349] },
  { keywords: ["sports drink"], range: [149, 249] },
  { keywords: ["coconut water"], range: [299, 449] },
  { keywords: ["kombucha"], range: [349, 499] },
  { keywords: ["sparkling water"], range: [99, 199] },
  { keywords: ["water"], range: [79, 199] },
  { keywords: ["soda"], range: [99, 249] },
  { keywords: ["iced tea"], range: [99, 249] },
  { keywords: ["orange juice"], range: [299, 549] },
  { keywords: ["juice"], range: [249, 499] },

  // Breakfast
  { keywords: ["granola bar"], range: [349, 549] },
  { keywords: ["cereal", "granola"], range: [299, 549] },
  { keywords: ["oatmeal"], range: [249, 449] },
  { keywords: ["pancake mix"], range: [249, 449] },
  { keywords: ["jam"], range: [299, 549] },
  { keywords: ["honey"], range: [499, 899] },
  { keywords: ["syrup"], range: [349, 599] },

  // Bakery
  { keywords: ["bread", "bagel", "muffin"], range: [249, 449] },
  { keywords: ["tortilla"], range: [199, 399] },
  { keywords: ["cracker"], range: [249, 449] },

  // Pasta, Rice & Grains
  { keywords: ["pasta", "noodle", "couscous"], range: [99, 249] },
  { keywords: ["quinoa"], range: [399, 699] },
  { keywords: ["rice"], range: [199, 499] },
  { keywords: ["flour"], range: [249, 449] },

  // Canned
  { keywords: ["canned soup"], range: [149, 349] },
  { keywords: ["canned tuna"], range: [99, 249] },
  { keywords: ["canned"], range: [79, 249] },
  { keywords: ["pickle"], range: [249, 449] },
  { keywords: ["olive"], range: [299, 549] },

  // Condiments & Sauces
  { keywords: ["olive oil"], range: [599, 1199] },
  { keywords: ["cooking oil"], range: [399, 799] },
  { keywords: ["vinegar"], range: [199, 399] },
  { keywords: ["hot sauce"], range: [249, 449] },
  { keywords: ["barbecue sauce"], range: [249, 449] },
  { keywords: ["soy sauce"], range: [199, 399] },
  { keywords: ["pasta sauce"], range: [249, 449] },
  { keywords: ["salad dressing"], range: [249, 449] },
  { keywords: ["ketchup"], range: [199, 349] },
  { keywords: ["mustard"], range: [149, 299] },
  { keywords: ["mayonnaise"], range: [299, 499] },

  // Snacks
  { keywords: ["plantain chip"], range: [249, 449] },
  { keywords: ["tortilla chip"], range: [299, 499] },
  { keywords: ["chip"], range: [299, 549] },
  { keywords: ["popcorn"], range: [249, 449] },
  { keywords: ["pretzel"], range: [249, 399] },
  { keywords: ["trail mix"], range: [499, 799] },
  { keywords: ["nut"], range: [499, 899] },
  { keywords: ["dried fruit"], range: [399, 699] },
  { keywords: ["protein bar"], range: [399, 599] },

  // Sweets
  { keywords: ["frozen dessert"], range: [399, 699] },
  { keywords: ["chocolate chip"], range: [249, 449] },
  { keywords: ["chocolate"], range: [249, 499] },
  { keywords: ["candy"], range: [99, 299] },
  { keywords: ["cookie"], range: [299, 499] },
  { keywords: ["chewing gum"], range: [99, 199] },

  // Frozen
  { keywords: ["frozen pizza"], range: [499, 999] },
  { keywords: ["frozen fish"], range: [499, 899] },
  { keywords: ["frozen meal"], range: [299, 599] },
  { keywords: ["frozen fry", "frozen fries"], range: [249, 449] },
  { keywords: ["frozen vegetable"], range: [199, 399] },
  { keywords: ["frozen fruit"], range: [249, 449] },

  // Produce
  { keywords: ["herb"], range: [149, 349] },
  { keywords: ["mushroom"], range: [249, 449] },
  { keywords: ["salad"], range: [299, 499] },
  { keywords: ["fruit"], range: [199, 499] },
  { keywords: ["vegetable"], range: [149, 399] },

  // Meat & Seafood
  { keywords: ["smoked salmon"], range: [899, 1599] },
  { keywords: ["shrimp"], range: [799, 1499] },
  { keywords: ["bacon"], range: [449, 799] },
  { keywords: ["sausage"], range: [399, 699] },
  { keywords: ["ham"], range: [399, 699] },
  { keywords: ["beef"], range: [599, 1499] },
  { keywords: ["chicken"], range: [499, 1199] },
  { keywords: ["pork"], range: [499, 1299] },

  // Deli
  { keywords: ["hummus"], range: [349, 549] },
  { keywords: ["guacamole"], range: [399, 599] },
  { keywords: ["salsa"], range: [249, 449] },
  { keywords: ["dip"], range: [299, 499] },

  // Latin & Caribbean
  { keywords: ["arepa"], range: [349, 549] },
  { keywords: ["empanada"], range: [449, 699] },
  { keywords: ["dulce de leche"], range: [349, 599] },
  { keywords: ["guava paste"], range: [299, 499] },
  { keywords: ["black bean"], range: [99, 249] },
  { keywords: ["sofrito"], range: [199, 349] },
  { keywords: ["mole"], range: [299, 499] },

  // Plant-based
  { keywords: ["tofu"], range: [249, 449] },
  { keywords: ["plant-based meat"], range: [499, 799] },

  // Baking
  { keywords: ["vanilla extract"], range: [349, 799] },
  { keywords: ["baking powder"], range: [199, 349] },
  { keywords: ["sugar"], range: [199, 399] },

  // Spices & Seasonings
  { keywords: ["seasoning"], range: [149, 349] },
  { keywords: ["salt"], range: [99, 249] },
  { keywords: ["pepper"], range: [249, 499] },
  { keywords: ["spice"], range: [249, 549] },
];

// ─── Store-brand price multipliers ──────────────────────────────────────────
// Budget stores apply < 1.0, premium stores > 1.0

const BRAND_MULTIPLIERS: Record<string, [number, number]> = {
  // Budget
  walmart: [0.82, 0.92],
  aldi: [0.8, 0.9],
  costco: [0.85, 0.93],
  lidl: [0.82, 0.9],
  "save-a-lot": [0.78, 0.88],
  // Mid-range
  publix: [0.95, 1.05],
  kroger: [0.9, 1.0],
  target: [0.92, 1.02],
  safeway: [0.93, 1.03],
  albertsons: [0.93, 1.03],
  "h-e-b": [0.9, 1.0],
  winn: [0.93, 1.03],
  // Premium
  "whole foods": [1.1, 1.25],
  "trader joe": [0.95, 1.08],
  sprouts: [1.05, 1.18],
  "fresh market": [1.08, 1.2],
};
const DEFAULT_MULTIPLIER: [number, number] = [0.95, 1.05];

// ─── Helpers ────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Round to a common retail price ending (.29, .49, .79, .99) */
function retailRound(cents: number): number {
  const dollars = Math.floor(cents / 100);
  const endings = [29, 49, 79, 99];
  const ending = endings[randInt(0, endings.length - 1)]!;
  return Math.max(99, dollars * 100 + ending);
}

function getBasePrice(productName: string): number {
  const lower = productName.toLowerCase();
  for (const rule of PRICE_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return retailRound(randInt(rule.range[0], rule.range[1]));
    }
  }
  return retailRound(randInt(199, 999));
}

function getBrandMultiplier(brandName: string): number {
  const lower = brandName.toLowerCase();
  for (const [key, range] of Object.entries(BRAND_MULTIPLIERS)) {
    if (lower.includes(key)) {
      return randFloat(range[0], range[1]);
    }
  }
  return randFloat(DEFAULT_MULTIPLIER[0], DEFAULT_MULTIPLIER[1]);
}

function generateQuantity(type: string): number {
  const roll = Math.random();
  if (roll < OUT_OF_STOCK_CHANCE) return 0;

  if (type === "UNITS") {
    if (roll < 0.23) return randInt(1, 10); // low stock
    if (roll < 0.73) return randInt(11, 100); // normal
    return randInt(101, 200); // well-stocked
  }
  // WEIGHT — grams
  if (roll < 0.23) return randInt(100, 2000);
  if (roll < 0.73) return randInt(2001, 20000);
  return randInt(20001, 50000);
}

// ─── Main ───────────────────────────────────────────────────────────────────

console.log(
  DRY_RUN
    ? "=== DRY RUN MODE — no database writes will be made ===\n"
    : "=== SEED INVENTORY ===\n",
);

// 1. Load stores (with brand name) and products

console.log("Loading stores and products from database...\n");

const allStores = await _localDb
  .select({
    id: stores.id,
    name: stores.name,
    brandName: storeBrands.name,
  })
  .from(stores)
  .innerJoin(storeBrands, eq(stores.brandId, storeBrands.id));

const allProducts = await _localDb
  .select({
    id: products.id,
    name: products.name,
    stockType: products.stockType,
  })
  .from(products);

if (allStores.length === 0) {
  console.error("ERROR: No stores found in the database. Seed stores first.");
  process.exit(1);
}

if (allProducts.length === 0) {
  console.error(
    "ERROR: No products found in the database. Run seed_products.ts first.",
  );
  process.exit(1);
}

console.log(
  `Found ${allStores.length} stores and ${allProducts.length} products.\n`,
);

// 2. Generate one base price per product (consistent across stores)

const basePrices = new Map<string, number>();
for (const product of allProducts) {
  basePrices.set(product.id, getBasePrice(product.name));
}

// 3. Process each store

let totalInserted = 0;
let totalSkipped = 0;
let totalOnSale = 0;
let totalOutOfStock = 0;

for (const store of allStores) {
  console.log(`── "${store.name}" (${store.brandName}) ──`);
  
  // Avoid seeding test store
  if (store.name === "Test") {
    continue;
  }

  // Check what's already in inventory for this store
  const existing = await _localDb
    .select({ productId: inventory.productId })
    .from(inventory)
    .where(eq(inventory.storeId, store.id));
  const existingIds = new Set(existing.map((r) => r.productId));

  // Filter to products not yet stocked, then apply coverage probability
  const available = allProducts.filter((p) => !existingIds.has(p.id));

  if (available.length === 0) {
    console.log("  All products already in inventory — skipping.\n");
    continue;
  }

  const toStock = available.filter(() => Math.random() < COVERAGE);

  if (toStock.length === 0) {
    console.log("  No new products selected this run.\n");
    continue;
  }

  if (DRY_RUN) {
    const estSales = Math.round(toStock.length * SALE_CHANCE);
    const estOos = Math.round(toStock.length * OUT_OF_STOCK_CHANCE);
    console.log(
      `  Would insert ${toStock.length} rows (~${estSales} on sale, ~${estOos} out of stock).\n`,
    );
    continue;
  }

  console.log(
    `  ${existing.length} existing, ${available.length} available → stocking ${toStock.length}...`,
  );

  // One multiplier per store — captures "Walmart is consistently cheaper"
  const brandMult = getBrandMultiplier(store.brandName);

  // Build all rows for this store in memory
  const rows: (typeof inventory.$inferInsert)[] = [];
  let storeSales = 0;
  let storeOos = 0;

  for (const product of toStock) {
    const basePrice = basePrices.get(product.id)!;
    const regularPrice = retailRound(Math.round(basePrice * brandMult));

    // Sale (15% chance)
    let salePrice: number | null = null;
    let saleStartDate: Date | null = null;
    let saleEndDate: Date | null = null;

    if (Math.random() < SALE_CHANCE) {
      const discount = randFloat(SALE_DISCOUNT[0], SALE_DISCOUNT[1]);
      let computed = retailRound(Math.round(regularPrice * (1 - discount)));
      if (computed >= regularPrice) {
        computed = retailRound(regularPrice - 100);
      }
      if (computed > 0 && computed < regularPrice) {
        salePrice = computed;
        const now = new Date();
        saleStartDate = new Date(
          now.getTime() +
            randInt(SALE_START_RANGE[0], SALE_START_RANGE[1]) * 86_400_000,
        );
        saleEndDate = new Date(
          saleStartDate.getTime() +
            randInt(SALE_DURATION_RANGE[0], SALE_DURATION_RANGE[1]) *
              86_400_000,
        );
        storeSales++;
      }
    }

    const quantity = generateQuantity(product.stockType);
    if (quantity === 0) storeOos++;

    rows.push({
      storeId: store.id,
      productId: product.id,
      quantity,
      regularPrice,
      salePrice,
      saleStartDate,
      saleEndDate,
    });
  }

  // Batch insert in chunks (Postgres has a parameter limit of ~65535)
  // Each row uses 7 params, so ~9000 rows per chunk is safe
  const CHUNK_SIZE = 500;
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    try {
      const result = await _localDb
        .insert(inventory)
        .values(chunk)
        .onConflictDoNothing({
          target: [inventory.storeId, inventory.productId],
        })
        .returning({ id: inventory.id });

      inserted += result.length;
      skipped += chunk.length - result.length;
    } catch (error) {
      const msg =
        error instanceof Error
          ? `${error.message} ${error.cause instanceof Error ? error.cause.message : ""}`
          : "";
      if (msg.includes("unique") || msg.includes("23505")) {
        skipped += chunk.length;
        continue;
      }
      throw error;
    }
  }

  totalInserted += inserted;
  totalSkipped += skipped;
  totalOnSale += storeSales;
  totalOutOfStock += storeOos;

  console.log(
    `  ✓ Inserted ${inserted}, skipped ${skipped} (${storeSales} on sale, ${storeOos} out of stock).\n`,
  );
}

// ─── Summary ────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log("=== DRY RUN COMPLETE ===");
} else {
  console.log(
    `=== Done! Inserted: ${totalInserted}, Skipped: ${totalSkipped}, On sale: ${totalOnSale}, Out of stock: ${totalOutOfStock} ===`,
  );
}

process.exit(0);
