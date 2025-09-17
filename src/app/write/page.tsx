import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Shield } from 'lucide-react'
import { ArticleStatsCards } from '@/components/articles/article-stats-cards'
import { WritePageClient } from '@/components/articles/write-page-client'

export default async function WritePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/api/auth/signin')
  }

  if (session.user.role !== 'admin') {
    redirect('/news')
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center space-x-2 mb-8">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold">Article Writing Studio</h1>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">ADMIN</span>
      </div>

      {/* Statistics Cards */}
      <ArticleStatsCards />

      <WritePageClient />
    </div>
  )
}