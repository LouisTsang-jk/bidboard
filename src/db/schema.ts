import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const listings = pgTable(
  "listing",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    canonicalUrl: text("canonical_url").notNull(),
    canonicalUrlHash: varchar("canonical_url_hash", { length: 64 })
      .notNull()
      .unique(),
    title: varchar("title", { length: 80 }).notNull(),
    description: varchar("description", { length: 240 }).notNull(),
    imageUrl: text("image_url"),
    status: varchar("status", { length: 16 }).notNull().default("PENDING"),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    totalAmountMinor: bigint("total_amount_minor", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
    clickCount: bigint("click_count", { mode: "bigint" }).notNull().default(sql`0`),
    firstPaidAt: timestamp("first_paid_at", { withTimezone: true }),
    lastPaidAt: timestamp("last_paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("listing_rank_idx").on(
      table.status,
      table.totalAmountMinor,
      table.firstPaidAt,
      table.id,
    ),
    uniqueIndex("listing_canonical_url_hash_idx").on(table.canonicalUrlHash),
  ],
);

export const checkoutIntents = pgTable(
  "checkout_intent",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),
    idempotencyKey: varchar("idempotency_key", { length: 80 }).notNull().unique(),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("usd"),
    proposedTitle: varchar("proposed_title", { length: 80 }).notNull(),
    proposedDescription: varchar("proposed_description", { length: 240 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("PENDING"),
    stripeCheckoutSessionId: varchar("stripe_checkout_session_id", {
      length: 255,
    }).unique(),
    stripeCheckoutUrl: text("stripe_checkout_url"),
    requesterFingerprintHash: varchar("requester_fingerprint_hash", {
      length: 64,
    }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("checkout_intent_expiry_idx").on(table.status, table.expiresAt),
  ],
);

export const payments = pgTable("payment", {
  id: uuid("id").defaultRandom().primaryKey(),
  intentId: uuid("intent_id")
    .notNull()
    .unique()
    .references(() => checkoutIntents.id),
  checkoutSessionId: varchar("checkout_session_id", { length: 255 })
    .notNull()
    .unique(),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }).unique(),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: varchar("status", { length: 16 }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const contributions = pgTable(
  "contribution",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),
    paymentId: uuid("payment_id")
      .notNull()
      .unique()
      .references(() => payments.id),
    amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
    runningTotalMinor: bigint("running_total_minor", { mode: "bigint" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("contribution_listing_time_idx").on(table.listingId, table.createdAt)],
);

export const stripeEvents = pgTable("stripe_event", {
  eventId: varchar("event_id", { length: 255 }).primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  errorCode: varchar("error_code", { length: 80 }),
});

export const outbox = pgTable(
  "outbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    topic: varchar("topic", { length: 80 }).notNull(),
    aggregateId: uuid("aggregate_id").notNull(),
    payload: jsonb("payload").$type<Record<string, string>>().notNull(),
    availableAt: timestamp("available_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    attempts: bigint("attempts", { mode: "number" }).notNull().default(0),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("outbox_pending_idx").on(table.processedAt, table.availableAt)],
);

export const listingDailyMetrics = pgTable(
  "listing_daily_metric",
  {
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),
    metricDate: varchar("metric_date", { length: 10 }).notNull(),
    clicks: bigint("clicks", { mode: "bigint" }).notNull().default(sql`0`),
    uniqueClicksEstimate: bigint("unique_clicks_estimate", { mode: "bigint" })
      .notNull()
      .default(sql`0`),
  },
  (table) => [uniqueIndex("listing_daily_metric_pk").on(table.listingId, table.metricDate)],
);
