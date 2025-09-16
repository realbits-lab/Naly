import { Suspense } from 'react'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { WidgetGrid } from '@/components/dashboard/widget-grid'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { MarketOverview } from '@/components/dashboard/widgets/market-overview'
import { PortfolioSummary } from '@/components/dashboard/widgets/portfolio-summary'
import { RecentNarratives } from '@/components/dashboard/widgets/recent-narratives'
import { PredictionHighlights } from '@/components/dashboard/widgets/prediction-highlights'
import { WatchlistWidget } from '@/components/dashboard/widgets/watchlist'
import { PersonalizedInsights } from '@/components/dashboard/widgets/personalized-insights'
import { Skeleton } from '@/components/ui/skeleton'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const defaultWidgets = [
    {
      id: 'market-overview',
      type: 'MARKET_OVERVIEW',
      position: { x: 0, y: 0, w: 4, h: 2 },
      config: { showIndices: true, showCommodities: false }
    },
    {
      id: 'portfolio-summary',
      type: 'PORTFOLIO_SUMMARY',
      position: { x: 4, y: 0, w: 4, h: 2 },
      config: { showPerformance: true, showAllocation: true }
    },
    {
      id: 'watchlist',
      type: 'WATCHLIST',
      position: { x: 8, y: 0, w: 4, h: 2 },
      config: { maxItems: 8, showPriceChange: true }
    },
    {
      id: 'recent-narratives',
      type: 'RECENT_NARRATIVES',
      position: { x: 0, y: 2, w: 6, h: 3 },
      config: { maxItems: 4, showSummary: true }
    },
    {
      id: 'prediction-highlights',
      type: 'PREDICTION_HIGHLIGHTS',
      position: { x: 6, y: 2, w: 6, h: 3 },
      config: { maxItems: 3, confidenceThreshold: 0.7 }
    },
    {
      id: 'personalized-insights',
      type: 'PERSONALIZED_INSIGHTS',
      position: { x: 0, y: 5, w: 12, h: 2 },
      config: { showActionable: true, maxInsights: 6 }
    }
  ]

  return (
    <DashboardShell>
      <div className="space-y-6">
        <DashboardHeader userId={session.user.id} />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Dashboard Content */}
          <div className="flex-1">
            <Suspense fallback={<DashboardSkeleton />}>
              <WidgetGrid
                userId={session.user.id}
                defaultWidgets={defaultWidgets}
                editable={true}
              />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-4">
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              <QuickActions userId={session.user.id} />
            </Suspense>

            {/* Additional widgets can be placed here */}
            <div className="space-y-4">
              <Suspense fallback={<Skeleton className="h-48 w-full" />}>
                <MarketOverview compact={true} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-2">
          <Skeleton className="h-48 w-full" />
        </div>
      ))}
    </div>
  )
}