CREATE TABLE "band_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"band_id" text NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Le calendrier du groupe part maintenant vierge : les anciens jours « indispo » du groupe ne veulent plus rien dire.
DELETE FROM "unavailability" WHERE "band_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "unavailability" DROP CONSTRAINT "unavailability_band_id_band_id_fk";
--> statement-breakpoint
DROP INDEX "unavailability_band_day";--> statement-breakpoint
DROP INDEX "unavailability_user_day";--> statement-breakpoint
ALTER TABLE "unavailability" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "band_availability" ADD CONSTRAINT "band_availability_band_id_band_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."band"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "band_availability_band_day" ON "band_availability" USING btree ("band_id","day");--> statement-breakpoint
CREATE UNIQUE INDEX "unavailability_user_day" ON "unavailability" USING btree ("user_id","day");--> statement-breakpoint
ALTER TABLE "unavailability" DROP COLUMN "band_id";