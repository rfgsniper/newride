import { db, listingsTable } from "@workspace/db";
import { eq, and, notInArray } from "drizzle-orm";

const API_KEY = process.env.MARKETCHECK_API_KEY;

const DEFAULT_CITIES = [{ name: "London", zip: "EC1A 1BB" }];
const SINGLE_ZIP = process.env.MC_ZIP;
const RADIUS = process.env.MC_RADIUS || "150";
const MAKE = process.env.MC_MAKE;
const ROWS_PER_PAGE = 50;
const PAGES_PER_CITY = Number(process.env.MC_PAGES_PER_CITY || 50);

const cities = SINGLE_ZIP
  ? [{ name: "custom", zip: SINGLE_ZIP }]
  : DEFAULT_CITIES;

const VAN_BODY_TYPES = [
  "van",
  "panel van",
  "crew van",
  "combi van",
  "minibus",
  "chassis cab",
];
const VAN_MODELS = [
  "transit",
  "transit custom",
  "transit connect",
  "transit courier",
  "transporter",
  "caddy",
  "crafter",
  "sprinter",
  "vito",
  "citan",
  "vivaro",
  "combo",
  "movano",
  "berlingo",
  "dispatch",
  "relay",
  "jumpy",
  "jumper",
  "partner",
  "expert",
  "boxer",
  "trafic",
  "master",
  "kangoo",
  "ducato",
  "doblo",
  "talento",
  "fiorino",
  "scudo",
  "nv200",
  "nv300",
  "nv400",
  "primastar",
  "daily",
  "proace",
];

interface MarketCheckListing {
  id: string;
  vdp_url: string;
  price?: number;
  miles?: number;
  build: {
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    fuel_type?: string;
    body_type?: string;
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

function isVan(l: MarketCheckListing): boolean {
  const bodyType = l.build.body_type?.toLowerCase() || "";
  const model = l.build.model?.toLowerCase() || "";
  if (VAN_BODY_TYPES.some((v) => bodyType.includes(v))) return true;
  return VAN_MODELS.some((v) => model.includes(v));
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
  const data = (await res.json()) as { listings?: MarketCheckListing[] };
  return data.listings || [];
}

function normalize(l: MarketCheckListing) {
  const title =
    [l.build.year, l.build.make, l.build.model, l.build.trim]
      .filter(Boolean)
      .join(" ") || "Unknown vehicle";
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
    fuelType: l.build.fuel_type ?? null,
    bodyType: l.build.body_type ?? null,
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

export async function runIngestion() {
  if (!API_KEY) throw new Error("MARKETCHECK_API_KEY must be set");

  const seenIds = new Set<string>();
  const log: string[] = [];

  for (const city of cities) {
    log.push(`-- ${city.name} (${city.zip}) --`);
    let page = 0;
    while (page < PAGES_PER_CITY) {
      const listings = await fetchPage(city.zip, page * ROWS_PER_PAGE);
      if (listings.length === 0) break;

      for (const raw of listings) {
        if (isVan(raw)) continue;
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
              fuelType: normalized.fuelType,
              bodyType: normalized.bodyType,
              imageUrl: normalized.imageUrl,
              latitude: normalized.latitude,
              longitude: normalized.longitude,
              isActive: true,
              lastSeenAt: normalized.lastSeenAt,
            },
          });
      }

      log.push(`Page ${page}: ${listings.length} listings processed`);
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

  return { seen: seenIdsArray.length, log };
}
