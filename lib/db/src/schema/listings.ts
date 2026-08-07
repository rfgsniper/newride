import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
  doublePrecision,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable(
  "listings",
  {
    id: serial("id").primaryKey(),
    source: text("source").notNull(),
    sourceId: text("source_id").notNull(),
    dealerId: text("dealer_id"),

    title: text("title").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    year: integer("year"),
    price: doublePrecision("price"),
    mileage: integer("mileage"),
    registration: text("registration"),
    horsepower: integer("horsepower"),

    imageUrl: text("image_url"),
    sourceUrl: text("source_url").notNull(),
    sourceName: text("source_name"),
    location: text("location"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),

    isActive: boolean("is_active").notNull().default(true),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (table) => ({
    sourceUnique: uniqueIndex("listings_source_source_id_idx").on(
      table.source,
      table.sourceId,
    ),
  }),
);

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
});
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;

export const listingClicksTable = pgTable("listing_clicks", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
});

export const insertListingClickSchema = createInsertSchema(
  listingClicksTable,
).omit({ id: true });
export type InsertListingClick = z.infer<typeof insertListingClickSchema>;
