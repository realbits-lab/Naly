import { unstable_cache } from 'next/cache';
import { db } from '@/db';
import { agentRuns } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { RunCard } from '@/components/RunCard';

// Cache history runs query for 1 minute
const getCachedHistoryRuns = unstable_cache(
  async () => db.select().from(agentRuns).orderBy(desc(agentRuns.startTime)).limit(50),
  ['history-runs'],
  {
    revalidate: 60, // 1 minute
    tags: ['agent-runs', 'history'],
  }
);

export default async function HistoryPage() {
  const runs = await getCachedHistoryRuns();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Run History</h1>
        <span className="text-sm text-gray-500">Last 50 runs</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {runs.map((run) => (
          <RunCard key={run.id} run={run} />
        ))}
      </div>
      
      {runs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-500">No runs found yet.</p>
        </div>
      )}
    </div>
  );
}
