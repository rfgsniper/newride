import { Router, type IRouter } from "express";
import { db, listingsTable, listingClicksTable } from "@workspace/db";
import {
  eq,
  and,
  gte,
  lte,
  desc,
  ilike,
  sql,
  getTableColumns,
} from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

const listingsQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  maxMileage: z.coerce.number().optional(),
  postcode: z.string().optional(),
  maxDistance: z.coerce.number().optional(), // miles, only used with postcode
  sortBy: z
    .enum([
      "price-asc",
      "price-desc",
      "mileage-asc",
      "mileage-desc",
      "recommended",
    ])
    .optional(),
});

async function geocodePostcode(
  postcode: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.result) return null;
    return { lat: data.result.latitude, lng: data.result.longitude };
  } catch {
    return null;
  }
}

// GET /listings?make=&model=&minPrice=&maxPrice=&maxMileage=&postcode=&maxDistance=
router.get("/listings", async (req, res) => {
  const parsed = listingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { make, model, minPrice, maxPrice, maxMileage, postcode, maxDistance } =
    parsed.data;

  const conditions = [eq(listingsTable.isActive, true)];
  if (make) conditions.push(ilike(listingsTable.make, `%${make}%`));
  if (model) conditions.push(ilike(listingsTable.model, `%${model}%`));
  if (minPrice !== undefined)
    conditions.push(gte(listingsTable.price, minPrice));
  if (maxPrice !== undefined)
    conditions.push(lte(listingsTable.price, maxPrice));
  if (maxMileage !== undefined)
    conditions.push(lte(listingsTable.mileage, maxMileage));

  let originLat: number | null = null;
  let originLng: number | null = null;
  if (postcode) {
    const geo = await geocodePostcode(postcode);
    if (geo) {
      originLat = geo.lat;
      originLng = geo.lng;
    }
  }

  // Haversine distance in miles, computed in SQL when we have an origin point
  const distanceExpr =
    originLat !== null && originLng !== null
      ? sql<number>`3959 * acos(
        cos(radians(${originLat})) * cos(radians(${listingsTable.latitude})) *
        cos(radians(${listingsTable.longitude}) - radians(${originLng})) +
        sin(radians(${originLat})) * sin(radians(${listingsTable.latitude}))
      )`
      : null;

  if (distanceExpr && maxDistance !== undefined) {
    conditions.push(
      sql`${listingsTable.latitude} IS NOT NULL AND ${distanceExpr} <= ${maxDistance}`,
    );
  }

  const baseQuery = db
  .select({
    ...getTableColumns(listingsTable),
    ...(distanceExpr ? { distance: distanceExpr } : {}),
  })
  .from(listingsTable)
  .where(and(...conditions));

  const results = distanceExpr
    ? await baseQuery.orderBy(sql`${distanceExpr} ASC NULLS LAST`).limit(100)
    : await baseQuery.orderBy(desc(listingsTable.lastSeenAt)).limit(100);

  res.json(results);
});

// GET /redirect/:id
router.get("/redirect/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid listing id" });
    return;
  }

  const [listing] = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.id, id));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  await db.insert(listingClicksTable).values({ listingId: id });
  res.redirect(302, listing.sourceUrl);
});

export default router;
