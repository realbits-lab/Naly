'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Settings,
  PenTool,
  Newspaper,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export type SidebarTab = 'manage' | 'create' | 'news' | 'monitor'

interface WriteSidebarProps {
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

const sidebarItems = [
  {
    id: 'manage' as SidebarTab,
    label: 'Manage',
    icon: Settings,
    description: 'Article Management'
  },
  {
    id: 'create' as SidebarTab,
    label: 'Create',
    icon: PenTool,
    description: 'Custom Content Creation'
  },
  {
    id: 'news' as SidebarTab,
    label: 'News',
    icon: Newspaper,
    description: 'Latest News Creation'
  },
  {
    id: 'monitor' as SidebarTab,
    label: 'Monitor',
    icon: Activity,
    description: 'Real-time Monitoring'
  }
]

export function WriteSidebar({ activeTab, onTabChange, isCollapsed, onToggleCollapse }: WriteSidebarProps) {
  return (
    <div className={cn(
      "flex flex-col bg-card border-r border-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-foreground">Studio</h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md hover:bg-muted transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id

            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all duration-200",
                    "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={isCollapsed ? item.description : undefined}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary-foreground" : ""
                  )} />
                  {!isCollapsed && (
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      <span className={cn(
                        "text-xs",
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </span>
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            AI-Powered Writing Studio
          </div>
        </div>
      )}
    </div>
  )
}