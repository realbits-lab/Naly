-- Add fullContent column to rss_articles table
ALTER TABLE rss_articles
ADD COLUMN IF NOT EXISTS full_content TEXT;