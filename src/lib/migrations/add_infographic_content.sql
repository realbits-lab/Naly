-- Add infographic content column to generated_articles table
ALTER TABLE generated_articles
ADD COLUMN IF NOT EXISTS infographic_content TEXT;

-- Add column to track if infographic has been generated
ALTER TABLE generated_articles
ADD COLUMN IF NOT EXISTS has_infographic BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generated_articles_has_infographic
ON generated_articles(has_infographic);

-- Add comment for documentation
COMMENT ON COLUMN generated_articles.infographic_content IS 'Standalone HTML content with embedded CSS/JS for infographic visualization';
COMMENT ON COLUMN generated_articles.has_infographic IS 'Flag indicating whether infographic has been generated for this article';