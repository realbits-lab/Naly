CREATE INDEX "agent_configs_status_idx" ON "agent_configs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_runs_agent_type_idx" ON "agent_runs" USING btree ("agent_type");--> statement-breakpoint
CREATE INDEX "agent_runs_status_idx" ON "agent_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_runs_start_time_idx" ON "agent_runs" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "agent_runs_type_status_time_idx" ON "agent_runs" USING btree ("agent_type","status","start_time");