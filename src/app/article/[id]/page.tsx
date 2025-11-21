'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ContentCard as ContentCardType,
  formatRelativeTime,
  CATEGORY_CONFIG,
} from '@/lib/feed/types';

export default function ArticleDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<ContentCardType | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ContentCardType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const articleId = params.id as string;

  // 1. Fetch article data
  useEffect(() => {
    const fetchArticle = async (): Promise<void> => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/article/${articleId}`);
        if (!response.ok) throw new Error('Article not found');

        const data = await response.json();
        setArticle(data.article);
        setRelatedArticles(data.related || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

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
  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onBack={() => router.back()} />
        <main className="max-w-lg mx-auto px-4 pt-16 pb-8">
          <div className="text-center py-12">
            <p className="text-gray-500">{error || 'Article not found'}</p>
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
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {article.content}
            </p>
          </article>

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
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500">Sources</h3>
              <div className="flex flex-wrap gap-2">
                {article.sources.map((source, i) => (
                  <a
                    key={i}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    [{i + 1}]
                  </a>
                ))}
              </div>
            </div>
          )}

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
