CREATE TABLE "agent_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"schedule" text NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agent_configs_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "agent_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_type" text NOT NULL,
	"status" text NOT NULL,
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"output" jsonb,
	"logs" jsonb,
	"editor_review" jsonb,
	"designer_output" jsonb,
	"marketer_output" jsonb
);
--> statement-breakpoint
CREATE TABLE "cron_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp,
	"status" text NOT NULL,
	"jobs_triggered" integer DEFAULT 0,
	"error_message" text,
	"duration" integer
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
