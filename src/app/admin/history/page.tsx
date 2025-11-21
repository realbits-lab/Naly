import { db } from '@/db';
import { agentRuns } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Link from 'next/link';

export default async function HistoryPage() {
  const runs = await db.select().from(agentRuns).orderBy(desc(agentRuns.startTime)).limit(50);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Run History</h1>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Agent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Started At</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Editor Score</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.map((run) => {
                const duration = run.endTime && run.startTime 
                  ? Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000) + 's' 
                  : '-';
                  
                return (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">#{run.id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{run.agentType}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        run.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                        run.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">{run.startTime ? new Date(run.startTime).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4">{duration}</td>
                    <td className="px-6 py-4">
                      {(run.editorReview as any)?.score ? (
                        <span className={`font-bold ${(run.editorReview as any).score >= 80 ? 'text-green-600' : 'text-orange-500'}`}>
                          {(run.editorReview as any).score}/100
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/history/${run.id}`} className="text-indigo-600 hover:text-indigo-900">
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
