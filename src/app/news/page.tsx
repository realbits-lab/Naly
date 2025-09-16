import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'News - Naly',
  description: 'Latest financial news and market updates',
}

export default function NewsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial News</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest market news and analysis
          </p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Breaking News</h2>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium">Market Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Real-time market news and analysis
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-medium">Company Earnings</h3>
                <p className="text-sm text-muted-foreground">
                  Latest earnings reports and forecasts
                </p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-medium">Economic Indicators</h3>
                <p className="text-sm text-muted-foreground">
                  Key economic data and trends
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}