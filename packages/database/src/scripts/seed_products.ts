/**
 * Seeds the products table with ~100 real products from Open Food Facts API.
 * Categories chosen for variety; uses ON CONFLICT DO NOTHING to skip duplicates.
 *
 * Usage:
 *   npm run seed-products -w packages/database            # interactive mode
 *   npm run seed-products -w packages/database -- --dry-run  # fetch & preview only, no DB writes
 *
 * Debugging with VSCode:
 *   bun --inspect-brk src/scripts/seed_products.ts
 */

import * as readline from "node:readline/promises";
import { randomBytes } from "node:crypto";
import { _localDb } from "../db";
import { products, stockType } from "../entities/products/schema";

const DRY_RUN = process.argv.includes("--dry-run");

const USER_AGENT =
  "ProductFinder Seed Script/1.0 (https://github.com/productfinder)";
const API_BASE = "https://world.openfoodfacts.org/api/v2/search";
const PAGE_SIZE = 25;
const DELAY_MS = 1500;

type StockType = (typeof stockType.enumValues)[number];

interface Category {
  name: string;
  stockType: StockType;
}

const CATEGORIES: Category[] = [
  // ─── Dairy & Refrigerated ───────────────────────────────────────────────────
  { name: "Milk", stockType: "UNITS" },
  { name: "Yogurts", stockType: "UNITS" },
  { name: "Cheeses", stockType: "UNITS" },
  { name: "Butter", stockType: "UNITS" },
  { name: "Cream", stockType: "UNITS" },
  { name: "Eggs", stockType: "UNITS" },
  { name: "Cream cheese", stockType: "UNITS" },
  { name: "Sour cream", stockType: "UNITS" },

  // ─── Beverages ──────────────────────────────────────────────────────────────
  { name: "Sodas", stockType: "UNITS" },
  { name: "Orange juices", stockType: "UNITS" },
  { name: "Fruit juices", stockType: "UNITS" },
  { name: "Waters", stockType: "UNITS" },
  { name: "Sparkling waters", stockType: "UNITS" },
  { name: "Energy drinks", stockType: "UNITS" },
  { name: "Iced teas", stockType: "UNITS" },
  { name: "Sports drinks", stockType: "UNITS" },
  { name: "Coconut water", stockType: "UNITS" },
  { name: "Coffee drinks", stockType: "UNITS" },
  { name: "Beers", stockType: "UNITS" },

  // ─── Breakfast ──────────────────────────────────────────────────────────────
  { name: "Breakfast cereals", stockType: "UNITS" },
  { name: "Granolas", stockType: "UNITS" },
  { name: "Pancake mixes", stockType: "UNITS" },
  { name: "Oatmeals", stockType: "UNITS" },
  { name: "Jams", stockType: "UNITS" },
  { name: "Honeys", stockType: "UNITS" },
  { name: "Syrups", stockType: "UNITS" },

  // ─── Bread & Bakery ────────────────────────────────────────────────────────
  { name: "Breads", stockType: "UNITS" },
  { name: "Tortillas", stockType: "UNITS" },
  { name: "Bagels", stockType: "UNITS" },
  { name: "Crackers", stockType: "UNITS" },
  { name: "Muffins", stockType: "UNITS" },

  // ─── Pasta, Rice & Grains ──────────────────────────────────────────────────
  { name: "Pasta", stockType: "UNITS" },
  { name: "Rice", stockType: "UNITS" },
  { name: "Noodles", stockType: "UNITS" },
  { name: "Couscous", stockType: "UNITS" },
  { name: "Quinoa", stockType: "UNITS" },
  { name: "Flour", stockType: "UNITS" },

  // ─── Canned & Jarred ──────────────────────────────────────────────────────
  { name: "Canned vegetables", stockType: "UNITS" },
  { name: "Canned beans", stockType: "UNITS" },
  { name: "Canned tomatoes", stockType: "UNITS" },
  { name: "Canned tuna", stockType: "UNITS" },
  { name: "Canned soups", stockType: "UNITS" },
  { name: "Canned fruits", stockType: "UNITS" },
  { name: "Pickles", stockType: "UNITS" },
  { name: "Olives", stockType: "UNITS" },

  // ─── Condiments & Sauces ──────────────────────────────────────────────────
  { name: "Ketchup", stockType: "UNITS" },
  { name: "Mustard", stockType: "UNITS" },
  { name: "Mayonnaise", stockType: "UNITS" },
  { name: "Hot sauces", stockType: "UNITS" },
  { name: "Barbecue sauces", stockType: "UNITS" },
  { name: "Soy sauces", stockType: "UNITS" },
  { name: "Salad dressings", stockType: "UNITS" },
  { name: "Pasta sauces", stockType: "UNITS" },
  { name: "Vinegars", stockType: "UNITS" },
  { name: "Olive oils", stockType: "UNITS" },
  { name: "Cooking oils", stockType: "UNITS" },

  // ─── Snacks ─────────────────────────────────────────────────────────────────
  { name: "Chips", stockType: "UNITS" },
  { name: "Tortilla chips", stockType: "UNITS" },
  { name: "Popcorn", stockType: "UNITS" },
  { name: "Nuts", stockType: "UNITS" },
  { name: "Trail mixes", stockType: "UNITS" },
  { name: "Pretzels", stockType: "UNITS" },
  { name: "Dried fruits", stockType: "UNITS" },
  { name: "Granola bars", stockType: "UNITS" },
  { name: "Protein bars", stockType: "UNITS" },

  // ─── Sweets & Chocolate ─────────────────────────────────────────────────────
  { name: "Chocolate", stockType: "UNITS" },
  { name: "Candies", stockType: "UNITS" },
  { name: "Cookies", stockType: "UNITS" },
  { name: "Ice cream", stockType: "UNITS" },
  { name: "Frozen desserts", stockType: "UNITS" },
  { name: "Chewing gum", stockType: "UNITS" },

  // ─── Frozen Foods ──────────────────────────────────────────────────────────
  { name: "Frozen pizzas", stockType: "UNITS" },
  { name: "Frozen vegetables", stockType: "UNITS" },
  { name: "Frozen meals", stockType: "UNITS" },
  { name: "Frozen fries", stockType: "UNITS" },
  { name: "Frozen fish", stockType: "UNITS" },
  { name: "Frozen fruits", stockType: "UNITS" },

  // ─── Produce ────────────────────────────────────────────────────────────────
  { name: "Fruits", stockType: "WEIGHT" },
  { name: "Vegetables", stockType: "WEIGHT" },
  { name: "Salads", stockType: "UNITS" },
  { name: "Herbs", stockType: "WEIGHT" },
  { name: "Mushrooms", stockType: "WEIGHT" },

  // ─── Meat & Seafood ─────────────────────────────────────────────────────────
  { name: "Chicken", stockType: "WEIGHT" },
  { name: "Beef", stockType: "WEIGHT" },
  { name: "Pork", stockType: "WEIGHT" },
  { name: "Sausages", stockType: "UNITS" },
  { name: "Ham", stockType: "UNITS" },
  { name: "Bacon", stockType: "UNITS" },
  { name: "Smoked salmon", stockType: "UNITS" },
  { name: "Shrimp", stockType: "WEIGHT" },

  // ─── Deli & Prepared ───────────────────────────────────────────────────────
  { name: "Hummus", stockType: "UNITS" },
  { name: "Guacamole", stockType: "UNITS" },
  { name: "Salsa", stockType: "UNITS" },
  { name: "Dips", stockType: "UNITS" },

  // ─── Latin & Caribbean (South Florida staples) ─────────────────────────────
  { name: "Plantain chips", stockType: "UNITS" },
  { name: "Coconut milk", stockType: "UNITS" },
  { name: "Black beans", stockType: "UNITS" },
  { name: "Arepas", stockType: "UNITS" },
  { name: "Dulce de leche", stockType: "UNITS" },
  { name: "Mole", stockType: "UNITS" },
  { name: "Sofrito", stockType: "UNITS" },
  { name: "Empanadas", stockType: "UNITS" },
  { name: "Yerba mate", stockType: "UNITS" },
  { name: "Guava paste", stockType: "UNITS" },

  // ─── Coffee & Tea ──────────────────────────────────────────────────────────
  { name: "Ground coffee", stockType: "UNITS" },
  { name: "Coffee capsules", stockType: "UNITS" },
  { name: "Teas", stockType: "UNITS" },
  { name: "Instant coffee", stockType: "UNITS" },

  // ─── Baking ─────────────────────────────────────────────────────────────────
  { name: "Sugar", stockType: "UNITS" },
  { name: "Baking powder", stockType: "UNITS" },
  { name: "Vanilla extract", stockType: "UNITS" },
  { name: "Chocolate chips", stockType: "UNITS" },

  // ─── Spices & Seasonings ───────────────────────────────────────────────────
  { name: "Salt", stockType: "UNITS" },
  { name: "Pepper", stockType: "UNITS" },
  { name: "Spices", stockType: "UNITS" },
  { name: "Seasoning mixes", stockType: "UNITS" },

  // ─── Baby & Infant ─────────────────────────────────────────────────────────
  { name: "Baby foods", stockType: "UNITS" },
  { name: "Infant formula", stockType: "UNITS" },
  { name: "Baby snacks", stockType: "UNITS" },

  // ─── Pet ────────────────────────────────────────────────────────────────────
  { name: "Dog food", stockType: "UNITS" },
  { name: "Cat food", stockType: "UNITS" },

  // ─── Plant-Based & Health ──────────────────────────────────────────────────
  { name: "Tofu", stockType: "UNITS" },
  { name: "Plant-based milks", stockType: "UNITS" },
  { name: "Plant-based meats", stockType: "UNITS" },
  { name: "Kombucha", stockType: "UNITS" },

  // ─── Household (non-food, common in supermarkets) ──────────────────────────
  { name: "Laundry detergents", stockType: "UNITS" },
  { name: "Dish soaps", stockType: "UNITS" },
  { name: "Paper towels", stockType: "UNITS" },
  { name: "Toilet paper", stockType: "UNITS" },
];

