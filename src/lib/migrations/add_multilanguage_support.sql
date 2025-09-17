-- Migration: Add multi-language support
-- Description: Adds support for English and Korean languages for articles

-- First, add multi-language fields to existing articles table
ALTER TABLE generated_articles
ADD COLUMN source_language varchar(5) NOT NULL DEFAULT 'en',
ADD COLUMN has_translations text NOT NULL DEFAULT 'false';

-- Create index for source language
CREATE INDEX idx_generated_articles_source_language ON generated_articles(source_language);

-- Create article translations table
CREATE TABLE article_translations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id uuid NOT NULL REFERENCES generated_articles(id) ON DELETE CASCADE,
    language_code varchar(5) NOT NULL,

    -- Translated content fields
    title varchar(500) NOT NULL,
    content text NOT NULL,
    summary text,
    market_analysis text,
    investment_implications text,

    -- Translation metadata
    translated_by varchar(50),
    translation_quality varchar(20),

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for article_translations
CREATE INDEX idx_article_translations_article_id ON article_translations(article_id);
CREATE INDEX idx_article_translations_language_code ON article_translations(language_code);
CREATE INDEX idx_article_translations_article_language ON article_translations(article_id, language_code);

-- Create user language preferences table
CREATE TABLE user_language_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    language_code varchar(5) NOT NULL DEFAULT 'en',
    is_default text NOT NULL DEFAULT 'true',

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for user_language_preferences
CREATE INDEX idx_user_language_preferences_user_id ON user_language_preferences(user_id);
CREATE INDEX idx_user_language_preferences_language_code ON user_language_preferences(language_code);
CREATE INDEX idx_user_language_preferences_user_default ON user_language_preferences(user_id, is_default);

-- Create supported languages table
CREATE TABLE supported_languages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language_code varchar(5) NOT NULL UNIQUE,
    language_name varchar(100) NOT NULL,
    native_name varchar(100) NOT NULL,
    is_active text NOT NULL DEFAULT 'true',
    display_order text NOT NULL DEFAULT '0',

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for supported_languages
CREATE INDEX idx_supported_languages_code ON supported_languages(language_code);
CREATE INDEX idx_supported_languages_active ON supported_languages(is_active);
CREATE INDEX idx_supported_languages_order ON supported_languages(display_order);

-- Insert default supported languages
INSERT INTO supported_languages (language_code, language_name, native_name, is_active, display_order) VALUES
('en', 'English', 'English', 'true', '1'),
('ko', 'Korean', '한국어', 'true', '2');

-- Create a unique constraint to ensure one translation per language per article
ALTER TABLE article_translations ADD CONSTRAINT unique_article_language UNIQUE (article_id, language_code);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all relevant tables
CREATE TRIGGER update_article_translations_updated_at BEFORE UPDATE ON article_translations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_language_preferences_updated_at BEFORE UPDATE ON user_language_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supported_languages_updated_at BEFORE UPDATE ON supported_languages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();