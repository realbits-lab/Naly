'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { useState, useEffect } from 'react'

interface WatchlistWidgetProps {
  userId: string
  config?: {
    maxItems?: number
    showPriceChange?: boolean
  }
  className?: string
}

export function WatchlistWidget({ userId, config = {}, className }: WatchlistWidgetProps) {
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { maxItems = 8, showPriceChange = true } = config

  useEffect(() => {
    // Mock data
    setWatchlist([
      { symbol: 'AAPL', price: 189.45, change: 2.34, changePercent: 1.25 },
      { symbol: 'TSLA', price: 252.18, change: -5.67, changePercent: -2.20 },
      { symbol: 'GOOGL', price: 2834.56, change: 12.45, changePercent: 0.44 }
    ])
    setLoading(false)
  }, [])

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Eye className="h-4 w-4" />
          <span>Watchlist</span>
        </CardTitle>
        <Button variant="ghost" size="sm">
          <Plus className="h-3 w-3" />
        </Button>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {watchlist.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between">
              <span className="font-medium">{item.symbol}</span>
              <div className="text-right">
                <div className="text-sm font-medium">${item.price}</div>
                {showPriceChange && (
                  <div className={`flex items-center text-xs ${item.change >= 0 ? 'text-bull' : 'text-bear'}`}>
                    {item.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}