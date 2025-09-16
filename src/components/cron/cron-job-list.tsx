'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Clock,
  Play,
  Pause,
  Square,
  MoreVertical,
  Trash2,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CronJob {
  id: string
  name: string
  description?: string
  type: string
  cronExpression: string
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR' | 'COMPLETED'
  isActive: boolean
  lastRun?: Date
  nextRun?: Date
  runCount: string
  createdAt: Date
}

interface CronJobListProps {
  jobs: CronJob[]
  onResume: (jobId: string) => Promise<void>
  onPause: (jobId: string) => Promise<void>
  onStop: (jobId: string) => Promise<void>
  onDelete: (jobId: string) => Promise<void>
  onEdit: (jobId: string) => void
}

export function CronJobList({
  jobs,
  onResume,
  onPause,
  onStop,
  onDelete,
  onEdit
}: CronJobListProps) {
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null)

  const handleAction = async (jobId: string, action: () => Promise<void>) => {
    setLoading(prev => ({ ...prev, [jobId]: true }))
    try {
      await action()
    } finally {
      setLoading(prev => ({ ...prev, [jobId]: false }))
    }
  }

  const getStatusBadge = (status: CronJob['status'], isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }

    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'PAUSED':
        return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>
      case 'STOPPED':
        return <Badge variant="secondary">Stopped</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: CronJob['status'], isActive: boolean) => {
    if (!isActive) return <Clock className="h-4 w-4 text-muted-foreground" />

    switch (status) {
      case 'ACTIVE':
        return <Activity className="h-4 w-4 text-green-600" />
      case 'PAUSED':
        return <Pause className="h-4 w-4 text-yellow-600" />
      case 'STOPPED':
        return <Square className="h-4 w-4 text-gray-600" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatCronExpression = (expression: string): string => {
    const parts = expression.split(' ')
    if (parts.length >= 5) {
      const [minute, hour, day, month, dayOfWeek] = parts

      if (minute === '0' && hour === '*') return 'Every hour'
      if (minute === '0' && hour === '0') return 'Daily at midnight'
      if (minute === '0' && hour === '*/12') return 'Every 12 hours'
      if (expression === '0 9 * * 1-5') return 'Weekdays at 9 AM'
    }

    return expression
  }

  return (
    <div className="space-y-4">
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No cron jobs yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first automated task to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        jobs.map((job) => (
          <Card key={job.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getStatusIcon(job.status, job.isActive)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <CardTitle className="text-lg truncate">{job.name}</CardTitle>
                      {getStatusBadge(job.status, job.isActive)}
                    </div>
                    {job.description && (
                      <CardDescription className="line-clamp-2">
                        {job.description}
                      </CardDescription>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                      <span>Type: {job.type}</span>
                      <span>•</span>
                      <span>Schedule: {formatCronExpression(job.cronExpression)}</span>
                      <span>•</span>
                      <span>Runs: {job.runCount}</span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={loading[job.id]}
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(job.id)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Edit Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {job.status === 'PAUSED' && (
                      <DropdownMenuItem
                        onClick={() => handleAction(job.id, () => onResume(job.id))}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </DropdownMenuItem>
                    )}
                    {job.status === 'ACTIVE' && (
                      <DropdownMenuItem
                        onClick={() => handleAction(job.id, () => onPause(job.id))}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </DropdownMenuItem>
                    )}
                    {(job.status === 'ACTIVE' || job.status === 'PAUSED') && (
                      <DropdownMenuItem
                        onClick={() => handleAction(job.id, () => onStop(job.id))}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Stop
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteJobId(job.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-muted-foreground">
                  {job.lastRun && (
                    <span>Last run: {job.lastRun.toLocaleString()}</span>
                  )}
                  {job.nextRun && job.status === 'ACTIVE' && (
                    <span>Next run: {job.nextRun.toLocaleString()}</span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  Created {job.createdAt.toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cron Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this cron job? This action cannot be undone
              and will also remove all associated execution logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteJobId) {
                  handleAction(deleteJobId, () => onDelete(deleteJobId))
                  setDeleteJobId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}