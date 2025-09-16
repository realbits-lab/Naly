'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  MessageSquare,
  Trophy,
  Zap,
  Star,
  Target,
  TrendingUp,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommunityOverviewProps {
  userId: string
}

interface CommunityStats {
  totalDiscussions: number
  totalUsers: number
  activeUsers: number
  totalAchievements: number
  activeChallenges: number
  topContributors: any[]
}

interface UserCommunityProfile {
  userId: string
  totalPosts: number
  totalUpvotes: number
  totalAchievements: number
  communityRank: number
  joinedChallenges: number
  completedChallenges: number
  recentAchievements: any[]
  activeChallenges: any[]
}

export function CommunityOverview({ userId }: CommunityOverviewProps) {
  const [stats, setStats] = useState<CommunityStats | null>(null)
  const [userProfile, setUserProfile] = useState<UserCommunityProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCommunityData()
  }, [userId])

  const loadCommunityData = async () => {
    try {
      setLoading(true)

      // Load community stats and user profile
      const response = await fetch(`/api/community/stats?userId=${userId}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data.community)
        setUserProfile(data.data.user)
      }
    } catch (error) {
      console.error('Error loading community data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <CommunityOverview.Skeleton />
  }

  if (!stats || !userProfile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Unable to load community data
          </h3>
          <p className="text-sm text-muted-foreground">
            Please try refreshing the page
          </p>
        </CardContent>
      </Card>
    )
  }

  const getUserRankBadge = (rank: number) => {
    if (rank <= 10) return { variant: 'destructive' as const, label: 'Top 10' }
    if (rank <= 50) return { variant: 'secondary' as const, label: 'Top 50' }
    if (rank <= 100) return { variant: 'outline' as const, label: 'Top 100' }
    return { variant: 'outline' as const, label: `Rank ${rank}` }
  }

  const rankBadge = getUserRankBadge(userProfile.communityRank)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Community Stats */}
      <Card className="border-bull/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Users className="h-4 w-4 text-bull" />
            <span>Community</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Members</span>
              <span className="text-sm font-semibold">{stats.totalUsers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active Users</span>
              <span className="text-sm font-semibold text-bull">{stats.activeUsers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Discussions</span>
              <span className="text-sm font-semibold">{stats.totalDiscussions.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Rank */}
      <Card className="border-bear/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-bear" />
            <span>Your Rank</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={rankBadge.variant} className="text-xs">
                {rankBadge.label}
              </Badge>
              <Star className="h-4 w-4 text-bear" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Posts</span>
              <span className="text-sm font-semibold">{userProfile.totalPosts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Upvotes</span>
              <span className="text-sm font-semibold text-bull">{userProfile.totalUpvotes}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-neutral/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Award className="h-4 w-4 text-neutral" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Unlocked</span>
              <span className="text-sm font-semibold">{userProfile.totalAchievements}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Recent</span>
              <span className="text-sm font-semibold text-bull">{userProfile.recentAchievements.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Community Total</span>
              <span className="text-sm font-semibold">{stats.totalAchievements.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges */}
      <Card className="border-bull/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Target className="h-4 w-4 text-bull" />
            <span>Challenges</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="text-sm font-semibold">{userProfile.joinedChallenges}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Completed</span>
              <span className="text-sm font-semibold text-bull">{userProfile.completedChallenges}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Available</span>
              <span className="text-sm font-semibold">{stats.activeChallenges}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

CommunityOverview.Skeleton = function CommunityOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}