'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, Clock, MoreHorizontal, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentNarrativesProps {
  userId: string
  config?: {
    maxItems?: number
    showSummary?: boolean
  }
  className?: string
}

interface Narrative {
  id: string
  title: string
  summary: string
  ticker: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  createdAt: string
  readingTime: number
}

export function RecentNarratives({ userId, config = {}, className }: RecentNarrativesProps) {
  const [narratives, setNarratives] = useState<Narrative[]>([])
  const [loading, setLoading] = useState(true)

  const { maxItems = 4, showSummary = true } = config

  useEffect(() => {
    loadNarratives()
  }, [userId, maxItems])

  const loadNarratives = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 600))

      const mockNarratives: Narrative[] = [
        {
          id: '1',
          title: 'Apple Stock Surges Following Strong iPhone Sales Report',
          summary: 'Apple exceeded quarterly expectations with robust iPhone 15 sales, driving investor confidence and pushing the stock to new highs.',
          ticker: 'AAPL',
          sentiment: 'bullish',
          confidence: 0.85,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          readingTime: 3
        },
        {
          id: '2',
          title: 'Tesla Faces Headwinds in Chinese Market Expansion',
          summary: 'Increased competition and regulatory challenges in China are impacting Tesla\'s market share, raising concerns about future growth.',
          ticker: 'TSLA',
          sentiment: 'bearish',
          confidence: 0.78,
          createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          readingTime: 4
        },
        {
          id: '3',
          title: 'Microsoft Azure Cloud Revenue Growth Accelerates',
          summary: 'Azure\'s strong performance in enterprise adoption continues to drive Microsoft\'s cloud strategy, outpacing competitor growth rates.',
          ticker: 'MSFT',
          sentiment: 'bullish',
          confidence: 0.82,
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          readingTime: 2
        },
        {
          id: '4',
          title: 'Fed Rate Decision Impact on Tech Sector Valuations',
          summary: 'The Federal Reserve\'s latest interest rate decision has mixed implications for high-growth tech stocks in the current market environment.',
          ticker: 'QQQ',
          sentiment: 'neutral',
          confidence: 0.71,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          readingTime: 5
        }
      ]

      setNarratives(mockNarratives.slice(0, maxItems))
    } catch (error) {
      console.error('Error loading narratives:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: Narrative['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return 'text-bull'
      case 'bearish': return 'text-bear'
      case 'neutral': return 'text-neutral'
      default: return 'text-muted-foreground'
    }
  }

  const getSentimentBadge = (sentiment: Narrative['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return { variant: 'bull' as const, icon: TrendingUp }
      case 'bearish': return { variant: 'bear' as const, icon: TrendingUp }
      case 'neutral': return { variant: 'neutral' as const, icon: TrendingUp }
      default: return { variant: 'secondary' as const, icon: TrendingUp }
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Narratives</CardTitle>
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <BookOpen className="h-4 w-4" />
          <span>Recent Narratives</span>
        </CardTitle>

        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            AI Generated
          </Badge>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {narratives.map((narrative) => {
            const sentimentBadge = getSentimentBadge(narrative.sentiment)

            return (
              <div key={narrative.id} className="space-y-2 pb-4 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between space-x-2">
                  <h4 className="text-sm font-medium line-clamp-2 flex-1">
                    {narrative.title}
                  </h4>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {narrative.ticker}
                  </Badge>
                </div>

                {showSummary && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {narrative.summary}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={sentimentBadge.variant}
                      className="text-xs capitalize"
                    >
                      {narrative.sentiment}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(narrative.confidence * 100)}% confidence
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{narrative.readingTime} min read</span>
                    <span>•</span>
                    <span>
                      {new Date(narrative.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View All Narratives →
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}