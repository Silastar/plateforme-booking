CREATE TABLE "geocode_cache" (
	"query" text PRIMARY KEY NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "venue" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "venue" ADD COLUMN "lng" double precision;