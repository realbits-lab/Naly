'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Save,
  Send,
  X,
  Plus,
  Loader2,
  Pin,
  Star,
  Eye,
  EyeOff
} from 'lucide-react'

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

interface CommunityArticle {
  id?: string
  title: string
  content: string
  excerpt?: string
  slug?: string
  sectionId: string
  tags?: string[]
  isPublic: boolean
  isPinned: boolean
  isFeatured: boolean
  publishedAt?: string
  createdAt?: string
  updatedAt?: string
}

interface ArticleWriterProps {
  sections: CommunitySection[]
  article?: CommunityArticle
  selectedSectionId?: string
  userLevel?: 'USER' | 'MANAGER'
  isLoggedIn: boolean
  onBack: () => void
  onSave: (article: CommunityArticle, isDraft?: boolean) => Promise<boolean>
  onPublish: (article: CommunityArticle) => Promise<boolean>
  loading?: boolean
}

export function ArticleWriter({
  sections,
  article,
  selectedSectionId,
  userLevel,
  isLoggedIn,
  onBack,
  onSave,
  onPublish,
  loading = false
}: ArticleWriterProps) {
  const [formData, setFormData] = useState<CommunityArticle>({
    title: '',
    content: '',
    excerpt: '',
    sectionId: selectedSectionId || '',
    tags: [],
    isPublic: true,
    isPinned: false,
    isFeatured: false,
  })
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const isEditing = !!article?.id
  const isManager = userLevel === 'MANAGER'
  const canSetPinned = isManager
  const canSetFeatured = isManager

  // Initialize form data from article prop
  useEffect(() => {
    if (article) {
      setFormData({
        ...article,
        tags: article.tags || [],
      })
    }
  }, [article])

  // Auto-generate excerpt from content
  useEffect(() => {
    if (formData.content && !formData.excerpt) {
      const plainText = formData.content.replace(/\n/g, ' ').trim()
      const autoExcerpt = plainText.length > 200
        ? plainText.substring(0, 197) + '...'
        : plainText

      setFormData(prev => ({ ...prev, excerpt: autoExcerpt }))
    }
  }, [formData.content])

  const handleInputChange = (field: keyof CommunityArticle, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less'
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }

    if (!formData.sectionId) {
      newErrors.sectionId = 'Section is required'
    }

    if (formData.excerpt && formData.excerpt.length > 500) {
      newErrors.excerpt = 'Excerpt must be 500 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const success = await onSave(formData, true)
      if (success) {
        // Form will be reset by parent component
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!validateForm()) return

    setPublishing(true)
    try {
      const success = await onPublish(formData)
      if (success) {
        // Form will be reset by parent component
      }
    } finally {
      setPublishing(false)
    }
  }

  const getSelectedSection = () => {
    return sections.find(section => section.id === formData.sectionId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">
            You need to be logged in to write articles.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>

        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Article' : 'Write New Article'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
          <CardDescription>
            Share your knowledge and thoughts with the community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section Selection */}
          <div className="space-y-2">
            <Label htmlFor="section">Section *</Label>
            <Select
              value={formData.sectionId}
              onValueChange={(value) => handleInputChange('sectionId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a section" />
              </SelectTrigger>
              <SelectContent>
                {sections
                  .filter(section => section.isActive && (section.isPublic || isManager))
                  .map(section => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center space-x-2">
                        {section.icon && <span>{section.icon}</span>}
                        <span>{section.title}</span>
                        {!section.isPublic && (
                          <Badge variant="outline" className="text-xs">Private</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.sectionId && (
              <p className="text-sm text-destructive">{errors.sectionId}</p>
            )}
            {getSelectedSection() && (
              <p className="text-sm text-muted-foreground">
                {getSelectedSection()?.description}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter article title..."
              maxLength={255}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/255 characters
            </p>
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => handleInputChange('excerpt', e.target.value)}
              placeholder="Brief description of your article (auto-generated if left empty)..."
              rows={2}
              maxLength={500}
            />
            {errors.excerpt && (
              <p className="text-sm text-destructive">{errors.excerpt}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.excerpt?.length || 0}/500 characters
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Write your article content here..."
              rows={12}
              className="min-h-[300px] font-mono"
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags?.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                maxLength={50}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Article Settings</h4>

            <div className="space-y-3">
              {/* Visibility */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    handleInputChange('isPublic', checked === true)
                  }
                />
                <Label htmlFor="isPublic" className="flex items-center space-x-2">
                  {formData.isPublic ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  <span>Public article</span>
                </Label>
              </div>

              {/* Manager-only settings */}
              {canSetPinned && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPinned"
                    checked={formData.isPinned}
                    onCheckedChange={(checked) =>
                      handleInputChange('isPinned', checked === true)
                    }
                  />
                  <Label htmlFor="isPinned" className="flex items-center space-x-2">
                    <Pin className="h-4 w-4" />
                    <span>Pin to top</span>
                  </Label>
                </div>
              )}

              {canSetFeatured && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      handleInputChange('isFeatured', checked === true)
                    }
                  />
                  <Label htmlFor="isFeatured" className="flex items-center space-x-2">
                    <Star className="h-4 w-4" />
                    <span>Mark as featured</span>
                  </Label>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving || publishing}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={saving || publishing}
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isEditing ? 'Update Article' : 'Publish Article'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}