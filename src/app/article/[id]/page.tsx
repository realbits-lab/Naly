'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ContentCard as ContentCardType,
  formatRelativeTime,
  CATEGORY_CONFIG,
} from '@/lib/feed/types';
import { useArticle } from '@/hooks/use-article';
import { DataTable } from '@/components/data-viz/DataTable';
import { DataChart } from '@/components/data-viz/DataChart';
import { AdCard } from '@/components/feed/ad-card';

interface SourceInfo {
  url: string;
  title: string;
}

export default function ArticleDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const articleId = params.id as string;

  // Use SWR hook for article data with automatic caching
  const { article, isLoading, isError } = useArticle(articleId);

  const [relatedArticles, setRelatedArticles] = useState<ContentCardType[]>([]);
  const [sourceTitles, setSourceTitles] = useState<SourceInfo[]>([]);

  // Fetch source titles when article is loaded
  useEffect(() => {
    if (article?.sources && article.sources.length > 0) {
      fetchSourceTitles(article.sources);
    }
  }, [article]);

  // 2. Fetch source titles
  const fetchSourceTitles = async (sources: string[]): Promise<void> => {
    const titles = await Promise.all(
      sources.map(async (url) => {
        try {
          const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`);
          if (response.ok) {
            const data = await response.json();
            return { url, title: data.title || extractDomainTitle(url) };
          }
        } catch {
          // Ignore fetch errors
        }
        return { url, title: extractDomainTitle(url) };
      })
    );
    setSourceTitles(titles);
  };

  // 2. Handle share
  const handleShare = async (): Promise<void> => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    }
  };

  // 3. Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onBack={() => router.back()} />
        <main className="max-w-lg mx-auto px-4 pt-16 pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 4. Error state
  if (isError || (!isLoading && !article)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onBack={() => router.back()} />
        <main className="max-w-lg mx-auto px-4 pt-16 pb-8">
          <div className="text-center py-12">
            <p className="text-gray-500">
              {isError ? 'Failed to load article' : 'Article not found'}
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 text-blue-600 font-medium"
            >
              Go back
            </button>
          </div>
        </main>
      </div>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[article.category];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 5. Header with back & share */}
      <Header onBack={() => router.back()} onShare={handleShare} />

      <main className="max-w-lg mx-auto pt-14 pb-8">
        {/* 6. Hero Image */}
        {article.thumbnailUrl && (
          <div className="w-full h-48 bg-gray-200">
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="px-4 py-6 space-y-6">
          {/* 7. Title */}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {article.title}
          </h1>

          {/* 8. Metadata row */}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{formatRelativeTime(article.createdAt)}</span>
            <span className="text-gray-300">|</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${categoryConfig.color}`}>
              {categoryConfig.icon} {categoryConfig.label}
            </span>
          </div>

          <hr className="border-gray-200" />

          {/* 9. Content body */}
          <article className="prose prose-gray max-w-none">
            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
              {renderContentWithReferences(article.content, article.sources, article.dataTables, article.charts)}
            </div>
          </article>

          {/* Ad placement after content */}
          <div className="my-6">
            <AdCard />
          </div>

          {/* 10. Trend tags */}
          {article.trends.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Trends</h3>
              <div className="flex flex-wrap gap-2">
                {article.trends.map((trend, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {trend}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 11. Sources */}
          {article.sources.length > 0 && (
            <div id="sources-section" className="space-y-3">
              <h3 className="text-sm font-medium text-gray-500">Sources</h3>
              <div className="space-y-2">
                {article.sources.map((source, i) => {
                  const sourceInfo = sourceTitles[i];
                  const title = sourceInfo?.title || extractDomainTitle(source);
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-gray-400 text-sm flex-shrink-0">[{i + 1}]</span>
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline line-clamp-1"
                      >
                        {title}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ad placement after sources */}
          <div className="my-6">
            <AdCard />
          </div>

          <hr className="border-gray-200" />

          {/* 12. Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Related Articles</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
                {relatedArticles.map((related) => (
                  <Link
                    key={related.id}
                    href={`/article/${related.id}`}
                    className="flex-shrink-0 w-40"
                  >
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                      {related.thumbnailUrl && (
                        <div className="h-20 bg-gray-100">
                          <img
                            src={related.thumbnailUrl}
                            alt={related.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 line-clamp-2">
                          {related.title}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Helper function to convert markdown formatting to React elements
function parseMarkdownText(text: string, keyPrefix: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Match **bold**, *italic*, or ***bold italic***
  const markdownRegex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;

  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = markdownRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // ***bold italic***
      result.push(<strong key={`${keyPrefix}-${keyIndex++}`}><em>{match[2]}</em></strong>);
    } else if (match[3]) {
      // **bold**
      result.push(<strong key={`${keyPrefix}-${keyIndex++}`}>{match[3]}</strong>);
    } else if (match[4]) {
      // *italic*
      result.push(<em key={`${keyPrefix}-${keyIndex++}`}>{match[4]}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
}

// Helper function to render content with markdown links, URL references, tables, and charts
function renderContentWithReferences(
  content: string,
  sources: string[],
  dataTables?: ContentCardType['dataTables'],
  charts?: ContentCardType['charts']
): React.ReactNode[] {
  // First, remove existing [number] patterns that precede URLs (e.g., "[6] https://..." -> "https://...")
  const cleanedContent = content.replace(/\[(\d+)\]\s*(https?:\/\/)/g, '$2');

  // Pattern to match markdown links, raw URLs, table placeholders, and chart placeholders
  const combinedRegex = /(\{\{TABLE:(\d+)\}\})|(\{\{CHART:(\d+)\}\})|(\[([^\]]+)\]\((https?:\/\/[^)]+)\))|(https?:\/\/[^\s)]+)/g;

  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = combinedRegex.exec(cleanedContent)) !== null) {
    // Add text before this match (with markdown formatting)
    if (match.index > lastIndex) {
      const textBefore = cleanedContent.slice(lastIndex, match.index);
      result.push(...parseMarkdownText(textBefore, `md-${keyIndex++}`));
    }

    if (match[1]) {
      // Table placeholder: {{TABLE:n}}
      const tableIndex = parseInt(match[2], 10);
      if (dataTables && dataTables[tableIndex]) {
        result.push(
          <div key={`table-${keyIndex++}`}>
            <DataTable data={dataTables[tableIndex]} />
          </div>
        );
      }
    } else if (match[3]) {
      // Chart placeholder: {{CHART:n}}
      const chartIndex = parseInt(match[4], 10);
      if (charts && charts[chartIndex]) {
        result.push(
          <div key={`chart-${keyIndex++}`}>
            <DataChart data={charts[chartIndex]} />
          </div>
        );
      }
    } else if (match[5]) {
      // Markdown link: [text](url)
      const linkText = match[6];
      const url = match[7];
      const sourceIndex = findMatchingSourceIndex(url, sources);
      const refNumber = sourceIndex >= 0 ? sourceIndex + 1 : null;

      result.push(
        <a
          key={`link-${keyIndex++}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {linkText}
          {refNumber && <sup className="text-xs ml-0.5">[{refNumber}]</sup>}
        </a>
      );
    } else if (match[8]) {
      // Raw URL
      const url = match[8];
      const sourceIndex = findMatchingSourceIndex(url, sources);
      const refNumber = sourceIndex >= 0 ? sourceIndex + 1 : null;
      const targetUrl = refNumber ? sources[sourceIndex] : url;

      result.push(
        <a
          key={`url-${keyIndex++}`}
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-medium text-sm align-super"
        >
          [{refNumber || 'link'}]
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match (with markdown formatting)
  if (lastIndex < cleanedContent.length) {
    const remainingText = cleanedContent.slice(lastIndex);
    result.push(...parseMarkdownText(remainingText, `md-end-${keyIndex}`));
  }

  return result;
}

// Helper function to find matching source index with fuzzy matching
function findMatchingSourceIndex(url: string, sources: string[]): number {
  // 1. Try exact match first
  const exactIndex = sources.findIndex(source => source === url);
  if (exactIndex >= 0) return exactIndex;

  // 2. Try matching by extracting the unique article ID from Google News URLs
  // Google News URLs have format: /rss/articles/CBMi...
  const articleIdMatch = url.match(/\/articles\/([A-Za-z0-9_-]+)/);
  if (articleIdMatch) {
    const articleId = articleIdMatch[1].substring(0, 30); // Use first 30 chars as identifier
    const matchIndex = sources.findIndex(source => {
      const sourceIdMatch = source.match(/\/articles\/([A-Za-z0-9_-]+)/);
      if (sourceIdMatch) {
        return sourceIdMatch[1].substring(0, 30) === articleId;
      }
      return false;
    });
    if (matchIndex >= 0) return matchIndex;
  }

  // 3. Try base URL match (without query params)
  const urlBase = url.split('?')[0];
  const baseIndex = sources.findIndex(source => source.split('?')[0] === urlBase);
  if (baseIndex >= 0) return baseIndex;

  // 4. Try partial match - check if URL contains significant part of source
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    // Extract path portion and compare
    try {
      const urlPath = new URL(url).pathname;
      const sourcePath = new URL(source).pathname;
      if (urlPath.length > 20 && sourcePath.length > 20) {
        // Compare first 50 chars of path
        if (urlPath.substring(0, 50) === sourcePath.substring(0, 50)) {
          return i;
        }
      }
    } catch {
      // URL parsing failed, skip
    }
  }

  return -1;
}

// Helper function to extract domain name from URL for display
function extractDomainTitle(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    // Capitalize first letter
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return 'Source';
  }
}

// Header component with back and share buttons
function Header({
  onBack,
  onShare,
}: {
  onBack: () => void;
  onShare?: () => void;
}): React.ReactElement {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-gray-600 hover:text-gray-900 -ml-2 px-2 py-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Back</span>
        </button>

        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 px-2 py-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
