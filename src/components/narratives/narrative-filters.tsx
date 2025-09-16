'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Filter,
  X,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Clock
} from 'lucide-react'

interface NarrativeFiltersProps {
  filters: {
    category: string
    sentiment: string
    timeframe: string
    complexity: string
    ticker: string
    page: number
  }
  isAuthenticated: boolean
}

export function NarrativeFilters({ filters, isAuthenticated }: NarrativeFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete('page') // Reset page when filtering
    router.push(`/narratives?${params.toString()}`)
  }

  const clearAllFilters = () => {
    router.push('/narratives')
  }

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.sentiment !== 'all' ||
    filters.timeframe !== 'all' ||
    filters.complexity !== 'all' ||
    filters.ticker !== ''

  const categoryOptions = [
    { value: 'all', label: 'All Categories', count: 1247 },
    { value: 'earnings', label: 'Earnings Reports', count: 342 },
    { value: 'market-movement', label: 'Market Movements', count: 456 },
    { value: 'predictions', label: 'AI Predictions', count: 287 },
    { value: 'analysis', label: 'Deep Analysis', count: 162 }
  ]

  const sentimentOptions = [
    { value: 'all', label: 'All Sentiments', icon: BarChart3 },
    { value: 'bullish', label: 'Bullish', icon: TrendingUp },
    { value: 'bearish', label: 'Bearish', icon: TrendingDown },
    { value: 'neutral', label: 'Neutral', icon: Minus }
  ]

  const timeframeOptions = [
    { value: 'all', label: 'All Time' },
    { value: '1d', label: 'Today' },
    { value: '1w', label: 'This Week' },
    { value: '1m', label: 'This Month' },
    { value: '3m', label: 'Last 3 Months' }
  ]

  const complexityOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </CardTitle>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search by Ticker */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Search Ticker
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="AAPL, TSLA..."
              value={filters.ticker}
              onChange={(e) => updateFilter('ticker', e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Category
          </Label>
          <div className="space-y-1">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter('category', option.value)}
                className={`w-full flex items-center justify-between p-2 text-sm rounded-md transition-colors ${
                  filters.category === option.value
                    ? 'bg-bull/10 text-bull border border-bull/20'
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <span>{option.label}</span>
                <Badge variant="outline" className="text-xs">
                  {option.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Sentiment */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Sentiment
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {sentimentOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => updateFilter('sentiment', option.value)}
                  className={`flex items-center justify-center p-2 text-xs rounded-md transition-colors ${
                    filters.sentiment === option.value
                      ? 'bg-bull/10 text-bull border border-bull/20'
                      : 'hover:bg-muted/50 text-muted-foreground border border-transparent'
                  }`}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Timeframe */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Timeframe
          </Label>
          <div className="space-y-1">
            {timeframeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilter('timeframe', option.value)}
                className={`w-full flex items-center p-2 text-sm rounded-md transition-colors ${
                  filters.timeframe === option.value
                    ? 'bg-bull/10 text-bull border border-bull/20'
                    : 'hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <Clock className="h-3 w-3 mr-2" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Complexity (for authenticated users) */}
        {isAuthenticated && (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Complexity Level
            </Label>
            <div className="space-y-1">
              {complexityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('complexity', option.value)}
                  className={`w-full flex items-center p-2 text-sm rounded-md transition-colors ${
                    filters.complexity === option.value
                      ? 'bg-bull/10 text-bull border border-bull/20'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-xs font-medium text-muted-foreground">
              Active Filters
            </Label>
            <div className="flex flex-wrap gap-2">
              {filters.category !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {categoryOptions.find(o => o.value === filters.category)?.label}
                  <button
                    onClick={() => updateFilter('category', 'all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.sentiment !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  {sentimentOptions.find(o => o.value === filters.sentiment)?.label}
                  <button
                    onClick={() => updateFilter('sentiment', 'all')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}

              {filters.ticker && (
                <Badge variant="secondary" className="text-xs font-mono">
                  {filters.ticker.toUpperCase()}
                  <button
                    onClick={() => updateFilter('ticker', '')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}