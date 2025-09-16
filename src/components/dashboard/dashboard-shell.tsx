'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { TopNavigation } from './top-navigation'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

interface DashboardShellProps {
  children: React.ReactNode
  className?: string
}

export function DashboardShell({ children, className }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>

            <TopNavigation />
          </div>
        </div>

        {/* Page content */}
        <main
          className={cn(
            "flex-1 p-4 sm:p-6 lg:p-8",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}