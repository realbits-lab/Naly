'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Pin,
  Star,
  Send,
  Edit,
  Trash2,
  MoreVertical,
  Reply,
  ChevronUp,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Author {
  id: string
  name: string
  email: string
  image?: string
}

interface ArticleReply {
  id: string
  content: string
  author: Author
  likeCount: number
  isLiked?: boolean
  parentId?: string
  replies?: ArticleReply[]
  isEdited: boolean
  editedAt?: string
  createdAt: string
}

interface CommunityArticle {
  id: string
  title: string
  content: string
  excerpt?: string
  slug: string
  author: Author
  viewCount: number
  replyCount: number
  likeCount: number
  isLiked?: boolean
  isBookmarked?: boolean
  isPinned: boolean
  isFeatured: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
  tags?: string[]
}

interface ArticleViewerProps {
  article: CommunityArticle
  replies: ArticleReply[]
  isLoggedIn: boolean
  userLevel?: 'USER' | 'MANAGER'
  onBack: () => void
  onLikeArticle?: (articleId: string) => void
  onBookmarkArticle?: (articleId: string) => void
  onReplySubmit?: (content: string, parentId?: string) => void
  onLikeReply?: (replyId: string) => void
  onEditReply?: (replyId: string, content: string) => void
  onDeleteReply?: (replyId: string) => void
  loading?: boolean
}

export function ArticleViewer({
  article,
  replies,
  isLoggedIn,
  userLevel,
  onBack,
  onLikeArticle,
  onBookmarkArticle,
  onReplySubmit,
  onLikeReply,
  onEditReply,
  onDeleteReply,
  loading = false
}: ArticleViewerProps) {
  const [newReply, setNewReply] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingReply, setEditingReply] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [collapsedReplies, setCollapsedReplies] = useState<Set<string>>(new Set())
  const [deleteReplyId, setDeleteReplyId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const getAuthorInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSubmitReply = () => {
    if (!newReply.trim()) return

    onReplySubmit?.(newReply, replyingTo || undefined)
    setNewReply('')
    setReplyingTo(null)
  }

  const handleEditReply = (replyId: string) => {
    const reply = findReplyById(replies, replyId)
    if (reply) {
      setEditingReply(replyId)
      setEditContent(reply.content)
    }
  }

  const handleSaveEdit = () => {
    if (!editContent.trim() || !editingReply) return

    onEditReply?.(editingReply, editContent)
    setEditingReply(null)
    setEditContent('')
  }

  const findReplyById = (replies: ArticleReply[], id: string): ArticleReply | null => {
    for (const reply of replies) {
      if (reply.id === id) return reply
      if (reply.replies) {
        const found = findReplyById(reply.replies, id)
        if (found) return found
      }
    }
    return null
  }

  const toggleReplyCollapse = (replyId: string) => {
    const newCollapsed = new Set(collapsedReplies)
    if (newCollapsed.has(replyId)) {
      newCollapsed.delete(replyId)
    } else {
      newCollapsed.add(replyId)
    }
    setCollapsedReplies(newCollapsed)
  }

  const renderReply = (reply: ArticleReply, depth: number = 0) => {
    const isCollapsed = collapsedReplies.has(reply.id)
    const hasReplies = reply.replies && reply.replies.length > 0

    return (
      <div key={reply.id} className={`${depth > 0 ? 'ml-12' : ''}`}>
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reply.author.image} />
                  <AvatarFallback className="text-xs">
                    {getAuthorInitials(reply.author.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-sm">{reply.author.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(reply.createdAt)}
                    </span>
                    {reply.isEdited && (
                      <Badge variant="outline" className="text-xs">
                        Edited
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {isLoggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setReplyingTo(reply.id)}>
                      <Reply className="mr-2 h-4 w-4" />
                      Reply
                    </DropdownMenuItem>
                    {/* Show edit/delete for own replies or managers */}
                    {(userLevel === 'MANAGER' || reply.author.id === 'current-user-id') && (
                      <>
                        <DropdownMenuItem onClick={() => handleEditReply(reply.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteReplyId(reply.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {editingReply === reply.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your reply..."
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingReply(null)
                      setEditContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm mb-3 whitespace-pre-wrap">{reply.content}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLikeReply?.(reply.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Heart className={`h-4 w-4 mr-1 ${reply.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      {reply.likeCount}
                    </Button>
                    {isLoggedIn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(reply.id)}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                    )}
                  </div>

                  {hasReplies && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReplyCollapse(reply.id)}
                    >
                      {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      {reply.replies?.length} replies
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Reply form for this specific comment */}
            {replyingTo === reply.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <Textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSubmitReply}>
                    <Send className="h-4 w-4 mr-2" />
                    Reply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nested replies */}
        {hasReplies && !isCollapsed && (
          <div className="space-y-2">
            {reply.replies!.map(nestedReply => renderReply(nestedReply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Articles
      </Button>

      {/* Article */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {article.isPinned && (
                  <Badge variant="secondary">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
                {article.isFeatured && (
                  <Badge>
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {article.tags?.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              <CardTitle className="text-3xl mb-4">{article.title}</CardTitle>

              {/* Author and Date */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={article.author.image} />
                    <AvatarFallback>
                      {getAuthorInitials(article.author.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{article.author.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(article.publishedAt || article.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {article.viewCount} views
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {article.replyCount} replies
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLikeArticle?.(article.id)}
                className={article.isLiked ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 mr-1 ${article.isLiked ? 'fill-current' : ''}`} />
                {article.likeCount}
              </Button>
              {isLoggedIn && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBookmarkArticle?.(article.id)}
                  className={article.isBookmarked ? 'text-blue-500' : ''}
                >
                  <Bookmark className={`h-4 w-4 ${article.isBookmarked ? 'fill-current' : ''}`} />
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{
              __html: article.content.replace(/\n/g, '<br>')
            }}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Replies Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          Discussions ({replies.length})
        </h3>

        {/* New Reply Form */}
        {isLoggedIn ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <Textarea
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                placeholder="Join the discussion..."
                rows={3}
                className="mb-3"
              />
              <Button onClick={handleSubmitReply} disabled={!newReply.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Post Reply
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Please sign in to join the discussion
              </p>
            </CardContent>
          </Card>
        )}

        {/* Replies List */}
        {replies.length === 0 ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No replies yet. Be the first to share your thoughts!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {replies.map(reply => renderReply(reply))}
          </div>
        )}
      </div>

      {/* Delete Reply Confirmation */}
      <AlertDialog open={!!deleteReplyId} onOpenChange={() => setDeleteReplyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reply</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this reply? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteReplyId) {
                  onDeleteReply?.(deleteReplyId)
                  setDeleteReplyId(null)
                }
              }}
            >
              Delete Reply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}