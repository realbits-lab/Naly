'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  MessageSquare,
  Users,
  Trophy,
  Target,
  TrendingUp,
  BarChart3,
  Lightbulb
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionsProps {
  userId: string
}

export function QuickActions({ userId }: QuickActionsProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [discussionData, setDiscussionData] = useState({
    title: '',
    content: '',
    relatedTicker: '',
    tags: ''
  })

  const handleCreateDiscussion = async () => {
    try {
      setCreating(true)

      const response = await fetch('/api/community/discussions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: discussionData.title.trim() || undefined,
          content: discussionData.content.trim(),
          relatedTicker: discussionData.relatedTicker.trim() || undefined,
          tags: discussionData.tags.trim() ? discussionData.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setCreateDialogOpen(false)
        setDiscussionData({ title: '', content: '', relatedTicker: '', tags: '' })
        // Refresh the page or redirect to the new discussion
        window.location.reload()
      } else {
        throw new Error(data.error?.message || 'Failed to create discussion')
      }
    } catch (error) {
      console.error('Error creating discussion:', error)
      // Show error toast
    } finally {
      setCreating(false)
    }
  }

  const quickNavigationItems = [
    {
      label: 'Discussions',
      href: '/community/discussions',
      icon: MessageSquare,
      description: 'Browse and join discussions'
    },
    {
      label: 'Leaderboards',
      href: '/community/leaderboards',
      icon: Trophy,
      description: 'See top contributors'
    },
    {
      label: 'Challenges',
      href: '/community/challenges',
      icon: Target,
      description: 'Participate in challenges'
    },
    {
      label: 'Achievements',
      href: '/community/achievements',
      icon: Trophy,
      description: 'View your achievements'
    }
  ]

  const discussionTypes = [
    { label: 'Market Analysis', icon: TrendingUp, color: 'text-bull' },
    { label: 'Stock Discussion', icon: BarChart3, color: 'text-bear' },
    { label: 'General Question', icon: Lightbulb, color: 'text-neutral' },
    { label: 'Community Chat', icon: Users, color: 'text-muted-foreground' }
  ]

  return (
    <div className="flex items-center space-x-3">
      {/* Quick Navigation Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Explore
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Community Sections</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {quickNavigationItems.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <a href={item.href} className="flex items-center">
                <item.icon className="h-4 w-4 mr-2" />
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </a>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Discussion Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Discussion
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Start a New Discussion</DialogTitle>
            <DialogDescription>
              Share your thoughts, ask questions, or start a conversation with the community.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Discussion Type Selection */}
            <div className="grid grid-cols-2 gap-2">
              {discussionTypes.map((type) => (
                <Button
                  key={type.label}
                  variant="outline"
                  className="justify-start h-auto p-3"
                  onClick={() => {
                    // Could set discussion type in state for categorization
                  }}
                >
                  <type.icon className={cn("h-4 w-4 mr-2", type.color)} />
                  <span className="text-sm">{type.label}</span>
                </Button>
              ))}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title (Optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g., What do you think about AAPL's latest earnings?"
                    value={discussionData.title}
                    onChange={(e) => setDiscussionData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticker">Stock Ticker (Optional)</Label>
                  <Input
                    id="ticker"
                    placeholder="e.g., AAPL"
                    value={discussionData.relatedTicker}
                    onChange={(e) => setDiscussionData(prev => ({
                      ...prev,
                      relatedTicker: e.target.value.toUpperCase()
                    }))}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your thoughts, analysis, or questions..."
                  className="min-h-[120px]"
                  value={discussionData.content}
                  onChange={(e) => setDiscussionData(prev => ({ ...prev, content: e.target.value }))}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {discussionData.content.length}/5000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., earnings, technical analysis, growth"
                  value={discussionData.tags}
                  onChange={(e) => setDiscussionData(prev => ({ ...prev, tags: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>
            </div>

            {/* Preview */}
            {discussionData.relatedTicker && (
              <div className="p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="font-mono">
                    {discussionData.relatedTicker}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Stock Discussion</span>
                </div>
                {discussionData.title && (
                  <h4 className="font-semibold text-sm mb-1">{discussionData.title}</h4>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {discussionData.content}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDiscussion}
                disabled={!discussionData.content.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create Discussion'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}