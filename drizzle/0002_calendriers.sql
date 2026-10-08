CREATE TABLE "tour" (
	"id" text PRIMARY KEY NOT NULL,
	"band_id" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"region" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unavailability" (
	"id" text PRIMARY KEY NOT NULL,
	"band_id" text,
	"user_id" text,
	"day" date NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tour" ADD CONSTRAINT "tour_band_id_band_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."band"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unavailability" ADD CONSTRAINT "unavailability_band_id_band_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."band"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unavailability" ADD CONSTRAINT "unavailability_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tour_band_idx" ON "tour" USING btree ("band_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unavailability_band_day" ON "unavailability" USING btree ("band_id","day") WHERE band_id is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "unavailability_user_day" ON "unavailability" USING btree ("user_id","day") WHERE user_id is not null;