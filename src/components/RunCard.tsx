import Link from 'next/link';
import { Activity, Calendar, Clock, FileText, TrendingUp, AlertCircle, CheckCircle2, XCircle, Target } from 'lucide-react';
import { AgentRole } from '@/lib/agents/types';

interface RunCardProps {
  run: {
    id: number;
    agentType: string;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
    output: any;
    editorReview: any;
    marketerOutput: any;
    predictionResults?: any;
  };
}

export function RunCard({ run }: RunCardProps) {
  const duration = run.endTime && run.startTime 
    ? Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000) + 's' 
    : '-';

  const date = run.startTime ? new Date(run.startTime).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '-';

  // Determine Status Color & Icon
  let statusColor = 'bg-gray-100 text-gray-700';
  let StatusIcon = Clock;
  if (run.status === 'COMPLETED') {
    statusColor = 'bg-green-50 text-green-700 border-green-100';
    StatusIcon = CheckCircle2;
  } else if (run.status === 'FAILED') {
    statusColor = 'bg-red-50 text-red-700 border-red-100';
    StatusIcon = XCircle;
  } else if (run.status === 'RUNNING') {
    statusColor = 'bg-blue-50 text-blue-700 border-blue-100';
    StatusIcon = Activity;
  }

  // Extract Content
  const title = run.agentType === 'REPORTER' 
    ? (run.output?.title || 'Generating Report...') 
    : (run.marketerOutput?.strategy || 'Marketing Campaign');
  
  const score = run.editorReview?.score;
  const views = run.marketerOutput?.predictedMetrics?.views;

  return (
    <Link href={`/admin/history/${run.id}`} className="block group">
      <div className="h-full bg-white rounded-2xl border border-gray-100 p-5 transition-all duration-200 hover:shadow-lg hover:border-blue-100 hover:-translate-y-1">
        
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${run.agentType === 'REPORTER' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
              {run.agentType === 'REPORTER' ? <FileText size={20} /> : <TrendingUp size={20} />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {run.agentType}
              </h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar size={12} /> {date}
              </p>
            </div>
          </div>
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
            <StatusIcon size={12} />
            {run.status}
          </span>
        </div>

        {/* Body */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <h4 className="text-sm font-medium text-gray-800 line-clamp-2 h-10 flex-1">
              {title}
            </h4>
            {run.predictionResults?.status === 'verified' && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium shrink-0">
                <Target size={10} />
                Verified
              </div>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500 mb-0.5">Duration</p>
              <p className="font-semibold text-gray-900">{duration}</p>
            </div>
            
            {run.agentType === 'REPORTER' ? (
               <div className={`rounded-lg p-2 text-center ${score >= 80 ? 'bg-green-50' : score >= 50 ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                 <p className="text-xs text-gray-500 mb-0.5">Quality Score</p>
                 <p className={`font-bold ${score >= 80 ? 'text-green-700' : score >= 50 ? 'text-yellow-700' : 'text-gray-700'}`}>
                   {score ? score : '-'}
                 </p>
               </div>
            ) : (
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Est. Views</p>
                <p className="font-bold text-purple-700">{views ? views.toLocaleString() : '-'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
