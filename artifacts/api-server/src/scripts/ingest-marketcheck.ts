import { db, listingsTable } from "@workspace/db";
import { eq, and, notInArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

const API_KEY = process.env.MARKETCHECK_API_KEY;
if (!API_KEY) {
  throw new Error("MARKETCHECK_API_KEY must be set");
}

// Configurable via env, sensible UK-wide defaults
const ZIP = process.env.MC_ZIP || "SW1A1AA";
const RADIUS = process.env.MC_RADIUS || "100";
const MAKE = process.env.MC_MAKE; // optional filter
const ROWS_PER_PAGE = 50;
const MAX_PAGES = 10; // cap to control API usage/cost

interface MarketCheckListing {
  id: string;
  vdp_url: string;
  price?: number;
  miles?: number;
  build: { year?: number; make?: string; model?: string };
  media?: { photo_links?: string[] };
  dealer?: { name?: string; city?: string; state?: string };
  vin?: string;
}

async function fetchPage(start: number): Promise<MarketCheckListing[]> {
  const params = new URLSearchParams({
    api_key: API_KEY!,
    zip: ZIP,
    radius: RADIUS,
    rows: String(ROWS_PER_PAGE),
    start: String(start),
  });
  if (MAKE) params.set("make", MAKE);

  const res = await fetch(
    `https://api.marketcheck.com/v2/search/car/uk/active?${params}`,
  );
  if (!res.ok) {
    throw new Error(`MarketCheck API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.listings || [];
}

function normalize(l: MarketCheckListing) {
  const title =
    [l.build.year, l.build.make, l.build.model].filter(Boolean).join(" ") ||
    "Unknown vehicle";
  return {
    source: "marketcheck",
    sourceId: l.id,
    title,
    make: l.build.make || "Unknown",
    model: l.build.model || "Unknown",
    year: l.build.year ?? null,
    price: l.price ?? null,
    mileage: l.miles ?? null,
    registration: l.vin ?? null,
    imageUrl: l.media?.photo_links?.[0] ?? null,
    sourceUrl: l.vdp_url,
    sourceName: l.dealer?.name ?? "Dealer",
    location:
      [l.dealer?.city, l.dealer?.state].filter(Boolean).join(", ") || null,
    isActive: true,
    lastSeenAt: new Date(),
  };
}

async function run() {
  console.log(
    `Starting MarketCheck ingestion (zip=${ZIP}, radius=${RADIUS}mi${MAKE ? `, make=${MAKE}` : ""})`,
  );
  const seenIds: string[] = [];
  let page = 0;

  while (page < MAX_PAGES) {
    const listings = await fetchPage(page * ROWS_PER_PAGE);
    if (listings.length === 0) break;

    for (const raw of listings) {
      const normalized = normalize(raw);
      seenIds.push(normalized.sourceId);

      await db
        .insert(listingsTable)
        .values(normalized)
        .onConflictDoUpdate({
          target: [listingsTable.source, listingsTable.sourceId],
          set: {
            price: normalized.price,
            mileage: normalized.mileage,
            imageUrl: normalized.imageUrl,
            isActive: true,
            lastSeenAt: normalized.lastSeenAt,
          },
        });
    }

    console.log(`Page ${page}: ${listings.length} listings processed`);
    page++;
    if (listings.length < ROWS_PER_PAGE) break; // last page
  }

  // Mark anything from this source not seen this run as inactive (sold/removed)
  if (seenIds.length > 0) {
    const result = await db
      .update(listingsTable)
      .set({ isActive: false })
      .where(
        and(
          eq(listingsTable.source, "marketcheck"),
          notInArray(listingsTable.sourceId, seenIds),
        ),
      );
    console.log(`Marked stale listings inactive`);
  }

  console.log(`Done. ${seenIds.length} listings seen this run.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
