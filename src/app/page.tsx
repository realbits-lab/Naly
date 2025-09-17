import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BarChart3, Brain, TrendingUp, Zap, Shield, Globe, ChevronRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4 text-sm">
              <Zap className="mr-1 h-3 w-3" />
              AI-Powered Financial Intelligence
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Transform Market Data into{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                Intelligent Insights
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Naly converts complex financial data into clear, explanatory narratives and actionable forecasts using advanced AI.
              Make smarter investment decisions with probabilistic predictions and causal analysis.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                Global Markets
              </div>
              <div className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                Real-time Analysis
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need for financial intelligence
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive AI-powered tools to analyze, predict, and understand market movements
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Intelligent Narratives</CardTitle>
                <CardDescription>
                  AI-powered explanations that transform complex market events into clear, understandable stories with contextual insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  Learn more <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">Probabilistic Forecasting</CardTitle>
                <CardDescription>
                  Multi-scenario predictions with transparent uncertainty analysis and evidence-based reasoning for informed decisions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  Learn more <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 transition-all hover:border-primary/50 hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Causal Analysis</CardTitle>
                <CardDescription>
                  Deep-dive into the root causes behind market movements with automated analysis and correlation discovery.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  Learn more <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-24 sm:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to transform your financial analysis?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of professionals already using Naly to make smarter investment decisions.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}