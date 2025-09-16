'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Search,
  Bell,
  Plus,
  RefreshCw,
  Settings,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function TopNavigation() {
  const [open, setOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const pathname = usePathname()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard'
      case '/portfolio':
        return 'Portfolio'
      case '/market':
        return 'Market Data'
      case '/analytics':
        return 'Analytics'
      case '/predictions':
        return 'Predictions'
      case '/narratives':
        return 'Narratives'
      case '/visualizations':
        return 'Visualizations'
      case '/community':
        return 'Community'
      case '/settings':
        return 'Settings'
      default:
        return 'Naly'
    }
  }

  const marketIndicators = [
    { symbol: 'SPY', price: '+0.85%', trend: 'up' },
    { symbol: 'QQQ', price: '+1.23%', trend: 'up' },
    { symbol: 'VIX', price: '-2.14%', trend: 'down' },
  ]

  return (
    <>
      <div className="flex flex-1 items-center justify-between">
        {/* Left side - Title and market indicators */}
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {getPageTitle()}
            </h1>
          </div>

          {/* Market indicators - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-3">
            {marketIndicators.map((indicator) => (
              <div key={indicator.symbol} className="flex items-center space-x-1">
                <span className="text-sm text-muted-foreground">
                  {indicator.symbol}
                </span>
                <Badge
                  variant={indicator.trend === 'up' ? 'default' : 'destructive'}
                  className={cn(
                    'text-xs',
                    indicator.trend === 'up' ? 'bg-bull/10 text-bull border-bull/20' : 'bg-bear/10 text-bear border-bear/20'
                  )}
                >
                  {indicator.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {indicator.price}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <Button
            variant="outline"
            size="sm"
            className="relative h-8 w-8 p-0 lg:h-9 lg:w-60 lg:justify-start lg:px-3 lg:py-2"
            onClick={() => setOpen(true)}
          >
            <Search className="h-4 w-4 lg:mr-2" />
            <span className="hidden lg:inline-flex">Search markets...</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Quick actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isRefreshing && "animate-spin"
            )} />
            <span className="sr-only">Refresh data</span>
          </Button>

          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add widget</span>
          </Button>

          {/* Notifications */}
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-bull">
              3
            </Badge>
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Live indicator */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-md bg-bull/10 border border-bull/20">
            <Activity className="h-3 w-3 text-bull animate-pulse" />
            <span className="text-xs font-medium text-bull">Live</span>
          </div>
        </div>
      </div>

      {/* Command dialog for search */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search for stocks, crypto, or commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Stocks">
            <CommandItem>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Apple Inc. (AAPL)</span>
            </CommandItem>
            <CommandItem>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>Microsoft Corporation (MSFT)</span>
            </CommandItem>
            <CommandItem>
              <TrendingUp className="mr-2 h-4 w-4" />
              <span>NVIDIA Corporation (NVDA)</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Commands">
            <CommandItem>
              <Zap className="mr-2 h-4 w-4" />
              <span>Generate Prediction</span>
            </CommandItem>
            <CommandItem>
              <Activity className="mr-2 h-4 w-4" />
              <span>Create Narrative</span>
            </CommandItem>
            <CommandItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Open Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}