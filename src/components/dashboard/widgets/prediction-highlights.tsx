'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BrainCircuit, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { useState, useEffect } from 'react'

interface PredictionHighlightsProps {
  userId: string
  config?: {
    maxItems?: number
    confidenceThreshold?: number
  }
  className?: string
}

interface Prediction {
  id: string
  ticker: string
  direction: 'up' | 'down' | 'sideways'
  currentPrice: number
  targetPrice: number
  confidence: number
  timeframe: string
  expectedReturn: number
}

export function PredictionHighlights({ userId, config = {}, className }: PredictionHighlightsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)

  const { maxItems = 3, confidenceThreshold = 0.7 } = config

  useEffect(() => {
    loadPredictions()
  }, [])

  const loadPredictions = async () => {
    try {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockPredictions: Prediction[] = [
        {
          id: '1',
          ticker: 'AAPL',
          direction: 'up',
          currentPrice: 189.45,
          targetPrice: 205.00,
          confidence: 0.85,
          timeframe: '3M',
          expectedReturn: 8.2
        },
        {
          id: '2',
          ticker: 'TSLA',
          direction: 'down',
          currentPrice: 252.18,
          targetPrice: 220.00,
          confidence: 0.72,
          timeframe: '2M',
          expectedReturn: -12.8
        },
        {
          id: '3',
          ticker: 'NVDA',
          direction: 'up',
          currentPrice: 875.32,
          targetPrice: 950.00,
          confidence: 0.78,
          timeframe: '6M',
          expectedReturn: 8.5
        }
      ]

      setPredictions(mockPredictions.filter(p => p.confidence >= confidenceThreshold).slice(0, maxItems))
    } catch (error) {
      console.error('Error loading predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Prediction Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
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
          <BrainCircuit className="h-4 w-4" />
          <span>AI Predictions</span>
        </CardTitle>
        <Badge variant="outline" className="text-xs">High Confidence</Badge>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{prediction.ticker}</span>
                  {prediction.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-bull" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-bear" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  ${prediction.currentPrice} → ${prediction.targetPrice}
                </div>
              </div>

              <div className="text-right">
                <div className={`text-sm font-medium ${prediction.expectedReturn >= 0 ? 'text-bull' : 'text-bear'}`}>
                  {prediction.expectedReturn >= 0 ? '+' : ''}{prediction.expectedReturn.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(prediction.confidence * 100)}% • {prediction.timeframe}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button variant="ghost" size="sm" className="w-full mt-4 text-xs">
          <Target className="h-3 w-3 mr-1" />
          View All Predictions
        </Button>
      </CardContent>
    </Card>
  )
}