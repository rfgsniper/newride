import { Router, type IRouter } from "express";
import { db, listingsTable, listingClicksTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { z } from "zod/v4";

const router: IRouter = Router();

const listingsQuerySchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  maxMileage: z.coerce.number().optional(),
});

// GET /listings?make=&model=&minPrice=&maxPrice=&maxMileage=
router.get("/listings", async (req, res) => {
  const parsed = listingsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { make, model, minPrice, maxPrice, maxMileage } = parsed.data;

  const conditions = [eq(listingsTable.isActive, true)];
  if (make) conditions.push(eq(listingsTable.make, make));
  if (model) conditions.push(eq(listingsTable.model, model));
  if (minPrice !== undefined) conditions.push(gte(listingsTable.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(listingsTable.price, maxPrice));
  if (maxMileage !== undefined) conditions.push(lte(listingsTable.mileage, maxMileage));

  const results = await db
    .select()
    .from(listingsTable)
    .where(and(...conditions))
    .orderBy(desc(listingsTable.lastSeenAt))
    .limit(100);

  res.json(results);
});

// GET /redirect/:id — logs the click, then redirects to the original listing
router.get("/redirect/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid listing id" });
    return;
  }

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));
  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  await db.insert(listingClicksTable).values({ listingId: id });
  res.redirect(302, listing.sourceUrl);
});

export default router;
