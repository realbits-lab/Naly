'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronUp,
  ChevronDown,
  Reply,
  MoreHorizontal,
  Pin,
  Tag,
  User
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeaturedDiscussionsProps {
  userId: string
}

interface Discussion {
  id: string
  parentId?: string
  authorId: string
  author?: {
    id: string
    name: string
    avatarUrl?: string
    role?: string
    communityRank?: number
    totalPoints?: number
  }
  title?: string
  content: string
  relatedEventId?: string
  relatedTicker?: string
  upvotes: number
  downvotes: number
  replyCount: number
  lastActivityAt: Date
  isSticky: boolean
  isLocked: boolean
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  userVote?: 'up' | 'down'
  isBookmarked?: boolean
}

export function FeaturedDiscussions({ userId }: FeaturedDiscussionsProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'controversial'>('popular')

  useEffect(() => {
    loadDiscussions()
  }, [sortBy])

  const loadDiscussions = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        sortBy,
        limit: '10'
      })

      const response = await fetch(`/api/community/discussions?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setDiscussions(data.data.discussions)
      }
    } catch (error) {
      console.error('Error loading discussions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (discussionId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/community/discussions/${discussionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'vote',
          voteType
        })
      })

      const data = await response.json()

      if (data.success) {
        // Update the discussion in local state
        setDiscussions(prev => prev.map(discussion => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              upvotes: voteType === 'up' ? discussion.upvotes + 1 : discussion.upvotes,
              downvotes: voteType === 'down' ? discussion.downvotes + 1 : discussion.downvotes,
              userVote: voteType
            }
          }
          return discussion
        }))
      }
    } catch (error) {
      console.error('Error voting on discussion:', error)
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getNetScore = (discussion: Discussion) => {
    return discussion.upvotes - discussion.downvotes
  }

  if (loading) {
    return <FeaturedDiscussions.Skeleton />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-bull" />
            <span>Community Discussions</span>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={sortBy === 'latest' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setSortBy('latest')}
              >
                Latest
              </Button>
              <Button
                variant={sortBy === 'popular' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setSortBy('popular')}
              >
                Popular
              </Button>
              <Button
                variant={sortBy === 'controversial' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setSortBy('controversial')}
              >
                Hot
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-0">
          {discussions.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No discussions yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Be the first to start a conversation!
              </p>
            </div>
          ) : (
            discussions.map((discussion, index) => (
              <div
                key={discussion.id}
                className={cn(
                  "flex items-start space-x-4 p-6 border-b last:border-b-0 hover:bg-muted/30 transition-colors",
                  discussion.isSticky && "bg-bull/5 border-bull/20"
                )}
              >
                {/* Vote Controls */}
                <div className="flex flex-col items-center space-y-1 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 hover:bg-bull/10",
                      discussion.userVote === 'up' && "text-bull bg-bull/10"
                    )}
                    onClick={() => handleVote(discussion.id, 'up')}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>

                  <span className={cn(
                    "text-xs font-semibold tabular-nums",
                    getNetScore(discussion) > 0 && "text-bull",
                    getNetScore(discussion) < 0 && "text-bear"
                  )}>
                    {getNetScore(discussion)}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0 hover:bg-bear/10",
                      discussion.userVote === 'down' && "text-bear bg-bear/10"
                    )}
                    onClick={() => handleVote(discussion.id, 'down')}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {discussion.isSticky && (
                      <Pin className="h-4 w-4 text-bull" />
                    )}

                    {discussion.relatedTicker && (
                      <Badge variant="outline" className="text-xs font-mono">
                        {discussion.relatedTicker}
                      </Badge>
                    )}

                    {discussion.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Link href={`/community/discussions/${discussion.id}`}>
                    <h3 className="font-semibold text-base hover:text-bull transition-colors cursor-pointer line-clamp-1 mb-2">
                      {discussion.title || 'Community Discussion'}
                    </h3>
                  </Link>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {discussion.content}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={discussion.author?.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {discussion.author?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{discussion.author?.name || 'Anonymous'}</span>
                        {discussion.author?.role === 'ADMIN' && (
                          <Badge variant="secondary" className="text-xs">Admin</Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(discussion.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Reply className="h-3 w-3" />
                        <span>{discussion.replyCount} replies</span>
                      </div>

                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {discussions.length > 0 && (
          <div className="p-6 border-t">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/community/discussions">
                View All Discussions
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

FeaturedDiscussions.Skeleton = function FeaturedDiscussionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-0">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-6 border-b last:border-b-0">
              <div className="flex flex-col items-center space-y-1 pt-1">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-6 w-6" />
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}