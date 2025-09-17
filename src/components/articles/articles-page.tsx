'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArticleGenerator } from './article-generator'
import { ArticleList } from './article-list'
import { ArticleViewer } from './article-viewer'
import {
  Sparkles,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  Bot
} from 'lucide-react'

interface Article {
  id: string
  title: string
  summary: string
  content: string
  keyPoints: string[]
  marketAnalysis: string
  investmentImplications: string
  sourceTitle: string
  sourcePublisher: string
  sourceCategory: string
  sentiment: 'positive' | 'negative' | 'neutral'
  keywords: string[]
  entities: string[]
  wordCount: number
  readingTime: number
  aiModel: string
  createdAt: string
}

interface ArticleStats {
  totalArticles: number
  categoryCounts: Record<string, number>
  sentimentCounts: Record<string, number>
  modelCounts: Record<string, number>
  averages: {
    wordCount: number
    readingTime: number
  }
  recent: {
    last7Days: number
    thisWeek: number
  }
}

interface ArticlesPageProps {
  isLoggedIn: boolean
}

export function ArticlesPage({ isLoggedIn }: ArticlesPageProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [showArticleViewer, setShowArticleViewer] = useState(false)
  const [stats, setStats] = useState<ArticleStats | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleArticleGenerated = () => {
    // Trigger refresh of article list and stats
    setRefreshTrigger(prev => prev + 1)
    fetchStats()
  }

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article)
    setShowArticleViewer(true)
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' })
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI News Articles</h1>
          <p className="text-muted-foreground">
            Generate comprehensive financial analysis from the latest news
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalArticles}</div>
              <p className="text-xs text-muted-foreground">
                {stats.recent.last7Days} generated this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Word Count</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averages.wordCount}</div>
              <p className="text-xs text-muted-foreground">
                ~{stats.averages.readingTime} min read time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(stats.sentimentCounts)
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Most common sentiment
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Model</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(stats.modelCounts)
                  .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Primary generation model
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Latest Articles</span>
            {stats && stats.totalArticles > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                {stats.totalArticles}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Generate New</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-6">
          <ArticleList
            refreshTrigger={refreshTrigger}
            onArticleSelect={handleArticleSelect}
            isPublic={true}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <ArticleGenerator onArticleGenerated={handleArticleGenerated} />
        </TabsContent>
      </Tabs>

      {/* Article Viewer Dialog */}
      <ArticleViewer
        article={selectedArticle}
        open={showArticleViewer}
        onOpenChange={setShowArticleViewer}
      />
    </div>
  )
}