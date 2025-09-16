'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  Zap,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  userId: string
}

interface MarketStats {
  marketStatus: 'open' | 'closed' | 'pre-market' | 'after-hours'
  lastUpdate: string
  indices: {
    name: string
    symbol: string
    value: number
    change: number
    changePercent: number
  }[]
}

export function DashboardHeader({ userId }: DashboardHeaderProps) {
  const [marketStats, setMarketStats] = useState<MarketStats>({
    marketStatus: 'open',
    lastUpdate: new Date().toISOString(),
    indices: [
      { name: 'S&P 500', symbol: 'SPY', value: 4567.89, change: 23.45, changePercent: 0.52 },
      { name: 'NASDAQ', symbol: 'QQQ', value: 384.12, change: 5.67, changePercent: 1.50 },
      { name: 'Dow Jones', symbol: 'DIA', value: 345.23, change: -2.34, changePercent: -0.67 }
    ]
  })

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getMarketStatusInfo = () => {
    switch (marketStats.marketStatus) {
      case 'open':
        return {
          label: 'Market Open',
          color: 'bg-bull text-white',
          icon: Activity
        }
      case 'closed':
        return {
          label: 'Market Closed',
          color: 'bg-muted text-muted-foreground',
          icon: Clock
        }
      case 'pre-market':
        return {
          label: 'Pre-Market',
          color: 'bg-blue-500 text-white',
          icon: TrendingUp
        }
      case 'after-hours':
        return {
          label: 'After Hours',
          color: 'bg-purple-500 text-white',
          icon: TrendingDown
        }
    }
  }

  const statusInfo = getMarketStatusInfo()

  return (
    <div className="space-y-4">
      {/* Welcome and market status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Good {getTimeOfDayGreeting()}, Trader
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your portfolio today
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Market status */}
          <div className="flex items-center space-x-2">
            <Badge className={cn("flex items-center space-x-1", statusInfo.color)}>
              <statusInfo.icon className="h-3 w-3" />
              <span>{statusInfo.label}</span>
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })}
            </span>
          </div>

          {/* Quick actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Zap className="h-4 w-4 mr-1" />
              Quick Trade
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              Analyze
            </Button>
          </div>
        </div>
      </div>

      {/* Market indices overview */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {marketStats.indices.map((index) => (
              <div key={index.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{index.name}</h4>
                    <span className="text-xs text-muted-foreground">{index.symbol}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold">
                      ${index.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <div className={cn(
                      "flex items-center space-x-1 text-xs font-medium",
                      index.change >= 0 ? 'text-bull' : 'text-bear'
                    )}>
                      {index.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {index.change >= 0 ? '+' : ''}
                        {index.change.toFixed(2)} ({index.changePercent >= 0 ? '+' : ''}
                        {index.changePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Last updated: {new Date(marketStats.lastUpdate).toLocaleTimeString()}</span>
            </div>

            <Button variant="ghost" size="sm" className="text-xs">
              View All Markets
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()

  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}