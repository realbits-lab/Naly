'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, AlertTriangle, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PersonalizedInsightsProps {
  userId: string
  config?: {
    showActionable?: boolean
    maxInsights?: number
  }
  className?: string
}

export function PersonalizedInsights({ userId, config = {}, className }: PersonalizedInsightsProps) {
  const [insights, setInsights] = useState<any[]>([])

  const { showActionable = true, maxInsights = 6 } = config

  useEffect(() => {
    // Mock insights
    setInsights([
      {
        id: '1',
        type: 'opportunity',
        title: 'Consider rebalancing your tech allocation',
        description: 'Your tech exposure is 65% vs. recommended 45%',
        priority: 'medium',
        actionable: true
      },
      {
        id: '2',
        type: 'risk',
        title: 'High correlation risk detected',
        description: 'AAPL and MSFT positions move together 89% of the time',
        priority: 'high',
        actionable: true
      }
    ])
  }, [])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return TrendingUp
      case 'risk': return AlertTriangle
      case 'target': return Target
      default: return Lightbulb
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Lightbulb className="h-4 w-4" />
          <span>Personalized Insights</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight) => {
            const Icon = getInsightIcon(insight.type)
            return (
              <div key={insight.id} className="p-3 rounded-lg bg-muted/30">
                <div className="flex items-start space-x-3">
                  <Icon className="h-4 w-4 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    <Badge variant="outline" className="text-xs mt-2 capitalize">
                      {insight.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}