-- Migration: Add API Keys Tables
-- Description: Creates tables for API key management, usage tracking, and analytics

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    last_four_chars VARCHAR(4) NOT NULL,
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
    rate_limit INTEGER DEFAULT 100,
    ip_restrictions JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    revoked_at TIMESTAMP
);

-- Create indexes for api_keys
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_key_hash_idx ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_expires_at_idx ON api_keys(expires_at);
CREATE INDEX IF NOT EXISTS api_keys_revoked_at_idx ON api_keys(revoked_at);

-- Create api_key_logs table
CREATE TABLE IF NOT EXISTS api_key_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(500) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    response_time INTEGER, -- in milliseconds
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_body JSONB,
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for api_key_logs
CREATE INDEX IF NOT EXISTS api_key_logs_api_key_id_idx ON api_key_logs(api_key_id);
CREATE INDEX IF NOT EXISTS api_key_logs_timestamp_idx ON api_key_logs(timestamp);
CREATE INDEX IF NOT EXISTS api_key_logs_status_code_idx ON api_key_logs(status_code);

-- Create api_key_usage_stats table for aggregated statistics
CREATE TABLE IF NOT EXISTS api_key_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    request_count INTEGER DEFAULT 0 NOT NULL,
    error_count INTEGER DEFAULT 0 NOT NULL,
    avg_response_time INTEGER, -- in milliseconds
    unique_ips INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(api_key_id, date, endpoint)
);

-- Create indexes for api_key_usage_stats
CREATE INDEX IF NOT EXISTS api_key_usage_stats_date_idx ON api_key_usage_stats(date);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for api_key_usage_stats
DROP TRIGGER IF EXISTS update_api_key_usage_stats_updated_at ON api_key_usage_stats;
CREATE TRIGGER update_api_key_usage_stats_updated_at
    BEFORE UPDATE ON api_key_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE api_keys IS 'Stores API keys for programmatic access to the platform';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA-256 hash of the actual API key';
COMMENT ON COLUMN api_keys.last_four_chars IS 'Last 4 characters of the API key for identification';
COMMENT ON COLUMN api_keys.scopes IS 'Array of permission scopes granted to this API key';
COMMENT ON COLUMN api_keys.rate_limit IS 'Custom rate limit in requests per minute';
COMMENT ON COLUMN api_keys.ip_restrictions IS 'Array of IP addresses allowed to use this key';

COMMENT ON TABLE api_key_logs IS 'Detailed logs of all API key usage';
COMMENT ON COLUMN api_key_logs.response_time IS 'Response time in milliseconds';

COMMENT ON TABLE api_key_usage_stats IS 'Aggregated daily statistics for API key usage';