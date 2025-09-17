DO $$ BEGIN
 CREATE TYPE "public"."analysis_type_enum" AS ENUM('CAUSAL_ANALYSIS', 'PREDICTIVE_ANALYSIS', 'SENTIMENT_ANALYSIS', 'TECHNICAL_ANALYSIS');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."content_status_enum" AS ENUM('draft', 'published', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."data_source_enum" AS ENUM('FINANCIAL_DATASETS_API', 'SEC_FILINGS', 'NEWS_FEED', 'INSIDER_TRADES', 'INSTITUTIONAL_OWNERSHIP', 'EARNINGS_RELEASES');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."data_type_enum" AS ENUM('STOCK_PRICE', 'VOLUME', 'FINANCIAL_METRIC', 'SENTIMENT_SCORE', 'NEWS_ITEM', 'FILING_DATA', 'TRADE_DATA');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_type_enum" AS ENUM('PRICE_JUMP', 'EARNINGS_RELEASE', 'NEWS_BREAK', 'FILING_SUBMISSION', 'INSIDER_TRADE', 'INSTITUTIONAL_CHANGE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."significance_level_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_tier_enum" AS ENUM('free', 'premium', 'enterprise');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_action_enum" AS ENUM('VIEW_PAGE', 'CLICK_LINK', 'SEARCH', 'FILTER_DATA', 'EXPORT_DATA', 'SHARE_CONTENT', 'SAVE_TO_WATCHLIST', 'UPDATE_PORTFOLIO', 'MAKE_PREDICTION', 'COMMENT', 'LIKE', 'BOOKMARK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role_enum" AS ENUM('RETAIL_INDIVIDUAL', 'RETAIL_PROFESSIONAL', 'INSTITUTIONAL_ANALYST', 'INSTITUTIONAL_MANAGER', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."achievement_category_enum" AS ENUM('PREDICTION_ACCURACY', 'LEARNING_PROGRESS', 'COMMUNITY_CONTRIBUTION', 'BIAS_MITIGATION', 'PORTFOLIO_PERFORMANCE', 'CONTENT_ENGAGEMENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."community_content_type_enum" AS ENUM('COMMENT', 'ANALYSIS', 'PREDICTION', 'QUESTION', 'EDUCATIONAL_CONTENT', 'MARKET_INSIGHT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."difficulty_level_enum" AS ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."rarity_level_enum" AS ENUM('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cron_job_status_enum" AS ENUM('ACTIVE', 'PAUSED', 'STOPPED', 'ERROR', 'COMPLETED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cron_job_type_enum" AS ENUM('MARKET_ANALYSIS', 'PORTFOLIO_UPDATE', 'PREDICTION_REFRESH', 'DATA_SYNC', 'CUSTOM_TASK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_level_enum" AS ENUM('USER', 'MANAGER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"analysis_type" "analysis_type_enum" NOT NULL,
	"causal_analysis" jsonb,
	"predictive_analysis" jsonb,
	"explanation" jsonb,
	"confidence_score" numeric(3, 2),
	"methodology" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" "event_type_enum" NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"magnitude" numeric(10, 4),
	"significance" "significance_level_enum",
	"source_data_ids" jsonb,
	"related_event_ids" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_data_points" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "data_source_enum" NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"data_type" "data_type_enum" NOT NULL,
	"value" jsonb NOT NULL,
	"confidence" numeric(3, 2),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "narratives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid,
	"headline" varchar NOT NULL,
	"summary" varchar,
	"explanation" varchar,
	"prediction" varchar,
	"deep_dive" varchar,
	"metadata" jsonb,
	"visualizations" jsonb,
	"status" "content_status_enum" DEFAULT 'draft',
	"version" numeric DEFAULT '1',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_behavior" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"action_type" "user_action_enum" NOT NULL,
	"resource_id" uuid,
	"resource_type" varchar(50),
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"average_cost" numeric(10, 4),
	"acquired_date" date,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_predictions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_id" uuid,
	"ticker" varchar(10) NOT NULL,
	"prediction_type" varchar(50) NOT NULL,
	"predicted_value" jsonb NOT NULL,
	"confidence" numeric(3, 2),
	"time_horizon" varchar(20),
	"rationale" varchar,
	"actual_outcome" jsonb,
	"accuracy" numeric(3, 2),
	"created_at" timestamp with time zone DEFAULT now(),
	"evaluated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_watchlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ticker" varchar(10) NOT NULL,
	"notes" varchar,
	"alert_settings" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"image" varchar(255),
	"email_verified" timestamp,
	"password_hash" varchar(255),
	"role" "user_role_enum" DEFAULT 'RETAIL_INDIVIDUAL',
	"demographics" jsonb,
	"preferences" jsonb,
	"subscription_tier" "subscription_tier_enum" DEFAULT 'free',
	"created_at" timestamp with time zone DEFAULT now(),
	"last_active_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ab_test_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_name" varchar(100) NOT NULL,
	"variant" varchar(50) NOT NULL,
	"user_id" uuid,
	"metric" varchar(50) NOT NULL,
	"value" numeric(10, 4) NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now(),
	"session_id" uuid,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_quality_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_source" varchar(100) NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"ticker" varchar(10),
	"quality_score" numeric(3, 2) NOT NULL,
	"completeness" numeric(3, 2),
	"accuracy" numeric(3, 2),
	"timeliness" numeric(3, 2),
	"consistency" numeric(3, 2),
	"issues" jsonb,
	"evaluation_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "feature_importance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_version" varchar(50) NOT NULL,
	"feature_name" varchar(100) NOT NULL,
	"importance" numeric(5, 4) NOT NULL,
	"rank" numeric NOT NULL,
	"evaluation_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_version" varchar(50) NOT NULL,
	"evaluation_date" date NOT NULL,
	"metrics" jsonb NOT NULL,
	"test_dataset" varchar(255),
	"performance_summary" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prediction_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prediction_id" uuid NOT NULL,
	"actual_outcome" jsonb,
	"prediction_accuracy" numeric(3, 2),
	"evaluation_date" date NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" varchar NOT NULL,
	"category" varchar(50) NOT NULL,
	"difficulty" "difficulty_level_enum" NOT NULL,
	"objectives" jsonb NOT NULL,
	"rewards" jsonb NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"participant_count" integer DEFAULT 0,
	"completion_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_type" "community_content_type_enum" NOT NULL,
	"title" varchar(255),
	"content" varchar NOT NULL,
	"related_event_id" uuid,
	"related_ticker" varchar(10),
	"metadata" jsonb,
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"is_moderated" boolean DEFAULT false,
	"moderation_flags" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_discussions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"author_id" uuid NOT NULL,
	"title" varchar(255),
	"content" varchar NOT NULL,
	"related_event_id" uuid,
	"related_ticker" varchar(10),
	"upvotes" integer DEFAULT 0,
	"downvotes" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"last_activity_at" timestamp with time zone DEFAULT now(),
	"is_sticky" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leaderboards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"leaderboard_type" varchar(50) NOT NULL,
	"period" varchar(20) NOT NULL,
	"score" numeric(10, 4) NOT NULL,
	"rank" integer NOT NULL,
	"metadata" jsonb,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"achievement_name" varchar(100) NOT NULL,
	"description" varchar(255),
	"category" "achievement_category_enum" NOT NULL,
	"rarity" "rarity_level_enum" NOT NULL,
	"points" integer DEFAULT 0,
	"unlocked_at" timestamp with time zone DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_challenge_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"progress" numeric(3, 2) DEFAULT '0',
	"current_objectives" jsonb NOT NULL,
	"completed_objectives" jsonb,
	"is_completed" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now(),
	"last_progress_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cron_job_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"status" varchar(20) NOT NULL,
	"output" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cron_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "cron_job_type_enum" NOT NULL,
	"cron_expression" varchar(100) NOT NULL,
	"task_config" jsonb,
	"status" "cron_job_status_enum" DEFAULT 'ACTIVE',
	"is_active" boolean DEFAULT true,
	"last_run" timestamp with time zone,
	"next_run" timestamp with time zone,
	"run_count" varchar(10) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer,
	"feedback" text,
	"is_helpful" varchar(10),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" uuid,
	"viewed_at" timestamp with time zone DEFAULT now(),
	"reading_time" integer,
	"completion_percentage" integer,
	"session_id" varchar(100)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "generated_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"key_points" jsonb,
	"market_analysis" text,
	"investment_implications" text,
	"source_title" varchar(500),
	"source_content" text,
	"source_url" varchar(1000),
	"source_publisher" varchar(255),
	"source_category" varchar(100),
	"sentiment" varchar(20),
	"keywords" jsonb,
	"entities" jsonb,
	"market_impact" text,
	"word_count" integer,
	"reading_time" integer,
	"ai_model" varchar(100),
	"generation_method" varchar(50),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "article_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"parent_id" uuid,
	"content" text NOT NULL,
	"like_count" integer DEFAULT 0,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_article_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"user_id" uuid,
	"session_id" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"viewed_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"slug" varchar(200) NOT NULL,
	"view_count" integer DEFAULT 0,
	"reply_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"is_published" boolean DEFAULT false,
	"is_pinned" boolean DEFAULT false,
	"is_featured" boolean DEFAULT false,
	"published_at" timestamp with time zone,
	"tags" jsonb,
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "community_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"icon" varchar(50),
	"color" varchar(20),
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"created_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "community_sections_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reply_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reply_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_community_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level" "user_level_enum" DEFAULT 'USER',
	"permissions" jsonb,
	"granted_by_id" uuid,
	"granted_at" timestamp with time zone DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "narratives" ADD CONSTRAINT "narratives_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_behavior" ADD CONSTRAINT "user_behavior_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_portfolios" ADD CONSTRAINT "user_portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_predictions" ADD CONSTRAINT "user_predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_watchlists" ADD CONSTRAINT "user_watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_content" ADD CONSTRAINT "community_content_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_discussions" ADD CONSTRAINT "community_discussions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "leaderboards" ADD CONSTRAINT "leaderboards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cron_job_logs" ADD CONSTRAINT "cron_job_logs_job_id_cron_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."cron_jobs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cron_jobs" ADD CONSTRAINT "cron_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_feedback" ADD CONSTRAINT "article_feedback_article_id_generated_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."generated_articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_feedback" ADD CONSTRAINT "article_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_views" ADD CONSTRAINT "article_views_article_id_generated_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."generated_articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_views" ADD CONSTRAINT "article_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "generated_articles" ADD CONSTRAINT "generated_articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_article_id_community_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."community_articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_likes" ADD CONSTRAINT "article_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_replies" ADD CONSTRAINT "article_replies_article_id_community_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."community_articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_replies" ADD CONSTRAINT "article_replies_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "article_replies" ADD CONSTRAINT "article_replies_parent_id_article_replies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."article_replies"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_article_views" ADD CONSTRAINT "community_article_views_article_id_community_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."community_articles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_article_views" ADD CONSTRAINT "community_article_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_articles" ADD CONSTRAINT "community_articles_section_id_community_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."community_sections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_articles" ADD CONSTRAINT "community_articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "community_sections" ADD CONSTRAINT "community_sections_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reply_likes" ADD CONSTRAINT "reply_likes_reply_id_article_replies_id_fk" FOREIGN KEY ("reply_id") REFERENCES "public"."article_replies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "reply_likes" ADD CONSTRAINT "reply_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_community_permissions" ADD CONSTRAINT "user_community_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_community_permissions" ADD CONSTRAINT "user_community_permissions_granted_by_id_users_id_fk" FOREIGN KEY ("granted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analysis_event_id" ON "analysis_results" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analysis_type" ON "analysis_results" USING btree ("analysis_type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_ticker_timestamp" ON "events" USING btree ("ticker","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_significance" ON "events" USING btree ("significance","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_type" ON "events" USING btree ("event_type","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_market_data_ticker_timestamp" ON "market_data_points" USING btree ("ticker","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_market_data_source_type" ON "market_data_points" USING btree ("source","data_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_market_data_timestamp" ON "market_data_points" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_narratives_event_id" ON "narratives" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_narratives_status" ON "narratives" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_behavior_user_id" ON "user_behavior" USING btree ("user_id","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_behavior_action" ON "user_behavior" USING btree ("action_type","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_user_id" ON "user_portfolios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_portfolios_ticker" ON "user_portfolios" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_predictions_user_id" ON "user_predictions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_predictions_ticker" ON "user_predictions" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_predictions_created_at" ON "user_predictions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_watchlists_user_id" ON "user_watchlists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_watchlists_ticker" ON "user_watchlists" USING btree ("ticker");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_subscription" ON "users" USING btree ("subscription_tier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ab_test_name_variant" ON "ab_test_results" USING btree ("test_name","variant");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ab_test_timestamp" ON "ab_test_results" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_quality_source_type" ON "data_quality_metrics" USING btree ("data_source","data_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_quality_ticker_date" ON "data_quality_metrics" USING btree ("ticker","evaluation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_data_quality_score" ON "data_quality_metrics" USING btree ("quality_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_feature_importance_model" ON "feature_importance" USING btree ("model_name","model_version","evaluation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_feature_importance_rank" ON "feature_importance" USING btree ("importance");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_model_performance_name" ON "model_performance" USING btree ("model_name","evaluation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_prediction_tracking_accuracy" ON "prediction_tracking" USING btree ("prediction_accuracy","evaluation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_challenges_category" ON "challenges" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_challenges_difficulty" ON "challenges" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_challenges_active" ON "challenges" USING btree ("is_active","start_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_content_user_id" ON "community_content" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_content_type" ON "community_content" USING btree ("content_type","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_content_ticker" ON "community_content" USING btree ("related_ticker");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discussions_author_id" ON "community_discussions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discussions_parent_id" ON "community_discussions" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discussions_ticker" ON "community_discussions" USING btree ("related_ticker");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_discussions_activity" ON "community_discussions" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leaderboards_type_rank" ON "leaderboards" USING btree ("leaderboard_type","period","rank");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leaderboards_user_id" ON "leaderboards" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_leaderboards_score" ON "leaderboards" USING btree ("score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_achievements_user_id" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_achievements_category" ON "user_achievements" USING btree ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_achievements_rarity" ON "user_achievements" USING btree ("rarity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_challenge_progress_user_id" ON "user_challenge_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_challenge_progress_challenge_id" ON "user_challenge_progress" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_challenge_progress_completed" ON "user_challenge_progress" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cron_job_logs_job_id" ON "cron_job_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cron_job_logs_start_time" ON "cron_job_logs" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cron_job_logs_status" ON "cron_job_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cron_jobs_user_id" ON "cron_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cron_jobs_status" ON "cron_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cron_jobs_next_run" ON "cron_jobs" USING btree ("next_run");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cron_jobs_active" ON "cron_jobs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_feedback_article_id" ON "article_feedback" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_feedback_user_id" ON "article_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_views_article_id" ON "article_views" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_views_user_id" ON "article_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_views_viewed_at" ON "article_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_generated_articles_user_id" ON "generated_articles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_generated_articles_created_at" ON "generated_articles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_generated_articles_category" ON "generated_articles" USING btree ("source_category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_generated_articles_sentiment" ON "generated_articles" USING btree ("sentiment");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_likes_article_user" ON "article_likes" USING btree ("article_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_likes_user_id" ON "article_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_replies_article_id" ON "article_replies" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_replies_author_id" ON "article_replies" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_replies_parent_id" ON "article_replies" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_article_replies_created_at" ON "article_replies" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_article_views_article_id" ON "community_article_views" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_article_views_session" ON "community_article_views" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_article_views_viewed_at" ON "community_article_views" USING btree ("viewed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_articles_section_id" ON "community_articles" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_articles_author_id" ON "community_articles" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_articles_slug" ON "community_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_articles_published" ON "community_articles" USING btree ("is_published","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_articles_pinned" ON "community_articles" USING btree ("is_pinned");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_articles_featured" ON "community_articles" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_sections_slug" ON "community_sections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_sections_active" ON "community_sections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_community_sections_order" ON "community_sections" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reply_likes_reply_user" ON "reply_likes" USING btree ("reply_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reply_likes_user_id" ON "reply_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_community_permissions_user_id" ON "user_community_permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_community_permissions_level" ON "user_community_permissions" USING btree ("level");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_user_community_permissions_active" ON "user_community_permissions" USING btree ("is_active");