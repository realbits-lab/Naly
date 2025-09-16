'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  TrendingUp,
  Sparkles,
  BarChart3,
  Users,
  Clock,
  ArrowRight
} from 'lucide-react'

export function NarrativeHero() {
  const [stats, setStats] = useState({
    totalNarratives: 0,
    activeReaders: 0,
    storiesThisWeek: 0
  })

  useEffect(() => {
    // Simulate loading stats
    const timer = setTimeout(() => {
      setStats({
        totalNarratives: 1247,
        activeReaders: 8934,
        storiesThisWeek: 152
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Stories',
      description: 'Transform raw market data into compelling narratives'
    },
    {
      icon: BarChart3,
      title: 'Interactive Visualizations',
      description: 'Rich charts and graphs that bring stories to life'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Insights',
      description: 'Stay updated with the latest market developments'
    }
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-bull/5 via-background to-bear/5" />

      {/* Content */}
      <div className="relative">
        <Card className="border-0 bg-transparent">
          <CardContent className="pt-12 pb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Hero Text */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-bull/10 text-bull border-bull/20 hover:bg-bull/20">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI-Powered Financial Storytelling
                  </Badge>

                  <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                    Discover Market{' '}
                    <span className="bg-gradient-to-r from-bull to-bear bg-clip-text text-transparent">
                      Stories
                    </span>
                  </h1>

                  <p className="text-xl text-muted-foreground max-w-lg">
                    Transform complex financial data into engaging narratives with AI-powered
                    insights, interactive visualizations, and personalized content.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-bull hover:bg-bull/90 text-white font-semibold px-8"
                  >
                    <BookOpen className="h-5 w-5 mr-2" />
                    Explore Stories
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold px-8"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Your Story
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 pt-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bull">
                      {stats.totalNarratives.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Stories
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-bull">
                      {stats.activeReaders.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Readers
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-bull">
                      {stats.storiesThisWeek}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      This Week
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Features */}
              <div className="space-y-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon

                  return (
                    <Card key={index} className="border-muted/50 hover:border-bull/20 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-lg bg-bull/10 flex items-center justify-center">
                              <Icon className="h-6 w-6 text-bull" />
                            </div>
                          </div>

                          <div className="flex-1 space-y-2">
                            <h3 className="font-semibold">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}

                {/* Live Activity Indicator */}
                <Card className="border-bull/20 bg-bull/5">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-bull rounded-full animate-pulse" />
                        <span className="text-sm font-medium text-bull">Live</span>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>234 reading now</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>5 stories published today</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}