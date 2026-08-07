import { db, listingsTable } from "@workspace/db";
import { eq, and, notInArray } from "drizzle-orm";

const API_KEY = process.env.MARKETCHECK_API_KEY;
if (!API_KEY) {
  throw new Error("MARKETCHECK_API_KEY must be set");
}

// Major UK cities, used as ingestion hubs for denser geographic coverage.
// Override entirely with MC_ZIP (single postcode) for a targeted run instead.
const DEFAULT_CITIES = [
  { name: "London", zip: "EC1A 1BB" },
  { name: "Birmingham", zip: "B1 1AA" },
  { name: "Manchester", zip: "M1 1AE" },
  { name: "Leeds", zip: "LS1 1BA" },
  { name: "Glasgow", zip: "G1 1AA" },
  { name: "Liverpool", zip: "L1 1AA" },
  { name: "Bristol", zip: "BS1 1AA" },
  { name: "Edinburgh", zip: "EH1 1BB" },
  { name: "Sheffield", zip: "S1 1AA" },
  { name: "Newcastle", zip: "NE1 1AA" },
  { name: "Cardiff", zip: "CF10 1AA" },
];

const SINGLE_ZIP = process.env.MC_ZIP; // optional single-city override
const RADIUS = process.env.MC_RADIUS || "30"; // miles per city
const MAKE = process.env.MC_MAKE; // optional filter
const ROWS_PER_PAGE = 50;
const PAGES_PER_CITY = Number(process.env.MC_PAGES_PER_CITY || 3); // 3 pages = up to 150/city

const cities = SINGLE_ZIP
  ? [{ name: "custom", zip: SINGLE_ZIP }]
  : DEFAULT_CITIES;

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

async function fetchPage(
  zip: string,
  start: number,
): Promise<MarketCheckListing[]> {
  const params = new URLSearchParams({
    api_key: API_KEY!,
    rows: String(ROWS_PER_PAGE),
    start: String(start),
    has_price: "true",
    postal_code: zip,
    radius: RADIUS,
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
    `Starting MarketCheck ingestion across ${cities.length} location(s), radius=${RADIUS}mi${MAKE ? `, make=${MAKE}` : ""}`,
  );
  const seenIds = new Set<string>();

  for (const city of cities) {
    console.log(`\n-- ${city.name} (${city.zip}) --`);
    let page = 0;
    while (page < PAGES_PER_CITY) {
      const listings = await fetchPage(city.zip, page * ROWS_PER_PAGE);
      if (listings.length === 0) break;

      for (const raw of listings) {
        const normalized = normalize(raw);
        seenIds.add(normalized.sourceId);

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

      console.log(`  Page ${page}: ${listings.length} listings processed`);
      page++;
      if (listings.length < ROWS_PER_PAGE) break;
    }
  }

  const seenIdsArray = Array.from(seenIds);
  if (seenIdsArray.length > 0) {
    await db
      .update(listingsTable)
      .set({ isActive: false })
      .where(
        and(
          eq(listingsTable.source, "marketcheck"),
          notInArray(listingsTable.sourceId, seenIdsArray),
        ),
      );
  }

  console.log(`\nDone. ${seenIdsArray.length} unique listings seen this run.`);
  process.exit(0);
}

run().catch((err) => {
  console.error("Ingestion failed:", err);
  process.exit(1);
});
