'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Trash2,
  RefreshCw,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  User,
  Tag,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface Article {
  id: string
  title: string
  summary?: string
  sourcePublisher?: string
  sourceCategory?: string
  sentiment?: string
  wordCount?: number
  readingTime?: number
  aiModel?: string
  createdAt: string
}

export function ArticleManagement() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/articles?limit=1000&offset=0')
      if (response.ok) {
        const data = await response.json()
        setArticles(Array.isArray(data.articles) ? data.articles : [])
      } else {
        toast.error('Failed to fetch articles')
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      toast.error('Failed to fetch articles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [])

  const handleSelectArticle = (articleId: string, checked: boolean) => {
    const newSelected = new Set(selectedArticles)
    if (checked) {
      newSelected.add(articleId)
    } else {
      newSelected.delete(articleId)
    }
    setSelectedArticles(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedArticles(new Set(articles.map(article => article.id)))
    } else {
      setSelectedArticles(new Set())
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedArticles.size === 0) {
      toast.error('No articles selected')
      return
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedArticles.size} article(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      setDeleting(true)
      const response = await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          articleIds: Array.from(selectedArticles)
        })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Successfully deleted ${result.deletedCount} article(s)`)
        setSelectedArticles(new Set())
        await fetchArticles()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to delete articles')
      }
    } catch (error) {
      console.error('Failed to delete articles:', error)
      toast.error('Failed to delete articles')
    } finally {
      setDeleting(false)
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'neutral': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const isAllSelected = articles.length > 0 && selectedArticles.size === articles.length
  const isPartiallySelected = selectedArticles.size > 0 && selectedArticles.size < articles.length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Article Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Article Management</span>
          <Badge variant="secondary">{articles.length} articles</Badge>
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                ref={(el) => {
                  if (el) el.indeterminate = isPartiallySelected
                }}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select all ({selectedArticles.size}/{articles.length})
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchArticles}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedArticles.size === 0 || deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : `Delete Selected (${selectedArticles.size})`}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No articles found</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {articles.map((article) => (
              <div
                key={article.id}
                className={`border rounded-lg p-4 transition-colors ${
                  selectedArticles.has(article.id)
                    ? 'bg-muted border-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedArticles.has(article.id)}
                    onCheckedChange={(checked) =>
                      handleSelectArticle(article.id, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium leading-5 text-foreground line-clamp-2 mb-2">
                      {article.title}
                    </h3>

                    {article.summary && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {article.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>

                      {article.readingTime && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{article.readingTime} min</span>
                        </div>
                      )}

                      {article.wordCount && (
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>{article.wordCount} words</span>
                        </div>
                      )}

                      {article.sourcePublisher && (
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>{article.sourcePublisher}</span>
                        </div>
                      )}

                      {article.aiModel && (
                        <Badge variant="outline" className="text-xs">
                          {article.aiModel}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {article.sentiment && (
                        <Badge className={`text-xs ${getSentimentColor(article.sentiment)}`}>
                          <TrendingUp className="h-3 w-3 mr-1" />
                          {article.sentiment}
                        </Badge>
                      )}

                      {article.sourceCategory && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {article.sourceCategory.replace('-', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}