/**
 * Usage:
 *   node scripts/insert-recipe.mjs scripts/recipes/my-recipe.json
 *
 * The JSON file must follow the RecipeInput schema defined below.
 * Ingredients are looked up by name (case-insensitive). If an ingredient is
 * not found in the DB, the script exits with an error so you can add it first.
 *
 * RecipeInput shape:
 * {
 *   "title": "Chicken & Rice Bowl",
 *   "slug": "chicken-rice-bowl",          // URL-friendly, must be unique
 *   "description": "...",                  // optional
 *   "imageUrl": "https://...",             // optional
 *   "tags": ["high-protein", "meal-prep"], // optional
 *   "servings": 5,
 *   "servingUnit": "container",            // optional, defaults to "serving"
 *   "status": "published",                 // "draft" | "published" | "archived"
 *   "mealPrep": {                          // optional
 *     "fridgeDays": 5,
 *     "freezerDays": 90,
 *     "reheatNotes": "Microwave 2 min"
 *   },
 *   "ingredients": [
 *     {
 *       "name": "Chicken breast",          // matched against Ingredients.name (case-insensitive)
 *       "quantity": 500,
 *       "unit": "g",                       // g | ml | tbsp | tsp | cup | piece | "to taste"
 *       "grams": 500,                      // optional: gram-equivalent for macro calc
 *       "note": "raw weight"               // optional
 *     }
 *   ],
 *   "instructions": [
 *     {
 *       "section": "Cook the rice",
 *       "steps": [
 *         "Rinse rice under cold water.",
 *         "Cook in rice cooker with 1:1.5 ratio."
 *       ],
 *       "timing": {                        // optional
 *         "activeMin": 5,
 *         "minutes": 20
 *       }
 *     }
 *   ]
 * }
 */

import { MongoClient, ObjectId } from "mongodb";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local ───────────────────────────────────────────────────────────
const envPath = resolve(__dirname, "../.env.local");
const envVars = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const uri = envVars.MONGODB_URI;
const dbName = envVars.MONGODB_DB || "Data";

if (!uri) {
  console.error("❌  MONGODB_URI not found in .env.local");
  process.exit(1);
}

// ── Load recipe JSON ──────────────────────────────────────────────────────────
const jsonArg = process.argv[2];
if (!jsonArg) {
  console.error("❌  Provide a path to the recipe JSON file:");
  console.error("    node scripts/insert-recipe.mjs scripts/recipes/my-recipe.json");
  process.exit(1);
}

const jsonPath = resolve(process.cwd(), jsonArg);
let input;
try {
  input = JSON.parse(readFileSync(jsonPath, "utf-8"));
} catch (err) {
  console.error(`❌  Failed to parse JSON: ${err.message}`);
  process.exit(1);
}

// ── Basic validation ──────────────────────────────────────────────────────────
const required = ["title", "slug", "servings", "status", "ingredients", "instructions"];
for (const field of required) {
  if (input[field] == null) {
    console.error(`❌  Missing required field: "${field}"`);
    process.exit(1);
  }
}

// ── Connect & insert ──────────────────────────────────────────────────────────
const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

// Check for duplicate slug
const existing = await db.collection("Recipes").findOne({ slug: input.slug });
if (existing) {
  console.error(`❌  A recipe with slug "${input.slug}" already exists (_id: ${existing._id}).`);
  await client.close();
  process.exit(1);
}

// Resolve ingredient names → ObjectIds
const resolvedIngredients = [];
for (const line of input.ingredients) {
  if (!line.name) {
    console.error(`❌  Each ingredient must have a "name" field.`);
    await client.close();
    process.exit(1);
  }

  const ing = await db.collection("Ingredients").findOne({
    name: { $regex: new RegExp(`^${escapeRegex(line.name)}$`, "i") },
  });

  if (!ing) {
    console.error(`❌  Ingredient not found in DB: "${line.name}"`);
    console.error(`    Add it to the Ingredients collection first, then re-run.`);
    await client.close();
    process.exit(1);
  }

  resolvedIngredients.push({
    ingredientId: ing._id,
    quantity: line.quantity ?? null,
    unit: line.unit,
    ...(line.grams != null && { grams: line.grams }),
    ...(line.note != null && { note: line.note }),
  });
}

// Build document
const now = new Date();
const doc = {
  _id: new ObjectId(),
  title: input.title,
  slug: input.slug,
  ...(input.description != null && { description: input.description }),
  ...(input.imageUrl != null && { imageUrl: input.imageUrl }),
  ...(input.tags != null && { tags: input.tags }),
  servings: input.servings,
  ...(input.servingUnit != null && { servingUnit: input.servingUnit }),
  ingredients: resolvedIngredients,
  instructions: input.instructions,
  ...(input.mealPrep != null && { mealPrep: input.mealPrep }),
  status: input.status,
  createdAt: now,
  updatedAt: now,
};

const result = await db.collection("Recipes").insertOne(doc);
console.log(`✅  Recipe inserted: "${input.title}"`);
console.log(`    _id:  ${result.insertedId}`);
console.log(`    slug: ${input.slug}`);

await client.close();

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
