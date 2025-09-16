'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Settings,
  Edit,
  Trash2,
  Eye,
  Users,
  Hash,
  FileText,
  Loader2,
  MoreVertical
} from 'lucide-react'
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

interface CommunitySidebarProps {
  sections: CommunitySection[]
  selectedSectionId: string | null
  onSectionSelect: (sectionId: string, slug: string) => void
  userLevel?: 'USER' | 'MANAGER'
  isLoggedIn: boolean
  onCreateSection?: () => void
  onEditSection?: (section: CommunitySection) => void
  onDeleteSection?: (sectionId: string) => void
  onOpenSettings?: () => void
  loading?: boolean
}

export function CommunitySidebar({
  sections,
  selectedSectionId,
  onSectionSelect,
  userLevel,
  isLoggedIn,
  onCreateSection,
  onEditSection,
  onDeleteSection,
  onOpenSettings,
  loading = false
}: CommunitySidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Filter sections based on search and visibility
  const filteredSections = sections.filter(section => {
    // Show all sections to managers, only public to non-login users
    const isVisible = isLoggedIn || section.isPublic
    const matchesSearch = searchTerm === '' ||
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description?.toLowerCase().includes(searchTerm.toLowerCase())

    return isVisible && matchesSearch && section.isActive
  }).sort((a, b) => a.displayOrder - b.displayOrder)

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId)
    } else {
      newCollapsed.add(sectionId)
    }
    setCollapsedSections(newCollapsed)
  }

  const getIconComponent = (iconName?: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      'hash': Hash,
      'users': Users,
      'file-text': FileText,
      'eye': Eye,
    }

    const IconComponent = iconName ? iconMap[iconName] || Hash : Hash
    return IconComponent
  }

  const getSectionColor = (color?: string) => {
    const colorMap: Record<string, string> = {
      'blue': 'text-blue-600 bg-blue-50',
      'green': 'text-green-600 bg-green-50',
      'purple': 'text-purple-600 bg-purple-50',
      'orange': 'text-orange-600 bg-orange-50',
      'red': 'text-red-600 bg-red-50',
    }

    return colorMap[color || 'blue'] || 'text-blue-600 bg-blue-50'
  }

  if (loading) {
    return (
      <div className="w-80 border-r bg-card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Community</h2>
          {userLevel === 'MANAGER' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onOpenSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manager Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCreateSection}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Sections List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredSections.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'No matching sections' : 'No sections available'}
              </p>
              {userLevel === 'MANAGER' && !searchTerm && (
                <Button variant="outline" size="sm" className="mt-2" onClick={onCreateSection}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Section
                </Button>
              )}
            </div>
          ) : (
            filteredSections.map((section) => {
              const IconComponent = getIconComponent(section.icon)
              const colorClass = getSectionColor(section.color)
              const isSelected = selectedSectionId === section.id
              const isCollapsed = collapsedSections.has(section.id)

              return (
                <div key={section.id} className="space-y-1">
                  <Collapsible>
                    <div className={cn(
                      "flex items-center justify-between rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer",
                      isSelected && "bg-accent"
                    )}>
                      <div
                        className="flex items-center space-x-3 flex-1 min-w-0"
                        onClick={() => onSectionSelect(section.id, section.slug)}
                      >
                        <div className={cn(
                          "p-2 rounded-md",
                          colorClass
                        )}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {section.title}
                          </h3>
                          {section.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {section.description}
                            </p>
                          )}
                        </div>
                        {section.articleCount !== undefined && (
                          <Badge variant="secondary" className="text-xs">
                            {section.articleCount}
                          </Badge>
                        )}
                      </div>

                      {userLevel === 'MANAGER' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditSection?.(section)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Section
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteConfirmId(section.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Section
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </Collapsible>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      <div className="p-4 border-t text-center">
        <p className="text-xs text-muted-foreground">
          {isLoggedIn ? (
            <>Welcome back! You can write articles and reply to discussions.</>
          ) : (
            <>Sign in to write articles and participate in discussions.</>
          )}
        </p>
        {userLevel === 'MANAGER' && (
          <Badge variant="outline" className="mt-2">
            Manager
          </Badge>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? All articles in this section will also be deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  onDeleteSection?.(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
            >
              Delete Section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}