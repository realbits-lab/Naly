'use client'

import { useState } from 'react'
import { WriteSidebar, type SidebarTab } from '@/components/articles/write-sidebar'
import { ManagePanel } from '@/components/articles/panels/manage-panel'
import { CreatePanel } from '@/components/articles/panels/create-panel'
import { NewsPanel } from '@/components/articles/panels/news-panel'
import { MonitorPanel } from '@/components/articles/panels/monitor-panel'

export function WritePageClient() {
  const [activeTab, setActiveTab] = useState<SidebarTab>('create')
  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab)
  }

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const renderActivePanel = () => {
    switch (activeTab) {
      case 'manage':
        return <ManagePanel />
      case 'create':
        return <CreatePanel />
      case 'news':
        return <NewsPanel />
      case 'monitor':
        return <MonitorPanel />
      default:
        return <CreatePanel />
    }
  }

  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <WriteSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Area */}
      <div className="flex-1 bg-background">
        {renderActivePanel()}
      </div>
    </div>
  )
}