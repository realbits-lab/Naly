'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Target,
  Calendar,
  Users,
  Trophy,
  Clock,
  Star,
  Zap,
  TrendingUp,
  BookOpen,
  Award
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActiveChallengesProps {
  userId: string
}

interface Challenge {
  id: string
  title: string
  description: string
  category: string
  difficulty: string
  objectives: any
  rewards: any
  startDate?: Date
  endDate?: Date
  isActive: boolean
  participantCount: number
  completionCount: number
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export function ActiveChallenges({ userId }: ActiveChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/community/challenges?isActive=true&limit=6')
      const data = await response.json()

      if (data.success) {
        setChallenges(data.data.challenges)
      }
    } catch (error) {
      console.error('Error loading challenges:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/community/challenges/${challengeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join' })
      })

      const data = await response.json()

      if (data.success) {
        // Update challenge participant count locally
        setChallenges(prev => prev.map(challenge => {
          if (challenge.id === challengeId) {
            return {
              ...challenge,
              participantCount: challenge.participantCount + 1
            }
          }
          return challenge
        }))
      }
    } catch (error) {
      console.error('Error joining challenge:', error)
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return { variant: 'secondary' as const, color: 'text-green-600', label: 'Easy' }
      case 'MEDIUM': return { variant: 'outline' as const, color: 'text-yellow-600', label: 'Medium' }
      case 'HARD': return { variant: 'destructive' as const, color: 'text-orange-600', label: 'Hard' }
      case 'EXPERT': return { variant: 'destructive' as const, color: 'text-red-600', label: 'Expert' }
      default: return { variant: 'outline' as const, color: 'text-gray-600', label: 'Unknown' }
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'trading': return TrendingUp
      case 'learning': return BookOpen
      case 'community': return Users
      case 'analysis': return Target
      default: return Trophy
    }
  }

  const formatTimeRemaining = (endDate?: Date) => {
    if (!endDate) return 'No deadline'

    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }

  const getCompletionRate = (challenge: Challenge) => {
    if (challenge.participantCount === 0) return 0
    return Math.round((challenge.completionCount / challenge.participantCount) * 100)
  }

  if (loading) {
    return <ActiveChallenges.Skeleton />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Target className="h-5 w-5 text-bull" />
            <span>Active Challenges</span>
          </CardTitle>

          <Button variant="outline" size="sm" asChild>
            <Link href="/community/challenges">
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {challenges.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No active challenges
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back later for new challenges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((challenge) => {
              const difficultyBadge = getDifficultyBadge(challenge.difficulty)
              const CategoryIcon = getCategoryIcon(challenge.category)
              const completionRate = getCompletionRate(challenge)
              const timeRemaining = formatTimeRemaining(challenge.endDate)

              return (
                <Card key={challenge.id} className="border hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-bull/10">
                          <CategoryIcon className="h-4 w-4 text-bull" />
                        </div>
                        <div>
                          <Badge variant={difficultyBadge.variant} className="text-xs">
                            {difficultyBadge.label}
                          </Badge>
                        </div>
                      </div>
                      {challenge.endDate && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{timeRemaining}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                        {challenge.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {challenge.description}
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Progress/Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Completion Rate</span>
                          <span className="font-semibold">{completionRate}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </div>

                      {/* Participants */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{challenge.participantCount} participants</span>
                        </div>
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Trophy className="h-3 w-3" />
                          <span>{challenge.completionCount} completed</span>
                        </div>
                      </div>

                      {/* Rewards Preview */}
                      {challenge.rewards && (
                        <div className="flex items-center space-x-1 text-xs">
                          <Award className="h-3 w-3 text-bull" />
                          <span className="text-muted-foreground">Rewards:</span>
                          <Badge variant="outline" className="text-xs">
                            {challenge.rewards.points || '0'} pts
                          </Badge>
                          {challenge.rewards.badge && (
                            <Badge variant="secondary" className="text-xs">
                              Badge
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => joinChallenge(challenge.id)}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          Join Challenge
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {challenges.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-bull">{challenges.length}</div>
                <div className="text-xs text-muted-foreground">Active Challenges</div>
              </div>
              <div>
                <div className="text-lg font-bold text-bear">
                  {challenges.reduce((sum, c) => sum + c.participantCount, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Participants</div>
              </div>
              <div>
                <div className="text-lg font-bold text-neutral">
                  {challenges.reduce((sum, c) => sum + c.completionCount, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Completions</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

ActiveChallenges.Skeleton = function ActiveChallengesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>

                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>

                <div className="flex items-center space-x-2">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-5 w-12" />
                </div>

                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}