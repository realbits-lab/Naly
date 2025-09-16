'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Hash, Clock } from 'lucide-react'

interface TrendingTopic {
  id: string
  topic: string
  narrativeCount: number
  growth: number
  category: string
  isHot: boolean
}

export function TrendingTopics() {
  const [topics, setTopics] = useState<TrendingTopic[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrendingTopics()
  }, [])

  const loadTrendingTopics = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 600))

      const mockTopics: TrendingTopic[] = [
        {
          id: '1',
          topic: 'AI Revolution',
          narrativeCount: 47,
          growth: 156,
          category: 'Technology',
          isHot: true
        },
        {
          id: '2',
          topic: 'Fed Rate Decisions',
          narrativeCount: 32,
          growth: 89,
          category: 'Monetary Policy',
          isHot: true
        },
        {
          id: '3',
          topic: 'Earnings Season',
          narrativeCount: 28,
          growth: 67,
          category: 'Corporate',
          isHot: false
        },
        {
          id: '4',
          topic: 'Green Energy',
          narrativeCount: 24,
          growth: 45,
          category: 'Energy',
          isHot: false
        },
        {
          id: '5',
          topic: 'Crypto Adoption',
          narrativeCount: 19,
          growth: 34,
          category: 'Cryptocurrency',
          isHot: false
        }
      ]

      setTopics(mockTopics)
    } catch (error) {
      console.error('Error loading trending topics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <span>Trending Topics</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/narratives?q=${encodeURIComponent(topic.topic)}`}
              className="block group"
            >
              <div className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium group-hover:text-bull transition-colors truncate">
                      {topic.topic}
                    </span>
                    {topic.isHot && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        Hot
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{topic.narrativeCount} stories</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-bull" />
                      <span>{topic.growth}% growth</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t text-center">
          <Link
            href="/narratives/topics"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View all topics →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}