CREATE TABLE "custom_object" (
	"id" text PRIMARY KEY NOT NULL,
	"band_id" text,
	"user_id" text,
	"name" text NOT NULL,
	"inputs" text[] DEFAULT '{}' NOT NULL,
	"mic" text,
	"stand" text,
	"monitor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "musician_gear" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"object_key" text NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"mic" text,
	"note" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rider" (
	"id" text PRIMARY KEY NOT NULL,
	"band_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"engineer" text,
	"setup_minutes" integer,
	"soundcheck_minutes" integer,
	"changeover_minutes" integer,
	"min_stage" text,
	"people" integer,
	"meals" text,
	"green_room" text,
	"drinks" text,
	"parking" text,
	"lodging" text,
	"iem_note" text,
	"monitor_notes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"patch_order" text[] DEFAULT '{}' NOT NULL,
	"plot" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rider_item" (
	"id" text PRIMARY KEY NOT NULL,
	"rider_id" text NOT NULL,
	"member_id" text,
	"object_key" text NOT NULL,
	"provider" text DEFAULT 'band' NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"mic" text,
	"note" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application" ADD COLUMN "rider_id" text;--> statement-breakpoint
ALTER TABLE "venue" ADD COLUMN "gear" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_object" ADD CONSTRAINT "custom_object_band_id_band_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."band"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_object" ADD CONSTRAINT "custom_object_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "musician_gear" ADD CONSTRAINT "musician_gear_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider" ADD CONSTRAINT "rider_band_id_band_id_fk" FOREIGN KEY ("band_id") REFERENCES "public"."band"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_item" ADD CONSTRAINT "rider_item_rider_id_rider_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rider_item" ADD CONSTRAINT "rider_item_member_id_band_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."band_member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "musician_gear_user_idx" ON "musician_gear" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rider_band_idx" ON "rider" USING btree ("band_id");--> statement-breakpoint
CREATE INDEX "rider_item_rider_idx" ON "rider_item" USING btree ("rider_id");--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_rider_id_rider_id_fk" FOREIGN KEY ("rider_id") REFERENCES "public"."rider"("id") ON DELETE set null ON UPDATE no action;