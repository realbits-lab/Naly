import { SimpleNewsList } from '@/components/articles/simple-news-list'

export default function NewsArticlesPageRoute() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial News</h1>
          <p className="text-muted-foreground">
            Latest financial news and market updates
          </p>
        </div>

        <SimpleNewsList />
      </div>
    </div>
  )
}