'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  FileText,
  MessageCircle,
  Heart,
  Eye,
  Calendar,
  User,
  Pin,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Author {
  id: string
  name: string
  email: string
  image?: string
}

interface CommunityArticle {
  id: string
  title: string
  excerpt?: string
  slug: string
  author: Author
  viewCount: number
  replyCount: number
  likeCount: number
  isPublished: boolean
  isPinned: boolean
  isFeatured: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
  tags?: string[]
}

interface ArticleListProps {
  sectionId: string | null
  sectionTitle?: string
  articles: CommunityArticle[]
  currentPage: number
  totalPages: number
  totalCount: number
  loading: boolean
  isLoggedIn: boolean
  userLevel?: 'USER' | 'MANAGER'
  canWrite: boolean
  onPageChange: (page: number) => void
  onArticleClick: (article: CommunityArticle) => void
  onCreateArticle?: () => void
  onEditArticle?: (article: CommunityArticle) => void
  onDeleteArticle?: (articleId: string) => void
}

export function ArticleList({
  sectionId,
  sectionTitle,
  articles,
  currentPage,
  totalPages,
  totalCount,
  loading,
  isLoggedIn,
  userLevel,
  canWrite,
  onPageChange,
  onArticleClick,
  onCreateArticle,
  onEditArticle,
  onDeleteArticle
}: ArticleListProps) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!sectionId) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Welcome to Community</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Select a section from the sidebar to explore articles and discussions.
          {isLoggedIn && ' You can also create new articles and join conversations.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {sectionTitle || 'Articles'}
          </h1>
          <p className="text-muted-foreground">
            {totalCount} article{totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {canWrite && (
          <Button onClick={onCreateArticle}>
            <Plus className="h-4 w-4 mr-2" />
            Write Article
          </Button>
        )}
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              {canWrite
                ? 'Be the first to share your thoughts in this section!'
                : 'No articles have been published in this section yet.'
              }
            </p>
            {canWrite && (
              <Button onClick={onCreateArticle}>
                <Plus className="h-4 w-4 mr-2" />
                Write First Article
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onArticleClick(article)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      {article.isPinned && (
                        <Badge variant="secondary" className="text-xs">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {article.isFeatured && (
                        <Badge className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex space-x-1">
                          {article.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-xl line-clamp-2 hover:text-primary">
                      {article.title}
                    </CardTitle>
                    {article.excerpt && (
                      <CardDescription className="line-clamp-2 mt-2">
                        {article.excerpt}
                      </CardDescription>
                    )}
                  </div>

                  {(userLevel === 'MANAGER' || (isLoggedIn && article.author.id === 'current-user-id')) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onEditArticle?.(article)
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Article
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteArticle?.(article.id)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Article
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={article.author.image} />
                        <AvatarFallback className="text-xs">
                          {getAuthorInitials(article.author.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{article.author.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.viewCount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{article.replyCount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{article.likeCount}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                if (pageNum <= totalPages) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => onPageChange(pageNum)}
                        isActive={pageNum === currentPage}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                }
                return null
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}