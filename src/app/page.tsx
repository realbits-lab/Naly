import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Naly
          </span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transform complex market data into clear, explanatory narratives and actionable,
          probabilistic forecasts powered by artificial intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-8"
          >
            Get Started
          </Link>

          <Link
            href="/about"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-8"
          >
            Learn More
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Intelligent Narratives</h3>
            <p className="text-muted-foreground">
              AI-powered explanations that turn complex market events into clear, understandable stories.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Probabilistic Forecasting</h3>
            <p className="text-muted-foreground">
              Multi-scenario predictions with transparent uncertainty and evidence-based reasoning.
            </p>
          </div>

          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Causal Analysis</h3>
            <p className="text-muted-foreground">
              Deep-dive into the why behind market movements with automated root cause analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}