CREATE TABLE "venue" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"postal_code" text,
	"city" text NOT NULL,
	"capacity" integer,
	"indoor" boolean DEFAULT true NOT NULL,
	"stage_size" text,
	"pa_provided" boolean DEFAULT false NOT NULL,
	"lights_provided" boolean DEFAULT false NOT NULL,
	"engineer_on_site" boolean DEFAULT false NOT NULL,
	"backline" text,
	"green_room" boolean DEFAULT false NOT NULL,
	"catering" boolean DEFAULT false NOT NULL,
	"load_in" text,
	"curfew" text,
	"photo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "band_member" DROP CONSTRAINT "band_member_band_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "band_member" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "genres" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "photo" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "since" integer;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "repertoire" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "set_min" integer;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "set_max" integer;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "story" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "discography" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "press" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "spotify_url" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "bandcamp_url" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "soundcloud_url" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "youtube_url" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "rider" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "lineup_detail" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "backline" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "own_engineer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "setup_minutes" integer;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "min_stage" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "radius_km" integer;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "regions" text;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "fee_min" integer;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "fee_max" integer;--> statement-breakpoint
ALTER TABLE "band" ADD COLUMN "fee_note" text;--> statement-breakpoint
ALTER TABLE "band_member" ADD COLUMN "id" text;--> statement-breakpoint
UPDATE "band_member" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;--> statement-breakpoint
ALTER TABLE "band_member" ALTER COLUMN "id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "band_member" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "band_member" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "band_member" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "band_member" ADD COLUMN "invite_email" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "styles" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "photo" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "video_url_2" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "sub_instruments" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "sub_radius_km" integer;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "sub_notice_days" integer;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "repertoire_note" text;--> statement-breakpoint
ALTER TABLE "musician" ADD COLUMN "gear_note" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "cover" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "since" integer;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "genres" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "event_types" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "bands_per_night" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "set_length" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "rhythm" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "budget_min" integer;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "budget_max" integer;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "fee_terms" text;--> statement-breakpoint
ALTER TABLE "venue" ADD CONSTRAINT "venue_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "band" ADD CONSTRAINT "band_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "musician" ADD CONSTRAINT "musician_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_slug_unique" UNIQUE("slug");--> statement-breakpoint
UPDATE "band" SET "slug" = trim(both '-' from lower(regexp_replace(translate("name", 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸ', 'aaaaaaceeeeiiiinooooouuuuyyoaAAAAAACEEEEIIIINOOOOOUUUUYY'), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(md5(random()::text), 1, 4) WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "organization" SET "slug" = trim(both '-' from lower(regexp_replace(translate("name", 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸ', 'aaaaaaceeeeiiiinooooouuuuyyoaAAAAAACEEEEIIIINOOOOOUUUUYY'), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(md5(random()::text), 1, 4) WHERE "slug" IS NULL;--> statement-breakpoint
UPDATE "musician" SET "slug" = trim(both '-' from lower(regexp_replace(translate("stage_name", 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸ', 'aaaaaaceeeeiiiinooooouuuuyyoaAAAAAACEEEEIIIINOOOOOUUUUYY'), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || substr(md5(random()::text), 1, 4) WHERE "slug" IS NULL;
