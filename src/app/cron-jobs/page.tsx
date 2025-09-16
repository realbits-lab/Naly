import { CronJobsPage } from '@/components/cron/cron-jobs-page'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CronJobsPageRoute() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <CronJobsPage userId={session.user.id} />
    </DashboardShell>
  )
}