import { ArticlesPage } from '@/components/articles/articles-page'

export default function NewsArticlesPageRoute() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ArticlesPage isLoggedIn={false} />
    </div>
  )
}