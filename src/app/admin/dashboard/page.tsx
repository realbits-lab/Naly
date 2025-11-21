import { db } from '@/db';
import { agentConfigs, agentRuns } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Play, Pause, Activity } from 'lucide-react';
import { runAgentManually } from '@/app/actions';
import Link from 'next/link';

export default async function DashboardPage() {
  const configs = await db.select().from(agentConfigs);
  const recentRuns = await db.select().from(agentRuns).orderBy(desc(agentRuns.startTime)).limit(10);

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
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3">Agent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Started At</th>
                <th className="px-6 py-3">Editor Score</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentRuns.map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4">
                    {(run.editorReview as any)?.score ? (
                      <span className={`font-bold ${(run.editorReview as any).score >= 80 ? 'text-green-600' : 'text-orange-500'}`}>
                        {(run.editorReview as any).score}/100
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/history/${run.id}`} className="text-indigo-600 hover:text-indigo-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {recentRuns.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No recent runs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
