'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Eye,
  RefreshCw,
  BarChart3
} from 'lucide-react'

interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface NewsAlert {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  source: string
}

export function MonitorPanel() {
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: 'SPY', price: 432.15, change: 2.34, changePercent: 0.54, volume: 45234567 },
    { symbol: 'QQQ', price: 378.92, change: -1.23, changePercent: -0.32, volume: 23456789 },
    { symbol: 'TSLA', price: 245.67, change: 8.45, changePercent: 3.56, volume: 34567890 },
    { symbol: 'AAPL', price: 189.43, change: -0.87, changePercent: -0.46, volume: 56789012 },
  ])

  const [newsAlerts, setNewsAlerts] = useState<NewsAlert[]>([
    {
      id: '1',
      title: 'Federal Reserve signals potential rate adjustment',
      severity: 'high',
      timestamp: '2 min ago',
      source: 'Reuters'
    },
    {
      id: '2',
      title: 'Tech sector earnings exceed expectations',
      severity: 'medium',
      timestamp: '15 min ago',
      source: 'MarketWatch'
    },
    {
      id: '3',
      title: 'Oil prices volatile on supply concerns',
      severity: 'medium',
      timestamp: '1 hour ago',
      source: 'Bloomberg'
    }
  ])

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1000)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Real-time Monitoring</h1>
            <p className="text-muted-foreground mt-1">
              Track market movements, news alerts, and performance metrics
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="space-y-6">
          {/* Market Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Market Overview</span>
              </CardTitle>
              <CardDescription>
                Real-time market data for key financial instruments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketData.map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">{item.symbol}</div>
                      <div className="text-2xl font-bold">${item.price.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center ${
                        item.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.change >= 0 ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {item.change >= 0 ? '+' : ''}
                        {item.change.toFixed(2)}
                      </div>
                      <div className={`text-sm ${
                        item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ({item.changePercent >= 0 ? '+' : ''}
                        {item.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* News Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <span>News Alerts</span>
              </CardTitle>
              <CardDescription>
                Breaking news and market-moving events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {newsAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Zap className="h-4 w-4 mt-1 text-yellow-500" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.source} • {alert.timestamp}
                        </span>
                      </div>
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Performance Metrics</span>
              </CardTitle>
              <CardDescription>
                Article generation and engagement statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">47</div>
                  <div className="text-sm text-muted-foreground">Articles Generated</div>
                  <div className="text-xs text-green-600 mt-1">+12% this week</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">2.4K</div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                  <div className="text-xs text-green-600 mt-1">+8% this week</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">94%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Score</div>
                  <div className="text-xs text-green-600 mt-1">+2% this week</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Quick Actions</span>
              </CardTitle>
              <CardDescription>
                Monitor specific symbols or create alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Add Symbol
                </Button>
                <Button variant="outline" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}