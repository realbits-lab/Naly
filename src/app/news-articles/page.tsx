import { ArticlesPage } from '@/components/articles/articles-page'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function NewsArticlesPageRoute() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  return (
    <DashboardShell>
      <ArticlesPage userId={session.user.id} />
    </DashboardShell>
  )
}