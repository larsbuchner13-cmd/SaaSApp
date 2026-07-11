CREATE TABLE "rate_limit_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"action" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rate_limit_counters" ADD CONSTRAINT "rate_limit_counters_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_counters_company_action_window_idx" ON "rate_limit_counters" USING btree ("company_id","action","window_start");--> statement-breakpoint
CREATE INDEX "rate_limit_counters_window_start_idx" ON "rate_limit_counters" USING btree ("window_start");