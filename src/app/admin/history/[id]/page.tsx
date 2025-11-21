import { db } from '@/db';
import { agentRuns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function RunDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const runId = parseInt(id);
  if (isNaN(runId)) notFound();

  const run = await db.select().from(agentRuns).where(eq(agentRuns.id, runId)).limit(1);
  if (run.length === 0) notFound();
  
  const data = run[0];
  const output = data.output as any;
  const review = data.editorReview as any;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Run #{data.id} Details</h1>
          <p className="text-gray-500">{data.agentType} • {data.startTime ? new Date(data.startTime).toLocaleString() : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
            data.status === 'FAILED' ? 'bg-red-100 text-red-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {data.status}
          </span>
          {review?.score && (
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              review.score >= 80 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              Score: {review.score}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Output Section */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Generated Output</h2>
            {output ? (
              <div className="prose max-w-none">
                {output.title && <h3 className="text-xl font-bold mb-2">{output.title}</h3>}
                {output.content && <div className="whitespace-pre-wrap text-gray-700">{output.content}</div>}
                {output.strategy && (
                  <div className="mt-4">
                    <h4 className="font-bold">Strategy</h4>
                    <p className="text-gray-700">{output.strategy}</p>
                  </div>
                )}
                {!output.title && !output.content && !output.strategy && (
                  <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto text-xs">
                    {JSON.stringify(output, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">No output generated.</p>
            )}
          </div>
        </div>

        {/* Editor Review Section */}
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Editor Review</h2>
            {review ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Status</span>
                  <span className={`font-bold uppercase ${
                    review.status === 'approved' ? 'text-green-600' : 
                    review.status === 'rejected' ? 'text-red-600' : 'text-orange-600'
                  }`}>{review.status}</span>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Feedback</h3>
                  <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{review.feedback}</p>
                </div>

                {review.changes && review.changes.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Suggested Changes</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      {review.changes.map((change: string, i: number) => (
                        <li key={i}>{change}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 italic">No review available.</p>
            )}
          </div>

          {/* Logs Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Execution Logs</h2>
            {data.logs ? (
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto max-h-60 overflow-y-auto">
                {(data.logs as any[]).map((log: any, i: number) => (
                  <div key={i} className="mb-1">
                    <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 italic">No logs available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
