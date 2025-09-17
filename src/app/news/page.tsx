import { auth } from '@/lib/auth'
import { ArticlesPage } from '@/components/articles/articles-page'

export default async function NewsArticlesPageRoute() {
  const session = await auth()

  return (
    <div className="container mx-auto px-4 py-8">
      <ArticlesPage
        isLoggedIn={!!session?.user}
        userRole={session?.user?.role || null}
      />
    </div>
  )
}