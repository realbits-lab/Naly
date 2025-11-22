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
	"reporter_id" integer,
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
CREATE TABLE "ai_reporters" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"personality" text NOT NULL,
	"memory" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"avatar" text,
	"specialty" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" integer NOT NULL,
	"reporter_id" integer NOT NULL,
	"content" text NOT NULL,
	"parent_reply_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "agent_runs" ADD CONSTRAINT "agent_runs_reporter_id_ai_reporters_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."ai_reporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_article_id_agent_runs_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."agent_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_reporter_id_ai_reporters_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."ai_reporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_parent_reply_id_replies_id_fk" FOREIGN KEY ("parent_reply_id") REFERENCES "public"."replies"("id") ON DELETE no action ON UPDATE no action;