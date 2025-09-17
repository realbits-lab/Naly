'use client'

import { useState } from 'react'
import { ArticleGenerator } from '@/components/articles/article-generator'

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

export function CreatePanel() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerationStart = () => {
    setIsGenerating(true)
  }

  const handleGenerationEnd = () => {
    setIsGenerating(false)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Custom Content Creation</h1>
          <p className="text-muted-foreground mt-1">
            Create comprehensive financial articles using AI-powered tools
          </p>
        </div>

        <div className="max-w-4xl">
          <ArticleGenerator
            preSelectedArticles={[]}
            onGenerationStart={handleGenerationStart}
            onGenerationEnd={handleGenerationEnd}
          />
        </div>
      </div>
    </div>
  )
}