'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Info } from 'lucide-react'

const cronJobSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  type: z.enum(['MARKET_ANALYSIS', 'PORTFOLIO_UPDATE', 'PREDICTION_REFRESH', 'DATA_SYNC', 'CUSTOM_TASK']),
  cronExpression: z.string().min(1, 'Schedule is required'),
  taskConfig: z.record(z.any()).optional(),
})

type CronJobFormData = z.infer<typeof cronJobSchema>

interface CronJobFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CronJobFormData) => Promise<void>
  initialData?: Partial<CronJobFormData>
  mode: 'create' | 'edit'
}

const cronPresets = [
  { label: 'Every hour', value: '0 * * * *', description: 'Runs at the beginning of every hour' },
  { label: 'Every 2 hours', value: '0 */2 * * *', description: 'Runs every 2 hours' },
  { label: 'Every 6 hours', value: '0 */6 * * *', description: 'Runs every 6 hours' },
  { label: 'Daily at 9 AM', value: '0 9 * * *', description: 'Runs every day at 9:00 AM' },
  { label: 'Daily at midnight', value: '0 0 * * *', description: 'Runs every day at midnight' },
  { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5', description: 'Runs Monday to Friday at 9:00 AM' },
  { label: 'Weekly on Monday', value: '0 9 * * 1', description: 'Runs every Monday at 9:00 AM' },
  { label: 'Monthly on 1st', value: '0 9 1 * *', description: 'Runs on the 1st of every month at 9:00 AM' },
]

const jobTypeLabels = {
  MARKET_ANALYSIS: 'Market Analysis',
  PORTFOLIO_UPDATE: 'Portfolio Update',
  PREDICTION_REFRESH: 'Prediction Refresh',
  DATA_SYNC: 'Data Synchronization',
  CUSTOM_TASK: 'Custom Task',
}

const jobTypeDescriptions = {
  MARKET_ANALYSIS: 'Automated analysis of market conditions and trends',
  PORTFOLIO_UPDATE: 'Refresh portfolio values and performance metrics',
  PREDICTION_REFRESH: 'Update AI predictions and forecasts',
  DATA_SYNC: 'Synchronize data with external sources',
  CUSTOM_TASK: 'Custom automated task with configurable parameters',
}

export function CronJobForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode
}: CronJobFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const form = useForm<CronJobFormData>({
    resolver: zodResolver(cronJobSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      type: initialData?.type || 'CUSTOM_TASK',
      cronExpression: initialData?.cronExpression || '0 * * * *',
      taskConfig: initialData?.taskConfig || {},
    },
  })

  const handleSubmit = async (data: CronJobFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      form.reset()
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePresetSelect = (preset: string) => {
    form.setValue('cronExpression', preset)
    setSelectedPreset(preset)
  }

  const validateCronExpression = (expression: string): string | null => {
    const parts = expression.trim().split(/\s+/)
    if (parts.length !== 5) {
      return 'Cron expression must have exactly 5 fields (minute hour day month day-of-week)'
    }

    const [minute, hour, day, month, dayOfWeek] = parts
    const ranges = {
      minute: [0, 59],
      hour: [0, 23],
      day: [1, 31],
      month: [1, 12],
      dayOfWeek: [0, 7], // 0 and 7 both represent Sunday
    }

    const validateField = (field: string, name: string, [min, max]: [number, number]): boolean => {
      if (field === '*') return true
      if (field.includes('/')) {
        const [range, step] = field.split('/')
        if (range !== '*' && !validateField(range, name, [min, max])) return false
        const stepNum = parseInt(step, 10)
        return !isNaN(stepNum) && stepNum > 0
      }
      if (field.includes('-')) {
        const [start, end] = field.split('-').map(num => parseInt(num, 10))
        return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end
      }
      if (field.includes(',')) {
        return field.split(',').every(part => validateField(part.trim(), name, [min, max]))
      }
      const num = parseInt(field, 10)
      return !isNaN(num) && num >= min && num <= max
    }

    const fields = [
      { value: minute, name: 'minute', range: ranges.minute },
      { value: hour, name: 'hour', range: ranges.hour },
      { value: day, name: 'day', range: ranges.day },
      { value: month, name: 'month', range: ranges.month },
      { value: dayOfWeek, name: 'day-of-week', range: ranges.dayOfWeek },
    ]

    for (const field of fields) {
      if (!validateField(field.value, field.name, field.range)) {
        return `Invalid ${field.name} field: ${field.value}`
      }
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Cron Job' : 'Edit Cron Job'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Set up an automated task that runs on a schedule'
              : 'Update the configuration for this automated task'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Hourly Market Analysis"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this job does..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(jobTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <div className="font-medium">{label}</div>
                              <div className="text-xs text-muted-foreground">
                                {jobTypeDescriptions[value as keyof typeof jobTypeDescriptions]}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Schedule</FormLabel>
                <div className="grid grid-cols-2 gap-2">
                  {cronPresets.map((preset) => (
                    <Button
                      key={preset.value}
                      type="button"
                      variant={selectedPreset === preset.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePresetSelect(preset.value)}
                      className="justify-start"
                    >
                      <Clock className="h-3 w-3 mr-2" />
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="cronExpression"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Cron Expression</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0 * * * *"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          setSelectedPreset(null)
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Format: minute hour day month day-of-week (e.g., "0 * * * *" for hourly)
                    </FormDescription>
                    {field.value && validateCronExpression(field.value) && (
                      <div className="text-sm text-destructive">
                        {validateCronExpression(field.value)}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  Cron Expression Help
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="grid grid-cols-5 gap-2">
                  <Badge variant="outline">Minute (0-59)</Badge>
                  <Badge variant="outline">Hour (0-23)</Badge>
                  <Badge variant="outline">Day (1-31)</Badge>
                  <Badge variant="outline">Month (1-12)</Badge>
                  <Badge variant="outline">Day of Week (0-7)</Badge>
                </div>
                <p className="text-muted-foreground">
                  Use * for any value, / for intervals, - for ranges, and , for lists
                </p>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !!validateCronExpression(form.watch('cronExpression'))}
              >
                {isSubmitting
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Updating...'
                  : mode === 'create'
                    ? 'Create Job'
                    : 'Update Job'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}