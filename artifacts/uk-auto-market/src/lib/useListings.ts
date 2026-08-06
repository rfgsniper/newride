import { useQuery } from "@tanstack/react-query";

export type ApiListing = {
  id: number;
  source: string;
  sourceId: string;
  dealerId: string | null;
  title: string;
  make: string;
  model: string;
  year: number | null;
  price: number | null;
  mileage: number | null;
  registration: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  sourceName: string | null;
  location: string | null;
  isActive: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type ListingFilters = {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  maxMileage?: number;
};

async function fetchListings(filters: ListingFilters): Promise<ApiListing[]> {
  const params = new URLSearchParams();
  if (filters.make) params.set("make", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.maxMileage) params.set("maxMileage", String(filters.maxMileage));

  const res = await fetch(`/api/listings?${params}`);
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json();
}

export function useListings(filters: ListingFilters) {
  return useQuery({
    queryKey: ["listings", filters],
    queryFn: () => fetchListings(filters),
  });
}

export function redirectUrl(listingId: number) {
  return `/api/redirect/${listingId}`;
}
