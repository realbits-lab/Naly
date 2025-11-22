CREATE TABLE "cron_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" text NOT NULL,
	"jobs_triggered" integer DEFAULT 0,
	"error_message" text,
	"duration" integer
);
