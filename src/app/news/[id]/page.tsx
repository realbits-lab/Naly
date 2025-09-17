import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { generatedArticles } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Clock, Calendar, Tag, TrendingUp, User } from 'lucide-react'
import Link from 'next/link'

interface ArticlePageProps {
  params: {
    id: string
  }
}

async function getArticle(id: string) {
  try {
    const articles = await db
      .select()
      .from(generatedArticles)
      .where(eq(generatedArticles.id, id))
      .limit(1)

    return articles[0] || null
  } catch (error) {
    console.error('Failed to fetch article:', error)
    return null
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticle(params.id)

  if (!article) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href="/news"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to News
        </Link>
      </div>

      <article className="space-y-6">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {new Date(article.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            {article.readingTime && (
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                {article.readingTime} min read
              </div>
            )}

            {article.sourcePublisher && (
              <div className="flex items-center">
                <User className="mr-1 h-4 w-4" />
                {article.sourcePublisher}
              </div>
            )}

            {article.sentiment && (
              <div className="flex items-center">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span className={`capitalize ${
                  article.sentiment === 'positive' ? 'text-green-600' :
                  article.sentiment === 'negative' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {article.sentiment}
                </span>
              </div>
            )}

            {article.sourceCategory && (
              <div className="flex items-center">
                <Tag className="mr-1 h-4 w-4" />
                <span className="capitalize">{article.sourceCategory.replace('-', ' ')}</span>
              </div>
            )}
          </div>
        </header>

        {article.summary && (
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {article.summary}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="prose prose-gray max-w-none dark:prose-invert">
          <div className="whitespace-pre-wrap leading-relaxed">
            {article.content}
          </div>
        </div>

        {article.keyPoints && Array.isArray(article.keyPoints) && article.keyPoints.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Points</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {article.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {article.marketAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle>Market Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {article.marketAnalysis}
              </p>
            </CardContent>
          </Card>
        )}

        {article.investmentImplications && (
          <Card>
            <CardHeader>
              <CardTitle>Investment Implications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {article.investmentImplications}
              </p>
            </CardContent>
          </Card>
        )}

        {article.keywords && Array.isArray(article.keywords) && article.keywords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {article.sourceUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Source</CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {article.sourceTitle || article.sourceUrl}
              </a>
              {article.sourcePublisher && (
                <p className="text-sm text-muted-foreground mt-1">
                  Published by {article.sourcePublisher}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </article>
    </div>
  )
}