import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { agentConfigs, agentRuns, cronExecutions } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { Play, Pause, Activity, Clock, TestTube, DollarSign, Zap, TrendingUp, BarChart } from 'lucide-react';
import { runAgentManually, testCronEndpoint } from '@/app/actions';
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

// Cache recent cron executions query for 1 minute
const getCachedRecentCronExecutions = unstable_cache(
  async () => db.select().from(cronExecutions).orderBy(desc(cronExecutions.startTime)).limit(1),
  ['recent-cron-executions'],
  {
    revalidate: 60, // 1 minute
    tags: ['cron-executions'],
  }
);

export default async function DashboardPage() {
  const configs = await getCachedConfigs();
  const recentRuns = await getCachedRecentRuns();
  const recentCronExecutions = await getCachedRecentCronExecutions();

  const reporterConfig = configs.find(c => c.type === 'REPORTER');
  const marketerConfig = configs.find(c => c.type === 'MARKETER');
  const lastCronExecution = recentCronExecutions[0] || null;

  // Calculate next run time (every hour on the hour)
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setHours(now.getHours() + 1, 0, 0, 0);

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  };

  // Calculate token usage statistics
  const completedRuns = await db.select().from(agentRuns).where(eq(agentRuns.status, 'COMPLETED'));

  const totalTokens = completedRuns.reduce((sum, run) => sum + (run.totalTokens || 0), 0);
  const totalCost = completedRuns.reduce((sum, run) => sum + parseFloat(run.estimatedCost || '0'), 0);
  const totalRevenue = completedRuns.reduce((sum, run) => sum + parseFloat(run.adRevenue || '0'), 0);
  const avgROI = completedRuns.length > 0
    ? completedRuns.reduce((sum, run) => sum + parseFloat(run.roi || '0'), 0) / completedRuns.length
    : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Cron Status Card */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-sm border border-indigo-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="text-indigo-500" /> Automated Scheduling
          </h3>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            ACTIVE
          </span>
        </div>

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p>Vercel Cron: <span className="font-medium text-gray-900">Every hour</span></p>
          <p>Next Run: <span className="font-medium text-gray-900">{formatDateTime(nextRun)}</span></p>
          <p>Last Execution: <span className="font-medium text-gray-900">{formatDateTime(lastCronExecution?.startTime || null)}</span></p>
          {lastCronExecution && (
            <>
              <p>Status: <span className={`font-medium ${lastCronExecution.status === 'SUCCESS' ? 'text-green-700' : 'text-red-700'}`}>{lastCronExecution.status}</span></p>
              <p>Jobs Triggered: <span className="font-medium text-gray-900">{lastCronExecution.jobsTriggered || 0}</span></p>
              {lastCronExecution.duration && (
                <p>Duration: <span className="font-medium text-gray-900">{lastCronExecution.duration}ms</span></p>
              )}
            </>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <form action={async () => {
            'use server';
            await testCronEndpoint();
          }}>
            <button className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
              <TestTube size={16} /> Test Cron Endpoint
            </button>
          </form>
          <a
            href="https://vercel.com/docs/cron-jobs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Docs →
          </a>
        </div>
      </div>

      {/* Token Usage & ROI Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Zap size={18} />
            <span className="text-xs font-semibold uppercase">Total Tokens</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalTokens.toLocaleString()}</p>
          <p className="text-xs text-blue-600 mt-1">{completedRuns.length} completed runs</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-red-50 to-red-100 p-4 border border-red-200">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <DollarSign size={18} />
            <span className="text-xs font-semibold uppercase">Total Cost</span>
          </div>
          <p className="text-2xl font-bold text-red-900">${totalCost.toFixed(4)}</p>
          <p className="text-xs text-red-600 mt-1">Token expenses</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-semibold uppercase">Est. Revenue</span>
          </div>
          <p className="text-2xl font-bold text-green-900">${totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">From predicted ads</p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <BarChart size={18} />
            <span className="text-xs font-semibold uppercase">Avg ROI</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{avgROI.toFixed(1)}%</p>
          <p className="text-xs text-purple-600 mt-1">Return on investment</p>
        </div>
      </div>

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