interface OFFProduct {
  code?: string;
  product_name?: string;
  image_front_small_url?: string;
}

interface OFFResponse {
  products: OFFProduct[];
}

interface SeedProduct {
  name: string;
  barcode: string;
  sku: string;
  stockType: StockType;
  image: string | null;
}

function generateSku(): string {
  const hex = randomBytes(6).toString("hex").toUpperCase();
  return `SKU-${hex.slice(0, 8)}-${hex.slice(8)}`;
}

const MAX_RETRIES = 4;
const RETRY_BASE_MS = 2000;

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  categoryName: string,
): Promise<Response | null> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers });

    if (res.ok) return res;

    if (res.status === 503 && attempt < MAX_RETRIES) {
      const backoff = RETRY_BASE_MS * 2 ** attempt;
      console.warn(
        `  ⏳ 503 on "${categoryName}", retry ${attempt + 1}/${MAX_RETRIES} in ${backoff / 1000}s...`,
      );
      await sleep(backoff);
      continue;
    }

    console.warn(`  WARNING: Failed to fetch "${categoryName}": ${res.status}`);
    return null;
  }
  return null;
}

async function fetchCategory(category: Category): Promise<SeedProduct[]> {
  const params = new URLSearchParams({
    categories_tags_en: category.name,
    fields: "code,product_name,image_front_small_url",
    page_size: String(PAGE_SIZE),
    sort_by: "unique_scans_n",
  });

  const res = await fetchWithRetry(
    `${API_BASE}?${params}`,
    { "User-Agent": USER_AGENT + `${crypto.randomUUID()}` },
    category.name,
  );

  if (!res) return [];

  const data = (await res.json()) as OFFResponse;

  return data.products
    .filter(
      (p): p is OFFProduct & { code: string; product_name: string } =>
        !!p.code?.trim() && !!p.product_name?.trim(),
    )
    .map((p) => ({
      name: p.product_name.slice(0, 255),
      barcode: p.code,
      sku: generateSku(),
      stockType: category.stockType,
      image: p.image_front_small_url?.slice(0, 500) ?? null,
    }));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const answer = await rl.question(`${message} [y/N] `);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

function printProductTable(prods: SeedProduct[]): void {
  const nameWidth = 50;
  const barcodeWidth = 16;
  const skuWidth = 20;
  const typeWidth = 6;
  const imgWidth = 5;

  const header = [
    "#".padStart(3),
    "Name".padEnd(nameWidth),
    "Barcode".padEnd(barcodeWidth),
    "SKU".padEnd(skuWidth),
    "Type".padEnd(typeWidth),
    "Img?".padEnd(imgWidth),
  ].join(" | ");

  console.log(`  ${header}`);
  console.log(`  ${"─".repeat(header.length)}`);

  for (let i = 0; i < prods.length; i++) {
    const p = prods[i]!;
    const row = [
      String(i + 1).padStart(3),
      p.name.slice(0, nameWidth).padEnd(nameWidth),
      p.barcode.padEnd(barcodeWidth),
      p.sku.padEnd(skuWidth),
      p.stockType.padEnd(typeWidth),
      (p.image ? "yes" : "no").padEnd(imgWidth),
    ].join(" | ");
    console.log(`  ${row}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log("=== DRY RUN MODE — no database writes will be made ===\n");
} else {
  console.log("=== SEED PRODUCTS — Interactive Mode ===\n");
}

console.log(
  `Configuration: ${CATEGORIES.length} categories, ${PAGE_SIZE} products each, ${DELAY_MS}ms delay between requests\n`,
);

// ─── Step 1: Fetch ───────────────────────────────────────────────────────────

console.log("STEP 1: Fetching products from Open Food Facts API...\n");

const allProducts: SeedProduct[] = [];
const seenBarcodes = new Set<string>();
const seenNames = new Set<string>();

for (const category of CATEGORIES) {
  console.log(
    `  Fetching "${category.name}" (stockType: ${category.stockType})...`,
  );
  const fetched = await fetchCategory(category);

  let added = 0;
  const duplicates: string[] = [];
  for (const product of fetched) {
    const normalizedName = product.name.toLowerCase();
    if (seenBarcodes.has(product.barcode) || seenNames.has(normalizedName)) {
      duplicates.push(product.name.slice(0, 40));
      continue;
    }

    seenBarcodes.add(product.barcode);
    seenNames.add(normalizedName);
    allProducts.push(product);
    added++;
  }

  console.log(
    `  -> ${added} unique products added (${fetched.length} fetched, ${duplicates.length} duplicates skipped)`,
  );
  if (duplicates.length > 0) {
    console.log(`     Duplicates: ${duplicates.join(", ")}`);
  }
  console.log();
  await sleep(DELAY_MS);
}

// ─── Step 2: Preview ─────────────────────────────────────────────────────────

console.log(`STEP 2: Preview — ${allProducts.length} products ready\n`);
printProductTable(allProducts);

const withImages = allProducts.filter((p) => p.image).length;
console.log(
  `\n  Summary: ${allProducts.length} products, ${withImages} with images, ${allProducts.length - withImages} without\n`,
);

if (DRY_RUN) {
  console.log("=== DRY RUN COMPLETE — exiting without database changes ===");
  process.exit(0);
}

// ─── Step 3: Confirm & Insert ────────────────────────────────────────────────

const shouldInsert = await confirm(
  `STEP 3: Insert ${allProducts.length} products into the database?`,
);

if (!shouldInsert) {
  console.log("\nAborted — no changes made.");
  process.exit(0);
}

console.log(`\nInserting ${allProducts.length} products...\n`);

let insertedCount = 0;
let skippedCount = 0;

for (const product of allProducts) {
  try {
    const result = await _localDb
      .insert(products)
      .values(product)
      .onConflictDoNothing({ target: products.barcode })
      .returning({ id: products.id });

    if (result.length > 0) {
      insertedCount++;
    } else {
      skippedCount++;
      console.log(`  SKIP (barcode exists): ${product.name}`);
    }
  } catch (error) {
    // Handle name/sku uniqueness conflict not covered by onConflictDoNothing on barcode
    if (error instanceof Error && error.message.includes("unique")) {
      skippedCount++;
      console.log(`  SKIP (unique constraint): ${product.name}`);
      continue;
    }
    throw error;
  }
}

console.log(
  `\nDone! Inserted: ${insertedCount}, Skipped: ${skippedCount}, Total fetched: ${allProducts.length}`,
);

process.exit(0);
