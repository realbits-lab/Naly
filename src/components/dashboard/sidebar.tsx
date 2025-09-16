'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Icons } from '@/components/ui/icons'
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Building2,
  Clock,
  Home,
  LineChart,
  PieChart,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
  Zap
} from 'lucide-react'
import { UserNav } from './user-nav'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and key metrics'
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: Wallet,
    description: 'Manage your investments',
    badge: 'New'
  },
  {
    name: 'Market Data',
    href: '/market',
    icon: TrendingUp,
    description: 'Live market information'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Advanced market analytics'
  },
  {
    name: 'Predictions',
    href: '/predictions',
    icon: BrainCircuit,
    description: 'AI-powered forecasts'
  },
  {
    name: 'Narratives',
    href: '/narratives',
    icon: BookOpen,
    description: 'Intelligent market stories'
  },
  {
    name: 'Visualizations',
    href: '/visualizations',
    icon: LineChart,
    description: 'Interactive charts and graphs'
  },
  {
    name: 'Cron Jobs',
    href: '/cron-jobs',
    icon: Clock,
    description: 'Automated task scheduling',
    badge: 'New'
  }
]

const additionalNavigation = [
  {
    name: 'Community',
    href: '/community',
    icon: Users,
    description: 'Connect with other traders'
  },
  {
    name: 'Institutional',
    href: '/institutional',
    icon: Building2,
    description: 'Professional tools',
    restricted: true
  },
  {
    name: 'API Access',
    href: '/api-access',
    icon: Zap,
    description: 'Developer tools'
  }
]

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r px-4 pb-4">
          <div className="flex h-14 shrink-0 items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Icons.logo className="h-8 w-8 text-bull" />
              <span className="text-xl font-bold bg-gradient-to-r from-bull to-bear bg-clip-text text-transparent">
                Naly
              </span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Main
                  </p>
                  <ul className="space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                            pathname === item.href
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-full bg-bull px-2 py-0.5 text-xs font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Advanced
                  </p>
                  <ul className="space-y-1">
                    {additionalNavigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                            pathname === item.href
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground',
                            item.restricted && 'opacity-60'
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          {item.restricted && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Pro
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>

            {/* User navigation at bottom */}
            <div className="mt-auto pt-4 border-t">
              <div className="space-y-1">
                <Link
                  href="/settings"
                  className={cn(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    pathname === '/settings'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Settings className="mr-3 h-4 w-4 shrink-0" />
                  Settings
                </Link>
              </div>
              <div className="mt-4">
                <UserNav />
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r px-4 pb-4">
          <div className="flex h-14 shrink-0 items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Icons.logo className="h-8 w-8 text-bull" />
              <span className="text-xl font-bold bg-gradient-to-r from-bull to-bear bg-clip-text text-transparent">
                Naly
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          <nav className="flex flex-1 flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-1">
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Main
                  </p>
                  <ul className="space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                            pathname === item.href
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-full bg-bull px-2 py-0.5 text-xs font-semibold text-white">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Advanced
                  </p>
                  <ul className="space-y-1">
                    {additionalNavigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                            pathname === item.href
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground',
                            item.restricted && 'opacity-60'
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          {item.restricted && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Pro
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>

            <div className="mt-auto pt-4 border-t">
              <div className="space-y-1">
                <Link
                  href="/settings"
                  onClick={onClose}
                  className={cn(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    pathname === '/settings'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <Settings className="mr-3 h-4 w-4 shrink-0" />
                  Settings
                </Link>
              </div>
              <div className="mt-4">
                <UserNav />
              </div>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}