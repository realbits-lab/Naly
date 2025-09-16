'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Trophy,
  Crown,
  Medal,
  Star,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  userId: string
  user: {
    id: string
    name: string
    avatarUrl?: string
  }
  score: number
  rank: number
  metadata?: any
}

export function TopContributors() {
  const [contributors, setContributors] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('monthly')

  useEffect(() => {
    loadContributors()
  }, [period])

  const loadContributors = async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/community/leaderboards?type=community_points&period=${period}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setContributors(data.data.leaderboard)
      }
    } catch (error) {
      console.error('Error loading contributors:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return Crown
      case 2: case 3: return Medal
      default: return Trophy
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500'
      case 2: return 'text-gray-400'
      case 3: return 'text-yellow-600'
      default: return 'text-muted-foreground'
    }
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'daily': return 'Today'
      case 'weekly': return 'This Week'
      case 'monthly': return 'This Month'
      case 'all_time': return 'All Time'
      default: return period
    }
  }

  if (loading) {
    return <TopContributors.Skeleton />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-bull" />
            <span>Top Contributors</span>
          </CardTitle>

          <div className="flex items-center border rounded-md">
            <Button
              variant={period === 'weekly' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPeriod('weekly')}
            >
              Week
            </Button>
            <Button
              variant={period === 'monthly' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPeriod('monthly')}
            >
              Month
            </Button>
            <Button
              variant={period === 'all_time' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPeriod('all_time')}
            >
              All
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {getPeriodLabel(period)} • Community Points
        </p>
      </CardHeader>

      <CardContent>
        {contributors.length === 0 ? (
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No contributors yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contributors.map((contributor, index) => {
              const RankIcon = getRankIcon(contributor.rank)
              const rankColor = getRankColor(contributor.rank)

              return (
                <div
                  key={contributor.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
                    contributor.rank <= 3 && "bg-gradient-to-r",
                    contributor.rank === 1 && "from-yellow-50 to-yellow-100/50 border border-yellow-200",
                    contributor.rank === 2 && "from-gray-50 to-gray-100/50 border border-gray-200",
                    contributor.rank === 3 && "from-yellow-50 to-orange-100/50 border border-orange-200"
                  )}
                >
                  {/* Rank */}
                  <div className="flex items-center justify-center w-8">
                    {contributor.rank <= 3 ? (
                      <RankIcon className={cn("h-4 w-4", rankColor)} />
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground">
                        {contributor.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar & Name */}
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={contributor.user.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {contributor.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {contributor.user.name}
                      </p>
                      {contributor.rank <= 3 && (
                        <p className="text-xs text-muted-foreground">
                          Top Contributor
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-sm font-semibold text-bull">
                      {contributor.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">points</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {contributors.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/community/leaderboards">
                <Trophy className="h-3 w-3 mr-1" />
                View Full Leaderboard
              </Link>
            </Button>
          </div>
        )}

        {/* Period Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm font-semibold text-bull">
                {contributors.reduce((sum, c) => sum + c.score, 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-bear">
                {contributors.length}
              </div>
              <div className="text-xs text-muted-foreground">Contributors</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

TopContributors.Skeleton = function TopContributorsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="flex items-center border rounded-md">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-7 w-14" />
            <Skeleton className="h-7 w-8" />
          </div>
        </div>
        <Skeleton className="h-3 w-32 mt-1" />
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <Skeleton className="h-8 w-full" />
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-1">
              <Skeleton className="h-4 w-12 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-8 mx-auto" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}