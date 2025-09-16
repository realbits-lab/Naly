'use client'

import { useState, useEffect } from 'react'
import { CommunitySidebar } from './community-sidebar'
import { ArticleList } from './article-list'
import { ArticleViewer } from './article-viewer'
import { ArticleWriter } from './article-writer'
import { ManagerSettings } from './manager-settings'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommunitySection {
  id: string
  title: string
  description?: string
  slug: string
  icon?: string
  color?: string
  displayOrder: number
  isActive: boolean
  isPublic: boolean
  articleCount?: number
  createdAt: string
}

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
  content: string
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

interface CommunityLayoutProps {
  initialSections?: CommunitySection[]
  userLevel?: 'USER' | 'MANAGER'
  isLoggedIn: boolean
  userId?: string
}

export function CommunityLayout({
  initialSections = [],
  userLevel,
  isLoggedIn,
  userId
}: CommunityLayoutProps) {
  const [sections, setSections] = useState<CommunitySection[]>(initialSections)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedSectionSlug, setSelectedSectionSlug] = useState<string | null>(null)
  const [articles, setArticles] = useState<CommunityArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<CommunityArticle | null>(null)
  const [articleReplies, setArticleReplies] = useState<ArticleReply[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [view, setView] = useState<'list' | 'article' | 'write' | 'settings'>('list')
  const [editingArticle, setEditingArticle] = useState<CommunityArticle | null>(null)

  // Load initial data
  useEffect(() => {
    if (initialSections.length === 0) {
      fetchSections()
    }
  }, [])

  // Load articles when section changes
  useEffect(() => {
    if (selectedSectionId) {
      fetchArticles(selectedSectionId, currentPage)
    }
  }, [selectedSectionId, currentPage])

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/community/sections')
      if (response.ok) {
        const data = await response.json()
        setSections(data.sections)
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    }
  }

  const fetchArticles = async (sectionId: string, page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sectionId,
        page: page.toString(),
        limit: '10'
      })

      const response = await fetch(`/api/community/articles?${params}`)
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
        setTotalPages(data.pagination.totalPages)
        setTotalCount(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchArticleReplies = async (articleId: string) => {
    try {
      const response = await fetch(`/api/community/articles/${articleId}/replies`)
      if (response.ok) {
        const data = await response.json()
        setArticleReplies(data.replies)
      }
    } catch (error) {
      console.error('Failed to fetch replies:', error)
    }
  }

  const handleSectionSelect = (sectionId: string, slug: string) => {
    setSelectedSectionId(sectionId)
    setSelectedSectionSlug(slug)
    setCurrentPage(1)
    setView('list')
    setSelectedArticle(null)
    setSidebarOpen(false) // Close sidebar on mobile
  }

  const handleArticleClick = (article: CommunityArticle) => {
    setSelectedArticle(article)
    setView('article')
    fetchArticleReplies(article.id)

    // Track article view
    trackArticleView(article.id)
  }

  const handleBackToList = () => {
    setView('list')
    setSelectedArticle(null)
    setArticleReplies([])
    setEditingArticle(null)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const trackArticleView = async (articleId: string) => {
    try {
      await fetch(`/api/community/articles/${articleId}/view`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Failed to track view:', error)
    }
  }

  // Article actions
  const handleLikeArticle = async (articleId: string) => {
    if (!isLoggedIn) return

    try {
      const response = await fetch(`/api/community/articles/${articleId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()

        // Update article in list
        setArticles(prev => prev.map(article =>
          article.id === articleId
            ? { ...article, isLiked: data.isLiked, likeCount: data.likeCount }
            : article
        ))

        // Update selected article if viewing
        if (selectedArticle?.id === articleId) {
          setSelectedArticle(prev => prev ? {
            ...prev,
            isLiked: data.isLiked,
            likeCount: data.likeCount
          } : null)
        }
      }
    } catch (error) {
      console.error('Failed to like article:', error)
    }
  }

  const handleReplySubmit = async (content: string, parentId?: string) => {
    if (!isLoggedIn || !selectedArticle) return

    try {
      const response = await fetch(`/api/community/articles/${selectedArticle.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId })
      })

      if (response.ok) {
        const data = await response.json()

        // Refresh replies
        fetchArticleReplies(selectedArticle.id)

        // Update reply count in article
        setSelectedArticle(prev => prev ? {
          ...prev,
          replyCount: prev.replyCount + 1
        } : null)
      }
    } catch (error) {
      console.error('Failed to submit reply:', error)
    }
  }

  const handleLikeReply = async (replyId: string) => {
    if (!isLoggedIn) return

    try {
      const response = await fetch(`/api/community/replies/${replyId}/like`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()

        // Update reply in the list
        const updateReply = (replies: ArticleReply[]): ArticleReply[] => {
          return replies.map(reply => {
            if (reply.id === replyId) {
              return { ...reply, isLiked: data.isLiked, likeCount: data.likeCount }
            }
            if (reply.replies) {
              return { ...reply, replies: updateReply(reply.replies) }
            }
            return reply
          })
        }

        setArticleReplies(prev => updateReply(prev))
      }
    } catch (error) {
      console.error('Failed to like reply:', error)
    }
  }

  const getSelectedSectionTitle = () => {
    if (!selectedSectionId) return undefined
    return sections.find(s => s.id === selectedSectionId)?.title
  }

  // Article management functions
  const handleCreateArticle = () => {
    setView('write')
    setEditingArticle(null)
    setSidebarOpen(false)
  }

  const handleEditArticle = (article: CommunityArticle) => {
    setView('write')
    setEditingArticle(article)
    setSidebarOpen(false)
  }

  const handleDeleteArticle = async (articleId: string) => {
    try {
      const response = await fetch(`/api/community/articles/${articleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Refresh the articles list
        if (selectedSectionId) {
          fetchArticles(selectedSectionId, currentPage)
        }
      }
    } catch (error) {
      console.error('Failed to delete article:', error)
    }
  }

  const handleSaveArticle = async (article: CommunityArticle, isDraft?: boolean): Promise<boolean> => {
    try {
      const url = editingArticle
        ? `/api/community/articles/${editingArticle.id}`
        : '/api/community/articles'

      const method = editingArticle ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      })

      if (response.ok) {
        // Refresh the articles list and go back
        if (selectedSectionId) {
          fetchArticles(selectedSectionId, currentPage)
        }
        handleBackToList()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to save article:', error)
      return false
    }
  }

  const handlePublishArticle = async (article: CommunityArticle): Promise<boolean> => {
    return handleSaveArticle(article, false)
  }

  // Manager functions
  const handleOpenSettings = () => {
    setView('settings')
    setSidebarOpen(false)
  }

  const handleSectionCreate = async (sectionData: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/community/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData)
      })

      if (response.ok) {
        await fetchSections()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to create section:', error)
      return false
    }
  }

  const handleSectionUpdate = async (id: string, sectionData: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/community/sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData)
      })

      if (response.ok) {
        await fetchSections()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update section:', error)
      return false
    }
  }

  const handleSectionDelete = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/community/sections/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchSections()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to delete section:', error)
      return false
    }
  }

  const handleSectionReorder = async (reorderData: { id: string; displayOrder: number }[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/community/sections/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections: reorderData })
      })

      if (response.ok) {
        await fetchSections()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to reorder sections:', error)
      return false
    }
  }

  const canWriteArticles = isLoggedIn && selectedSectionId

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <CommunitySidebar
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSectionSelect={handleSectionSelect}
          userLevel={userLevel}
          isLoggedIn={isLoggedIn}
          loading={!sections.length && !initialSections.length}
          onOpenSettings={handleOpenSettings}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Community</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {view === 'list' ? (
              <ArticleList
                sectionId={selectedSectionId}
                sectionTitle={getSelectedSectionTitle()}
                articles={articles}
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                loading={loading}
                isLoggedIn={isLoggedIn}
                userLevel={userLevel}
                canWrite={canWriteArticles}
                onPageChange={handlePageChange}
                onArticleClick={handleArticleClick}
                onCreateArticle={handleCreateArticle}
                onEditArticle={handleEditArticle}
                onDeleteArticle={handleDeleteArticle}
              />
            ) : view === 'article' && selectedArticle ? (
              <ArticleViewer
                article={selectedArticle}
                replies={articleReplies}
                isLoggedIn={isLoggedIn}
                userLevel={userLevel}
                onBack={handleBackToList}
                onLikeArticle={handleLikeArticle}
                onReplySubmit={handleReplySubmit}
                onLikeReply={handleLikeReply}
              />
            ) : view === 'write' ? (
              <ArticleWriter
                sections={sections}
                article={editingArticle || undefined}
                selectedSectionId={selectedSectionId || undefined}
                userLevel={userLevel}
                isLoggedIn={isLoggedIn}
                onBack={handleBackToList}
                onSave={handleSaveArticle}
                onPublish={handlePublishArticle}
              />
            ) : view === 'settings' ? (
              <ManagerSettings
                sections={sections}
                userLevel={userLevel}
                isLoggedIn={isLoggedIn}
                onBack={handleBackToList}
                onSectionCreate={handleSectionCreate}
                onSectionUpdate={handleSectionUpdate}
                onSectionDelete={handleSectionDelete}
                onSectionReorder={handleSectionReorder}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}