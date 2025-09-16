import { Suspense } from 'react'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { NarrativesShell } from '@/components/narratives/narratives-shell'
import { NarrativeFilters } from '@/components/narratives/narrative-filters'
import { NarrativeGrid } from '@/components/narratives/narrative-grid'
import { NarrativeHero } from '@/components/narratives/narrative-hero'
import { FeaturedNarratives } from '@/components/narratives/featured-narratives'
import { TrendingTopics } from '@/components/narratives/trending-topics'
import { Skeleton } from '@/components/ui/skeleton'

interface SearchParams {
  category?: string
  sentiment?: string
  timeframe?: string
  complexity?: string
  ticker?: string
  page?: string
}

interface NarrativesPageProps {
  searchParams: SearchParams
}

export default async function NarrativesPage({ searchParams }: NarrativesPageProps) {
  const session = await auth()
  const isAuthenticated = !!session?.user

  const filters = {
    category: searchParams.category || 'all',
    sentiment: searchParams.sentiment || 'all',
    timeframe: searchParams.timeframe || 'all',
    complexity: searchParams.complexity || 'all',
    ticker: searchParams.ticker || '',
    page: parseInt(searchParams.page || '1', 10)
  }

  return (
    <NarrativesShell>
      <div className="space-y-8">
        {/* Hero Section */}
        <NarrativeHero />

        {/* Featured Narratives */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Featured Stories</h2>
            <p className="text-muted-foreground">
              AI-generated insights from market movements
            </p>
          </div>

          <Suspense fallback={<FeaturedNarrativesSkeleton />}>
            <FeaturedNarratives userId={session?.user?.id} />
          </Suspense>
        </section>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Suspense fallback={<FiltersSkeleton />}>
              <NarrativeFilters
                filters={filters}
                isAuthenticated={isAuthenticated}
              />
            </Suspense>

            <Suspense fallback={<TrendingTopicsSkeleton />}>
              <TrendingTopics />
            </Suspense>
          </div>

          {/* Narratives Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  {filters.category !== 'all'
                    ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)} Narratives`
                    : 'All Narratives'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filters.ticker
                    ? `Stories about ${filters.ticker.toUpperCase()}`
                    : 'Discover market insights and predictions'
                  }
                </p>
              </div>

              {isAuthenticated && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Personalized for you
                  </span>
                  <div className="w-2 h-2 bg-bull rounded-full animate-pulse" />
                </div>
              )}
            </div>

            <Suspense fallback={<NarrativeGridSkeleton />}>
              <NarrativeGrid
                filters={filters}
                userId={session?.user?.id}
                isAuthenticated={isAuthenticated}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </NarrativesShell>
  )
}

function FeaturedNarrativesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-20" />
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </div>
  )
}

function TrendingTopicsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-24" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  )
}

function NarrativeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-64 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}