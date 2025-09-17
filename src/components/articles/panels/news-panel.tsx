'use client'

import { useState } from 'react'
import { LatestNewsPanel } from '@/components/articles/latest-news-panel'

interface Article {
  id: string
  title: string
  summary: string
  content: string
  source: string
  publishedAt: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  category?: string
  symbols?: string[]
  url?: string
}

export function NewsPanel() {
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateFromSelected = (articles: Article[]) => {
    setSelectedArticles(articles)
    setIsGenerating(true)

    // Simulate generation process
    setTimeout(() => {
      setIsGenerating(false)
      setSelectedArticles([])
    }, 3000)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Latest News Creation</h1>
          <p className="text-muted-foreground mt-1">
            Generate articles from the latest financial news and market updates
          </p>
        </div>

        <div className="max-w-4xl">
          <LatestNewsPanel
            onGenerateFromSelected={handleGenerateFromSelected}
            isGenerating={isGenerating}
          />
        </div>

        {selectedArticles.length > 0 && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Selected Articles for Generation:</h3>
            <ul className="space-y-1">
              {selectedArticles.map((article) => (
                <li key={article.id} className="text-sm text-muted-foreground">
                  • {article.title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}