import { z } from 'zod';

export type AgentRole = 'reporter' | 'editor' | 'designer' | 'marketer';

export interface AgentState {
  role: AgentRole;
  status: 'idle' | 'working' | 'completed' | 'failed';
  output?: any;
  error?: string;
}

// Reporter Types
export const ReporterInputSchema = z.object({
  topic: z.enum(['stock', 'coin', 'sports', 'politics']),
  region: z.enum(['US', 'KR']).optional(),
});
export type ReporterInput = z.infer<typeof ReporterInputSchema>;

export interface DataTable {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}

export interface ChartData {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: {
    name: string;
    [key: string]: string | number;
  }[];
  xKey?: string;
  yKeys?: string[];
}

export interface ReporterOutput {
  title: string;
  content: string;
  trends: string[];
  sources: string[];
  dataTables?: DataTable[];
  charts?: ChartData[];
}

// Editor Types
export interface EditorInput {
  originalContent: ReporterOutput;
}

export interface EditorOutput {
  title: string;
  content: string;
  changes: string[];
  score: number;
  feedback: string;
  status: 'approved' | 'revised' | 'rejected';
}

// Designer Types
export interface DesignerInput {
  content: EditorOutput;
}

export interface DesignerOutput {
  assets: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt: string;
  }[];
  layoutSuggestion: string;
}

// Marketer Types
export interface MarketerInput {
  content: EditorOutput;
  assets: DesignerOutput;
}

export interface MarketerOutput {
  adPlacements: {
    position: string;
    type: string;
  }[];
  predictedMetrics: {
    retention: number;
    views: number;
    clicks: number;
  };
  strategy: string;
}
