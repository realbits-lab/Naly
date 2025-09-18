-- Script to remove all generated articles and their translations
-- This will clean up the database completely

-- First, delete article translations (foreign key constraint)
DELETE FROM article_translations;

-- Then delete all generated articles
DELETE FROM generated_articles;

-- Show final counts to verify deletion
SELECT
    (SELECT COUNT(*) FROM generated_articles) as remaining_articles,
    (SELECT COUNT(*) FROM article_translations) as remaining_translations;