import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ArticleGenerator } from '@/components/articles/article-generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PenTool, Shield, FileText, BarChart3, TrendingUp, Bot } from 'lucide-react'
import { ArticleStatsCards } from '@/components/articles/article-stats-cards'
import { ArticleManagement } from '@/components/articles/article-management'

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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PenTool className="h-5 w-5 text-primary" />
              <span>Content Creation Tools</span>
            </CardTitle>
            <CardDescription>
              Use AI-powered tools to generate comprehensive financial articles from news sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArticleGenerator />
          </CardContent>
        </Card>

        <ArticleManagement />
      </div>
    </div>
  )
}