'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  TrendingUp,
  Clock,
  Users,
  Star,
  Filter,
  Search,
  Plus
} from 'lucide-react'

interface NarrativesShellProps {
  children: React.ReactNode
}

export function NarrativesShell({ children }: NarrativesShellProps) {
  const pathname = usePathname()

  const navigationItems = [
    {
      title: 'All Stories',
      href: '/narratives',
      icon: BookOpen,
      description: 'Browse all narratives'
    },
    {
      title: 'Trending',
      href: '/narratives/trending',
      icon: TrendingUp,
      description: 'Popular narratives',
      badge: 'Hot'
    },
    {
      title: 'Recent',
      href: '/narratives/recent',
      icon: Clock,
      description: 'Latest stories'
    },
    {
      title: 'Community',
      href: '/narratives/community',
      icon: Users,
      description: 'User discussions'
    },
    {
      title: 'My Library',
      href: '/narratives/library',
      icon: Star,
      description: 'Saved narratives',
      requiresAuth: true
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-bull" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-bull to-bear bg-clip-text text-transparent">
                  Narratives
                </h1>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          "flex items-center space-x-2",
                          isActive && "bg-bull text-white hover:bg-bull/90"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="hidden lg:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search narratives..."
                    className="pl-10 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-bull/20 focus:border-bull w-64"
                  />
                </div>
              </div>

              {/* Mobile search */}
              <Button variant="outline" size="sm" className="lg:hidden">
                <Search className="h-4 w-4" />
              </Button>

              {/* Filters */}
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Filters</span>
              </Button>

              {/* Create narrative (auth required) */}
              <Button size="sm" className="bg-bull hover:bg-bull/90">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Story</span>
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden mt-4 overflow-x-auto">
            <div className="flex items-center space-x-2 min-w-max pb-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        "flex items-center space-x-2 whitespace-nowrap",
                        isActive && "bg-bull text-white hover:bg-bull/90"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h4 className="font-semibold">About Narratives</h4>
              <p className="text-sm text-muted-foreground">
                AI-powered financial storytelling that transforms market data into compelling narratives.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Categories</h4>
              <div className="flex flex-col space-y-2 text-sm">
                <Link href="/narratives?category=earnings" className="text-muted-foreground hover:text-foreground">
                  Earnings Reports
                </Link>
                <Link href="/narratives?category=market-movement" className="text-muted-foreground hover:text-foreground">
                  Market Movements
                </Link>
                <Link href="/narratives?category=predictions" className="text-muted-foreground hover:text-foreground">
                  AI Predictions
                </Link>
                <Link href="/narratives?category=analysis" className="text-muted-foreground hover:text-foreground">
                  Deep Analysis
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Features</h4>
              <div className="flex flex-col space-y-2 text-sm">
                <span className="text-muted-foreground">Interactive Visualizations</span>
                <span className="text-muted-foreground">Personalized Content</span>
                <span className="text-muted-foreground">Real-time Updates</span>
                <span className="text-muted-foreground">Community Discussions</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Get Started</h4>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" size="sm">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Browse Narratives
                </Button>
                <Button size="sm" className="bg-bull hover:bg-bull/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your Story
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 Naly. Powered by AI financial intelligence.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}