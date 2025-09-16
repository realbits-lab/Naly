'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CronJobList } from './cron-job-list'
import { CronJobForm } from './cron-job-form'
import { Plus, Clock, Activity, AlertCircle, Pause } from 'lucide-react'

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

interface CronJobsPageProps {
  userId: string
}

export function CronJobsPage({ userId }: CronJobsPageProps) {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<CronJob | null>(null)

  // Fetch cron jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/cron-jobs')
        if (!response.ok) {
          throw new Error('Failed to fetch cron jobs')
        }

        const data = await response.json()
        const formattedJobs: CronJob[] = data.jobs.map((job: any) => ({
          ...job,
          lastRun: job.lastRun ? new Date(job.lastRun) : undefined,
          nextRun: job.nextRun ? new Date(job.nextRun) : undefined,
          createdAt: new Date(job.createdAt)
        }))

        setJobs(formattedJobs)
      } catch (error) {
        console.error('Failed to fetch cron jobs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [userId])

  const handleCreateJob = async (data: any) => {
    try {
      const response = await fetch('/api/cron-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create cron job')
      }

      const result = await response.json()
      const newJob: CronJob = {
        ...result.job,
        lastRun: result.job.lastRun ? new Date(result.job.lastRun) : undefined,
        nextRun: result.job.nextRun ? new Date(result.job.nextRun) : undefined,
        createdAt: new Date(result.job.createdAt),
      }

      setJobs(prev => [newJob, ...prev])
    } catch (error) {
      console.error('Failed to create cron job:', error)
    }
  }

  const handleEditJob = async (data: any) => {
    if (!editingJob) return

    try {
      const response = await fetch(`/api/cron-jobs/${editingJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update cron job')
      }

      const result = await response.json()
      const updatedJob: CronJob = {
        ...result.job,
        lastRun: result.job.lastRun ? new Date(result.job.lastRun) : undefined,
        nextRun: result.job.nextRun ? new Date(result.job.nextRun) : undefined,
        createdAt: new Date(result.job.createdAt),
      }

      setJobs(prev => prev.map(job =>
        job.id === editingJob.id ? updatedJob : job
      ))

      setEditingJob(null)
    } catch (error) {
      console.error('Failed to update cron job:', error)
    }
  }

  const handleResumeJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/cron-jobs/${jobId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      })

      if (!response.ok) {
        throw new Error('Failed to resume job')
      }

      const result = await response.json()
      const updatedJob: CronJob = {
        ...result.job,
        lastRun: result.job.lastRun ? new Date(result.job.lastRun) : undefined,
        nextRun: result.job.nextRun ? new Date(result.job.nextRun) : undefined,
        createdAt: new Date(result.job.createdAt),
      }

      setJobs(prev => prev.map(job =>
        job.id === jobId ? updatedJob : job
      ))
    } catch (error) {
      console.error('Failed to resume job:', error)
    }
  }

  const handlePauseJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/cron-jobs/${jobId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      })

      if (!response.ok) {
        throw new Error('Failed to pause job')
      }

      const result = await response.json()
      const updatedJob: CronJob = {
        ...result.job,
        lastRun: result.job.lastRun ? new Date(result.job.lastRun) : undefined,
        nextRun: result.job.nextRun ? new Date(result.job.nextRun) : undefined,
        createdAt: new Date(result.job.createdAt),
      }

      setJobs(prev => prev.map(job =>
        job.id === jobId ? updatedJob : job
      ))
    } catch (error) {
      console.error('Failed to pause job:', error)
    }
  }

  const handleStopJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/cron-jobs/${jobId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })

      if (!response.ok) {
        throw new Error('Failed to stop job')
      }

      const result = await response.json()
      const updatedJob: CronJob = {
        ...result.job,
        lastRun: result.job.lastRun ? new Date(result.job.lastRun) : undefined,
        nextRun: result.job.nextRun ? new Date(result.job.nextRun) : undefined,
        createdAt: new Date(result.job.createdAt),
      }

      setJobs(prev => prev.map(job =>
        job.id === jobId ? updatedJob : job
      ))
    } catch (error) {
      console.error('Failed to stop job:', error)
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/cron-jobs/${jobId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete job')
      }

      setJobs(prev => prev.filter(job => job.id !== jobId))
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  const handleEditClick = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      setEditingJob(job)
      setShowForm(true)
    }
  }

  const getJobStats = () => {
    const active = jobs.filter(j => j.status === 'ACTIVE' && j.isActive).length
    const paused = jobs.filter(j => j.status === 'PAUSED').length
    const error = jobs.filter(j => j.status === 'ERROR').length

    return { active, paused, error, total: jobs.length }
  }

  const stats = getJobStats()

  const filterJobsByStatus = (status?: string) => {
    if (!status) return jobs
    return jobs.filter(job => {
      switch (status) {
        case 'active':
          return job.status === 'ACTIVE' && job.isActive
        case 'paused':
          return job.status === 'PAUSED'
        case 'error':
          return job.status === 'ERROR'
        default:
          return true
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Jobs</h1>
          <p className="text-muted-foreground">
            Manage your automated tasks and schedules
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Job
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <Pause className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.paused}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List with Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Jobs ({stats.total})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="paused">Paused ({stats.paused})</TabsTrigger>
          {stats.error > 0 && (
            <TabsTrigger value="error">Errors ({stats.error})</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CronJobList
            jobs={filterJobsByStatus()}
            onResume={handleResumeJob}
            onPause={handlePauseJob}
            onStop={handleStopJob}
            onDelete={handleDeleteJob}
            onEdit={handleEditClick}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <CronJobList
            jobs={filterJobsByStatus('active')}
            onResume={handleResumeJob}
            onPause={handlePauseJob}
            onStop={handleStopJob}
            onDelete={handleDeleteJob}
            onEdit={handleEditClick}
          />
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          <CronJobList
            jobs={filterJobsByStatus('paused')}
            onResume={handleResumeJob}
            onPause={handlePauseJob}
            onStop={handleStopJob}
            onDelete={handleDeleteJob}
            onEdit={handleEditClick}
          />
        </TabsContent>

        <TabsContent value="error" className="space-y-4">
          <CronJobList
            jobs={filterJobsByStatus('error')}
            onResume={handleResumeJob}
            onPause={handlePauseJob}
            onStop={handleStopJob}
            onDelete={handleDeleteJob}
            onEdit={handleEditClick}
          />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <CronJobForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingJob(null)
        }}
        onSubmit={editingJob ? handleEditJob : handleCreateJob}
        initialData={editingJob || undefined}
        mode={editingJob ? 'edit' : 'create'}
      />
    </div>
  )
}