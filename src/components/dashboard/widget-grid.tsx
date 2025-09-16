'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { MarketOverview } from './widgets/market-overview'
import { PortfolioSummary } from './widgets/portfolio-summary'
import { RecentNarratives } from './widgets/recent-narratives'
import { PredictionHighlights } from './widgets/prediction-highlights'
import { WatchlistWidget } from './widgets/watchlist'
import { PersonalizedInsights } from './widgets/personalized-insights'

interface WidgetConfig {
  id: string
  type: string
  position: {
    x: number
    y: number
    w: number
    h: number
  }
  config: Record<string, any>
}

interface WidgetGridProps {
  userId: string
  defaultWidgets: WidgetConfig[]
  editable?: boolean
  className?: string
}

export function WidgetGrid({ userId, defaultWidgets, editable = false, className }: WidgetGridProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultWidgets)
  const [isEditing, setIsEditing] = useState(false)

  const renderWidget = useCallback((widget: WidgetConfig) => {
    const commonProps = {
      key: widget.id,
      userId,
      config: widget.config,
      className: cn(
        "rounded-lg border bg-card transition-all duration-200",
        isEditing && "border-dashed border-muted-foreground/50 hover:border-primary",
        getWidgetSizeClasses(widget.position)
      )
    }

    switch (widget.type) {
      case 'MARKET_OVERVIEW':
        return <MarketOverview {...commonProps} />
      case 'PORTFOLIO_SUMMARY':
        return <PortfolioSummary {...commonProps} />
      case 'RECENT_NARRATIVES':
        return <RecentNarratives {...commonProps} />
      case 'PREDICTION_HIGHLIGHTS':
        return <PredictionHighlights {...commonProps} />
      case 'WATCHLIST':
        return <WatchlistWidget {...commonProps} />
      case 'PERSONALIZED_INSIGHTS':
        return <PersonalizedInsights {...commonProps} />
      default:
        return (
          <div {...commonProps}>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Unknown widget type: {widget.type}
              </p>
            </div>
          </div>
        )
    }
  }, [userId, isEditing])

  const getWidgetSizeClasses = (position: WidgetConfig['position']) => {
    const { w, h } = position

    // Convert grid units to CSS classes
    const widthClasses = {
      1: 'col-span-1',
      2: 'col-span-2',
      3: 'col-span-3',
      4: 'col-span-4',
      5: 'col-span-5',
      6: 'col-span-6',
      7: 'col-span-7',
      8: 'col-span-8',
      9: 'col-span-9',
      10: 'col-span-10',
      11: 'col-span-11',
      12: 'col-span-12',
    }

    const heightClasses = {
      1: 'h-32',
      2: 'h-64',
      3: 'h-96',
      4: 'h-[32rem]',
      5: 'h-[40rem]',
    }

    return cn(
      widthClasses[w as keyof typeof widthClasses] || 'col-span-4',
      heightClasses[h as keyof typeof heightClasses] || 'h-64'
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Grid controls */}
      {editable && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">Dashboard Widgets</h2>
            <span className="text-sm text-muted-foreground">
              ({widgets.length} widgets)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                isEditing
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {isEditing ? 'Done' : 'Edit Layout'}
            </button>
          </div>
        </div>
      )}

      {/* Widget grid */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {widgets.map(renderWidget)}
      </div>

      {/* Empty state */}
      {widgets.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No widgets configured
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add widgets to personalize your dashboard experience
            </p>
            <button className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              Add Widget
            </button>
          </div>
        </div>
      )}

      {/* Editing overlay */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/20 z-10 pointer-events-none" />
      )}
    </div>
  )
}