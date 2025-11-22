ALTER TABLE "agent_runs" ADD COLUMN "prediction_check_time" timestamp;--> statement-breakpoint
ALTER TABLE "agent_runs" ADD COLUMN "prediction_results" jsonb;