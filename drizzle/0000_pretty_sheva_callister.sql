CREATE TABLE "checkout_intent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"idempotency_key" varchar(80) NOT NULL,
	"amount_minor" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"proposed_title" varchar(80) NOT NULL,
	"proposed_description" varchar(240) NOT NULL,
	"status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"stripe_checkout_session_id" varchar(255),
	"stripe_checkout_url" text,
	"requester_fingerprint_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_intent_idempotency_key_unique" UNIQUE("idempotency_key"),
	CONSTRAINT "checkout_intent_stripe_checkout_session_id_unique" UNIQUE("stripe_checkout_session_id")
);
--> statement-breakpoint
CREATE TABLE "contribution" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount_minor" bigint NOT NULL,
	"running_total_minor" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contribution_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "listing_daily_metric" (
	"listing_id" uuid NOT NULL,
	"metric_date" varchar(10) NOT NULL,
	"clicks" bigint DEFAULT 0 NOT NULL,
	"unique_clicks_estimate" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(120) NOT NULL,
	"canonical_url" text NOT NULL,
	"canonical_url_hash" varchar(64) NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" varchar(240) NOT NULL,
	"image_url" text,
	"status" varchar(16) DEFAULT 'PENDING' NOT NULL,
	"currency" varchar(3) DEFAULT 'usd' NOT NULL,
	"total_amount_minor" bigint DEFAULT 0 NOT NULL,
	"click_count" bigint DEFAULT 0 NOT NULL,
	"first_paid_at" timestamp with time zone,
	"last_paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "listing_slug_unique" UNIQUE("slug"),
	CONSTRAINT "listing_canonical_url_hash_unique" UNIQUE("canonical_url_hash")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic" varchar(80) NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" bigint DEFAULT 0 NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intent_id" uuid NOT NULL,
	"checkout_session_id" varchar(255) NOT NULL,
	"payment_intent_id" varchar(255),
	"amount_minor" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" varchar(16) NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_intent_id_unique" UNIQUE("intent_id"),
	CONSTRAINT "payment_checkout_session_id_unique" UNIQUE("checkout_session_id"),
	CONSTRAINT "payment_payment_intent_id_unique" UNIQUE("payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_event" (
	"event_id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error_code" varchar(80)
);
--> statement-breakpoint
ALTER TABLE "checkout_intent" ADD CONSTRAINT "checkout_intent_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contribution" ADD CONSTRAINT "contribution_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_daily_metric" ADD CONSTRAINT "listing_daily_metric_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_intent_id_checkout_intent_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."checkout_intent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checkout_intent_expiry_idx" ON "checkout_intent" USING btree ("status","expires_at");--> statement-breakpoint
CREATE INDEX "contribution_listing_time_idx" ON "contribution" USING btree ("listing_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_daily_metric_pk" ON "listing_daily_metric" USING btree ("listing_id","metric_date");--> statement-breakpoint
CREATE INDEX "listing_rank_idx" ON "listing" USING btree ("status","total_amount_minor","first_paid_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "listing_canonical_url_hash_idx" ON "listing" USING btree ("canonical_url_hash");--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "outbox" USING btree ("processed_at","available_at");