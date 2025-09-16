'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Zap,
  Plus,
  BookOpen,
  BarChart3,
  Target,
  Bell,
  Download,
  Share
} from 'lucide-react'

interface QuickActionsProps {
  userId: string
  className?: string
}

export function QuickActions({ userId, className }: QuickActionsProps) {
  const quickActions = [
    {
      id: 'add-position',
      label: 'Add Position',
      icon: Plus,
      description: 'Buy or sell securities',
      variant: 'default' as const
    },
    {
      id: 'generate-narrative',
      label: 'Generate Narrative',
      icon: BookOpen,
      description: 'Create AI story',
      variant: 'outline' as const
    },
    {
      id: 'run-analysis',
      label: 'Run Analysis',
      icon: BarChart3,
      description: 'Analyze portfolio',
      variant: 'outline' as const
    },
    {
      id: 'set-alert',
      label: 'Set Alert',
      icon: Bell,
      description: 'Price notifications',
      variant: 'outline' as const
    },
    {
      id: 'export-data',
      label: 'Export Report',
      icon: Download,
      description: 'Download reports',
      variant: 'outline' as const
    },
    {
      id: 'share-insights',
      label: 'Share Insights',
      icon: Share,
      description: 'Share with community',
      variant: 'outline' as const
    }
  ]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Zap className="h-4 w-4" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.id}
                variant={action.variant}
                className="h-auto p-3 justify-start"
              >
                <div className="flex items-start space-x-3">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}