import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { agentConfigs, agentRuns } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Play, Pause, Activity } from 'lucide-react';
import { runAgentManually } from '@/app/actions';
import Link from 'next/link';
import { RunCard } from '@/components/RunCard';

// Cache agent configs query for 5 minutes
const getCachedConfigs = unstable_cache(
  async () => db.select().from(agentConfigs),
  ['agent-configs'],
  {
    revalidate: 300, // 5 minutes
    tags: ['agent-configs'],
  }
);

// Cache recent runs query for 1 minute
const getCachedRecentRuns = unstable_cache(
  async () => db.select().from(agentRuns).orderBy(desc(agentRuns.startTime)).limit(10),
  ['recent-runs'],
  {
    revalidate: 60, // 1 minute
    tags: ['agent-runs'],
  }
);

export default async function DashboardPage() {
  const configs = await getCachedConfigs();
  const recentRuns = await getCachedRecentRuns();

  const reporterConfig = configs.find(c => c.type === 'REPORTER');
  const marketerConfig = configs.find(c => c.type === 'MARKETER');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Reporter Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="text-blue-500" /> Reporter Agent
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${reporterConfig?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {reporterConfig?.status || 'NOT CONFIGURED'}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>Schedule: <span className="font-medium text-gray-900">{reporterConfig?.schedule || 'Not set'}</span></p>
            <p>Topic: <span className="font-medium text-gray-900">{(reporterConfig?.params as any)?.topic || '-'}</span></p>
          </div>
          <div className="mt-6">
            <form action={async () => {
              'use server';
              await runAgentManually('REPORTER');
            }}>
              <button className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors">
                <Play size={16} /> Run Now
              </button>
            </form>
          </div>
        </div>

        {/* Marketer Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="text-purple-500" /> Marketer Agent
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${marketerConfig?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {marketerConfig?.status || 'NOT CONFIGURED'}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>Schedule: <span className="font-medium text-gray-900">{marketerConfig?.schedule || 'Not set'}</span></p>
            <p>Audience: <span className="font-medium text-gray-900">{(marketerConfig?.params as any)?.targetAudience || '-'}</span></p>
          </div>
          <div className="mt-6">
            <form action={async () => {
              'use server';
              await runAgentManually('MARKETER');
            }}>
              <button className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 transition-colors">
                <Play size={16} /> Run Now
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
          <Link href="/admin/history" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentRuns.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
        
        {recentRuns.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">No recent runs found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
