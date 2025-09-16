'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  BarChart3,
  BookOpen,
  Star,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeaturedNarrativesProps {
  userId?: string
}

interface FeaturedNarrative {
  id: string
  title: string
  summary: string
  ticker: string
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidence: number
  createdAt: string
  readingTime: number
  viewCount: number
  category: string
  isFeatured: boolean
  hasVisualization: boolean
  author: {
    type: 'ai' | 'human'
    name: string
  }
  metrics: {
    priceChange: number
    priceChangePercent: number
    volume: string
  }
}

export function FeaturedNarratives({ userId }: FeaturedNarrativesProps) {
  const [narratives, setNarratives] = useState<FeaturedNarrative[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeaturedNarratives()
  }, [userId])

  const loadFeaturedNarratives = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 800))

      const mockNarratives: FeaturedNarrative[] = [
        {
          id: '1',
          title: 'Apple\'s AI Revolution: How Machine Learning is Transforming the iPhone Experience',
          summary: 'Apple\'s latest AI developments are creating unprecedented value for both consumers and investors, with the company poised to dominate the next generation of mobile computing.',
          ticker: 'AAPL',
          sentiment: 'bullish',
          confidence: 0.89,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          readingTime: 5,
          viewCount: 2847,
          category: 'Technology Analysis',
          isFeatured: true,
          hasVisualization: true,
          author: { type: 'ai', name: 'Naly AI' },
          metrics: {
            priceChange: 4.75,
            priceChangePercent: 2.51,
            volume: '45.2M'
          }
        },
        {
          id: '2',
          title: 'The Great Tech Rotation: Why Investors are Shifting from Growth to Value',
          summary: 'A comprehensive analysis of the current market rotation and its implications for tech stocks, traditional value investments, and portfolio allocation strategies.',
          ticker: 'QQQ',
          sentiment: 'neutral',
          confidence: 0.82,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          readingTime: 7,
          viewCount: 1923,
          category: 'Market Analysis',
          isFeatured: true,
          hasVisualization: true,
          author: { type: 'ai', name: 'Naly AI' },
          metrics: {
            priceChange: -1.23,
            priceChangePercent: -0.32,
            volume: '28.7M'
          }
        },
        {
          id: '3',
          title: 'Tesla\'s Energy Business: The Hidden Catalyst for the Next Bull Run',
          summary: 'While everyone focuses on car sales, Tesla\'s energy division is quietly becoming a major growth driver with massive implications for the stock price.',
          ticker: 'TSLA',
          sentiment: 'bullish',
          confidence: 0.76,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          readingTime: 4,
          viewCount: 3251,
          category: 'Company Deep Dive',
          isFeatured: true,
          hasVisualization: true,
          author: { type: 'ai', name: 'Naly AI' },
          metrics: {
            priceChange: 8.90,
            priceChangePercent: 3.54,
            volume: '52.1M'
          }
        }
      ]

      setNarratives(mockNarratives)
    } catch (error) {
      console.error('Error loading featured narratives:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSentimentColor = (sentiment: FeaturedNarrative['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return 'text-bull'
      case 'bearish': return 'text-bear'
      case 'neutral': return 'text-neutral'
      default: return 'text-muted-foreground'
    }
  }

  const getSentimentBadge = (sentiment: FeaturedNarrative['sentiment']) => {
    switch (sentiment) {
      case 'bullish': return { variant: 'bull' as const, label: 'Bullish' }
      case 'bearish': return { variant: 'bear' as const, label: 'Bearish' }
      case 'neutral': return { variant: 'neutral' as const, label: 'Neutral' }
      default: return { variant: 'secondary' as const, label: 'Unknown' }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg" />
            <CardContent className="p-6 space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="flex items-center space-x-2">
                <div className="h-5 bg-muted rounded w-12" />
                <div className="h-5 bg-muted rounded w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {narratives.map((narrative, index) => {
        const sentimentBadge = getSentimentBadge(narrative.sentiment)
        const isMainFeature = index === 0

        return (
          <Card
            key={narrative.id}
            className={cn(
              "group hover:shadow-lg transition-all duration-200 cursor-pointer border-muted/50 hover:border-bull/20",
              isMainFeature && "md:col-span-2 lg:col-span-1 lg:row-span-2"
            )}
          >
            <CardHeader className="p-0">
              {/* Visual Header */}
              <div className={cn(
                "relative overflow-hidden rounded-t-lg bg-gradient-to-br",
                narrative.sentiment === 'bullish' ? 'from-bull/20 to-bull/5' :
                narrative.sentiment === 'bearish' ? 'from-bear/20 to-bear/5' :
                'from-neutral/20 to-neutral/5',
                isMainFeature ? 'h-64' : 'h-48'
              )}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJjdXJyZW50Q29sb3IiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz48L3N2Zz4=')] pattern-dots" />
                </div>

                {/* Content */}
                <div className="relative p-6 h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        {narrative.category}
                      </Badge>

                      {narrative.hasVisualization && (
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-bull/20">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Interactive
                        </Badge>
                      )}
                    </div>

                    {narrative.isFeatured && (
                      <Badge className="bg-bull text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Metrics */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm font-mono">
                          {narrative.ticker}
                        </Badge>
                        <div className={cn(
                          "flex items-center text-sm font-medium",
                          narrative.metrics.priceChangePercent >= 0 ? 'text-bull' : 'text-bear'
                        )}>
                          {narrative.metrics.priceChangePercent >= 0 ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          <span>
                            {narrative.metrics.priceChangePercent >= 0 ? '+' : ''}
                            {narrative.metrics.priceChangePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={sentimentBadge.variant}
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        {sentimentBadge.label}
                      </Badge>
                    </div>

                    {/* View button */}
                    <Link href={`/narratives/${narrative.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="group-hover:bg-bull group-hover:text-white transition-colors"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Read Story
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className={cn(
                    "font-semibold leading-snug group-hover:text-bull transition-colors",
                    isMainFeature ? "text-lg" : "text-base"
                  )}>
                    {narrative.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {narrative.summary}
                  </p>
                </div>

                {/* Meta information */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{narrative.author.name}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{narrative.readingTime} min read</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span>{narrative.viewCount.toLocaleString()} views</span>
                    <span>•</span>
                    <span>{Math.round(narrative.confidence * 100)}% confidence</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}