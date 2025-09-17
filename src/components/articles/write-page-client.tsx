'use client'

import { useState } from 'react'
import { ArticleGenerator } from '@/components/articles/article-generator'
import { ArticleManagement } from '@/components/articles/article-management'
import { LatestNewsPanel } from '@/components/articles/latest-news-panel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PenTool } from 'lucide-react'

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

export function WritePageClient() {
  const [selectedArticles, setSelectedArticles] = useState<Article[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateFromSelected = (articles: Article[]) => {
    setSelectedArticles(articles)
    // The ArticleGenerator component should handle the actual generation
  }

  const handleGenerationStart = () => {
    setIsGenerating(true)
  }

  const handleGenerationEnd = () => {
    setIsGenerating(false)
    setSelectedArticles([]) // Clear selection after generation
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Content Creation Tools and Latest News */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PenTool className="h-5 w-5 text-primary" />
              <span>Content Creation Tools</span>
            </CardTitle>
            <CardDescription>
              Use AI-powered tools to generate comprehensive financial articles from news sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArticleGenerator
              preSelectedArticles={selectedArticles}
              onGenerationStart={handleGenerationStart}
              onGenerationEnd={handleGenerationEnd}
            />
          </CardContent>
        </Card>

        {/* Latest News Panel - positioned under generator */}
        <LatestNewsPanel
          onGenerateFromSelected={handleGenerateFromSelected}
          isGenerating={isGenerating}
        />
      </div>

      {/* Right Column: Article Management */}
      <div>
        <ArticleManagement />
      </div>
    </div>
  )
}