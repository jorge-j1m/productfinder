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
import { _localDb } from "../db";
import { products, stockType } from "../entities/products/schema";

const DRY_RUN = process.argv.includes("--dry-run");

const USER_AGENT =
  "ProductFinder Seed Script/1.0 (https://github.com/productfinder)";
const API_BASE = "https://world.openfoodfacts.org/api/v2/search";
const PAGE_SIZE = 15;
const DELAY_MS = 500;

type StockType = (typeof stockType.enumValues)[number];

interface Category {
  name: string;
  stockType: StockType;
}

const CATEGORIES: Category[] = [
  { name: "Milk", stockType: "UNITS" },
  { name: "Pasta", stockType: "UNITS" },
  { name: "Chocolate", stockType: "UNITS" },
  { name: "Sodas", stockType: "UNITS" },
  { name: "Breakfast cereals", stockType: "UNITS" },
  { name: "Canned foods", stockType: "UNITS" },
  { name: "Fruits", stockType: "WEIGHT" },
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
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SKU-${timestamp}-${random}`;
}

async function fetchCategory(category: Category): Promise<SeedProduct[]> {
  const params = new URLSearchParams({
    categories_tags_en: category.name,
    fields: "code,product_name,image_front_small_url",
    page_size: String(PAGE_SIZE),
    sort_by: "unique_scans_n",
  });

  const res = await fetch(`${API_BASE}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    console.warn(
      `  WARNING: Failed to fetch "${category.name}": ${res.status}`,
    );
    return [];
  }

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
