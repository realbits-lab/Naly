'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Newspaper, Clock } from 'lucide-react'
import Link from 'next/link'

interface Article {
  id: string
  title: string
  createdAt: string
}

export function SimpleNewsList() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch('/api/articles?limit=100&offset=0')
        if (response.ok) {
          const data = await response.json()
          // The API returns an object with articles array
          setArticles(Array.isArray(data.articles) ? data.articles : [])
        }
      } catch (error) {
        console.error('Failed to fetch articles:', error)
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <span>Latest News</span>
          </CardTitle>
          <CardDescription>Loading latest financial news...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse" />
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
          <Newspaper className="h-5 w-5 text-primary" />
          <span>Latest News</span>
        </CardTitle>
        <CardDescription>
          Recent financial news and market analysis ({articles.length} articles)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {articles.map((article) => (
            <Link key={article.id} href={`/news/${article.id}`}>
              <div className="flex items-start space-x-3 py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 rounded-md px-2 transition-colors cursor-pointer">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium leading-5 text-foreground line-clamp-2 hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {articles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No articles available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}