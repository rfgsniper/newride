import { db, listingsTable } from "@workspace/db";
import { eq, and, notInArray } from "drizzle-orm";

const API_KEY = process.env.MARKETCHECK_API_KEY;
if (!API_KEY) {
  throw new Error("MARKETCHECK_API_KEY must be set");
}

// No zip/radius by default = nationwide UK coverage instead of one arbitrary point.
// Override with env vars if you want to target a specific area instead.
const ZIP = process.env.MC_ZIP; // optional
const RADIUS = process.env.MC_RADIUS; // optional, only used if ZIP is set
const MAKE = process.env.MC_MAKE; // optional filter
const ROWS_PER_PAGE = 50;
const MAX_PAGES = Number(process.env.MC_MAX_PAGES || 20); // 20 pages = up to 1000 listings per run

interface MarketCheckListing {
  id: string;
  vdp_url: string;
  price?: number;
  miles?: number;
  build: {
    year?: number;
    make?: string;
    model?: string;
    performance_power_bhp?: number;
  };
  media?: { photo_links?: string[] };
  dealer?: {
    name?: string;
    city?: string;
    county?: string;
    latitude?: string;
    longitude?: string;
  };
  vehicle_registration_mark?: string;
}

async function fetchPage(start: number): Promise<MarketCheckListing[]> {
  const params = new URLSearchParams({
    api_key: API_KEY!,
    rows: String(ROWS_PER_PAGE),
    start: String(start),
    has_price: "true",
  });
  if (ZIP) params.set("postal_code", ZIP);
  if (ZIP && RADIUS) params.set("radius", RADIUS);
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
  const lat = l.dealer?.latitude ? Number(l.dealer.latitude) : null;
  const lng = l.dealer?.longitude ? Number(l.dealer.longitude) : null;

  return {
    source: "marketcheck",
    sourceId: l.id,
    title,
    make: l.build.make || "Unknown",
    model: l.build.model || "Unknown",
    year: l.build.year ?? null,
    price: l.price ?? null,
    mileage: l.miles ?? null,
    registration: l.vehicle_registration_mark ?? null,
    horsepower: l.build.performance_power_bhp ?? null,
    imageUrl: l.media?.photo_links?.[0] ?? null,
    sourceUrl: l.vdp_url,
    sourceName: l.dealer?.name ?? "Dealer",
    location:
      [l.dealer?.city, l.dealer?.county].filter(Boolean).join(", ") || null,
    latitude: lat,
    longitude: lng,
    isActive: true,
    lastSeenAt: new Date(),
  };
}

async function run() {
  console.log(
    `Starting MarketCheck ingestion${ZIP ? ` (zip=${ZIP}, radius=${RADIUS || "default"}mi)` : " (nationwide)"}${MAKE ? `, make=${MAKE}` : ""}`,
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
            horsepower: normalized.horsepower,
            imageUrl: normalized.imageUrl,
            latitude: normalized.latitude,
            longitude: normalized.longitude,
            isActive: true,
            lastSeenAt: normalized.lastSeenAt,
          },
        });
    }

    console.log(`Page ${page}: ${listings.length} listings processed`);
    page++;
    if (listings.length < ROWS_PER_PAGE) break;
  }

  if (seenIds.length > 0) {
    await db
      .update(listingsTable)
      .set({ isActive: false })
      .where(
        and(
          eq(listingsTable.source, "marketcheck"),
          notInArray(listingsTable.sourceId, seenIds),
        ),
      );
  }

  console.log(`Done. ${seenIds.length} listings seen this run.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
