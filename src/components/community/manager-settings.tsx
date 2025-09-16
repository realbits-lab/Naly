'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  Users,
  FileText,
  Shield
} from 'lucide-react'
import { z } from 'zod'

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

interface SectionFormData {
  title: string
  description: string
  slug: string
  icon: string
  color: string
  displayOrder: number
  isPublic: boolean
}

interface ManagerSettingsProps {
  sections: CommunitySection[]
  userLevel?: 'USER' | 'MANAGER'
  isLoggedIn: boolean
  onBack: () => void
  onSectionCreate: (section: Omit<SectionFormData, 'displayOrder'>) => Promise<boolean>
  onSectionUpdate: (id: string, section: Partial<SectionFormData>) => Promise<boolean>
  onSectionDelete: (id: string) => Promise<boolean>
  onSectionReorder: (sections: { id: string; displayOrder: number }[]) => Promise<boolean>
  loading?: boolean
}

const sectionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000),
  slug: z.string().min(1, 'Slug is required').max(100).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  icon: z.string().max(50),
  color: z.string().max(20),
  isPublic: z.boolean(),
})

const defaultColors = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

const defaultIcons = [
  '📝', '💡', '🔧', '📚', '💬', '🎯', '📊', '🚀', '⭐', '🔥',
  '💻', '🎨', '📱', '🌟', '🔒', '👥', '📈', '🎓', '⚡', '🌈'
]

export function ManagerSettings({
  sections: initialSections,
  userLevel,
  isLoggedIn,
  onBack,
  onSectionCreate,
  onSectionUpdate,
  onSectionDelete,
  onSectionReorder,
  loading = false
}: ManagerSettingsProps) {
  const [sections, setSections] = useState<CommunitySection[]>(initialSections)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSection, setEditingSection] = useState<CommunitySection | null>(null)
  const [deleteConfirmSection, setDeleteConfirmSection] = useState<string | null>(null)
  const [formData, setFormData] = useState<SectionFormData>({
    title: '',
    description: '',
    slug: '',
    icon: '',
    color: defaultColors[0],
    displayOrder: 0,
    isPublic: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const isManager = userLevel === 'MANAGER'

  useEffect(() => {
    setSections(initialSections)
  }, [initialSections])

  useEffect(() => {
    if (formData.title && !editingSection) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title, editingSection])

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      slug: '',
      icon: '',
      color: defaultColors[0],
      displayOrder: 0,
      isPublic: true,
    })
    setErrors({})
    setEditingSection(null)
  }

  const handleCreateSection = () => {
    resetForm()
    setFormData(prev => ({ ...prev, displayOrder: sections.length }))
    setShowCreateDialog(true)
  }

  const handleEditSection = (section: CommunitySection) => {
    setFormData({
      title: section.title,
      description: section.description || '',
      slug: section.slug,
      icon: section.icon || '',
      color: section.color || defaultColors[0],
      displayOrder: section.displayOrder,
      isPublic: section.isPublic,
    })
    setEditingSection(section)
    setShowCreateDialog(true)
  }

  const handleDeleteSection = (sectionId: string) => {
    setDeleteConfirmSection(sectionId)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    try {
      sectionSchema.parse(formData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
      }
    }

    // Check slug uniqueness
    const duplicateSlug = sections.find(s =>
      s.slug === formData.slug &&
      s.id !== editingSection?.id
    )
    if (duplicateSlug) {
      newErrors.slug = 'Slug already exists'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      let success = false
      if (editingSection) {
        success = await onSectionUpdate(editingSection.id, formData)
      } else {
        success = await onSectionCreate(formData)
      }

      if (success) {
        setShowCreateDialog(false)
        resetForm()
      }
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteSection = async () => {
    if (!deleteConfirmSection) return

    setSaving(true)
    try {
      const success = await onSectionDelete(deleteConfirmSection)
      if (success) {
        setDeleteConfirmSection(null)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return

    const newSections = [...sections]
    ;[newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]]

    const reorderData = newSections.map((section, i) => ({
      id: section.id,
      displayOrder: i
    }))

    const success = await onSectionReorder(reorderData)
    if (success) {
      setSections(newSections)
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === sections.length - 1) return

    const newSections = [...sections]
    ;[newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]]

    const reorderData = newSections.map((section, i) => ({
      id: section.id,
      displayOrder: i
    }))

    const success = await onSectionReorder(reorderData)
    if (success) {
      setSections(newSections)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isLoggedIn || !isManager) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Manager Access Required</h3>
        <p className="text-muted-foreground text-center max-w-md">
          You need manager-level permissions to access the community settings.
        </p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Community
        </Button>
        <h1 className="text-2xl font-bold flex items-center">
          <Settings className="h-6 w-6 mr-2" />
          Manager Settings
        </h1>
      </div>

      <Tabs defaultValue="sections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Community Sections</CardTitle>
                  <CardDescription>
                    Manage the sidebar sections that organize your community content
                  </CardDescription>
                </div>
                <Button onClick={handleCreateSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No sections created yet</p>
                  <Button variant="outline" onClick={handleCreateSection} className="mt-2">
                    Create First Section
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <Card key={section.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {section.icon && (
                            <span className="text-lg">{section.icon}</span>
                          )}
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{section.title}</h4>
                              <Badge variant={section.isPublic ? "default" : "secondary"}>
                                {section.isPublic ? (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Public
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Private
                                  </>
                                )}
                              </Badge>
                              {!section.isActive && (
                                <Badge variant="destructive">Inactive</Badge>
                              )}
                            </div>
                            {section.description && (
                              <p className="text-sm text-muted-foreground">{section.description}</p>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              Slug: {section.slug} • {section.articleCount || 0} articles
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === sections.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSection(section)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSection(section.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Permissions</CardTitle>
              <CardDescription>
                Manage user access levels and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">User permissions management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Community Analytics</CardTitle>
              <CardDescription>
                View community usage statistics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Section Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </DialogTitle>
            <DialogDescription>
              {editingSection
                ? 'Update the section details below'
                : 'Add a new section to organize community content'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter section title..."
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this section..."
                rows={2}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="section-url-slug"
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Icon */}
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultIcons.map(icon => (
                      <SelectItem key={icon} value={icon}>
                        <span className="text-lg">{icon}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose color" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultColors.map(color => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: color }}
                          />
                          <span>{color}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visibility */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) =>
                  setFormData(prev => ({ ...prev, isPublic: checked === true }))
                }
              />
              <Label htmlFor="isPublic">Public section (visible to all users)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingSection ? 'Update Section' : 'Create Section'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmSection} onOpenChange={() => setDeleteConfirmSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This will also remove all articles within this section. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteSection}
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}