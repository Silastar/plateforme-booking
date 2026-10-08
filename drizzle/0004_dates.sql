CREATE TABLE "application" (
	"id" text PRIMARY KEY NOT NULL,
	"gig_id" text NOT NULL,
	"band_id" text NOT NULL,
	"user_id" text,
	"message" text,
	"fee" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"venue_id" text,
	"day" date NOT NULL,
	"load_in" text,
	"set_start" text,
	"curfew" text,
	"series_id" text,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"format" text NOT NULL,
	"bands_count" integer DEFAULT 1 NOT NULL,
	"set_length" integer,
	"budget_min" integer,
	"budget_max" integer,
	"includes" text[] DEFAULT '{}' NOT NULL,
	"visibility" text DEFAULT 'open' NOT NULL,
	"note" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_gig_id_gig_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gig"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_band_id_band_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."band"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig" ADD CONSTRAINT "gig_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig" ADD CONSTRAINT "gig_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_gig_band" ON "application" USING btree ("gig_id","band_id");--> statement-breakpoint
CREATE INDEX "application_band_idx" ON "application" USING btree ("band_id");--> statement-breakpoint
CREATE INDEX "gig_org_idx" ON "gig" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "gig_day_idx" ON "gig" USING btree ("day");