import { Router, type IRouter } from "express";
import { db, listingsTable, listingClicksTable } from "@workspace/db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

const router: IRouter = Router();

// GET /listings?make=&model=&minPrice=&maxPrice=&maxMileage=
router.get("/listings", async (req, res) => {
  const { make, model, minPrice, maxPrice, maxMileage } = req.query;

  const conditions = [eq(listingsTable.isActive, true)];
  if (make) conditions.push(eq(listingsTable.make, String(make)));
  if (model) conditions.push(eq(listingsTable.model, String(model)));
  if (minPrice) conditions.push(gte(listingsTable.price, Number(minPrice)));
  if (maxPrice) conditions.push(lte(listingsTable.price, Number(maxPrice)));
  if (maxMileage) conditions.push(lte(listingsTable.mileage, Number(maxMileage)));

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
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id));

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  await db.insert(listingClicksTable).values({ listingId: id });
  res.redirect(302, listing.sourceUrl);
});

export default router;
