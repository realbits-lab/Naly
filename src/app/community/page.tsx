import { Suspense } from 'react'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { CommunityOverview } from '@/components/community/community-overview'
import { FeaturedDiscussions } from '@/components/community/featured-discussions'
import { ActiveChallenges } from '@/components/community/active-challenges'
import { TopContributors } from '@/components/community/top-contributors'
import { QuickActions } from '@/components/community/quick-actions'

export const metadata = {
  title: 'Community - Naly',
  description: 'Connect with fellow traders, share insights, and participate in challenges on Naly\'s financial intelligence community.'
}

export default async function CommunityPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community</h1>
            <p className="text-muted-foreground mt-2">
              Connect with fellow traders, share insights, and grow together
            </p>
          </div>

          <QuickActions userId={session.user.id} />
        </div>
      </div>

      {/* Community Overview */}
      <Suspense fallback={<CommunityOverview.Skeleton />}>
        <CommunityOverview userId={session.user.id} />
      </Suspense>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <Suspense fallback={<FeaturedDiscussions.Skeleton />}>
            <FeaturedDiscussions userId={session.user.id} />
          </Suspense>

          <Suspense fallback={<ActiveChallenges.Skeleton />}>
            <ActiveChallenges userId={session.user.id} />
          </Suspense>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          <Suspense fallback={<TopContributors.Skeleton />}>
            <TopContributors />
          </Suspense>
        </div>
      </div>
    </div>
  )
}