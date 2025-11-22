export interface AIReporter {
  id: number;
  name: string;
  personality: string;
  memory: ReporterMemory[];
  avatar?: string;
  specialty?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReporterMemory {
  timestamp: string;
  event: string;
  context: string;
  articleId?: number;
}

export interface Reply {
  id: number;
  articleId: number;
  reporterId: number;
  content: string;
  parentReplyId?: number;
  createdAt: Date;
  reporter?: AIReporter;
  replies?: Reply[]; // Nested replies
}

export interface CreateReporterInput {
  name: string;
  personality: string;
  avatar?: string;
  specialty?: string;
}

export interface UpdateReporterInput {
  name?: string;
  personality?: string;
  avatar?: string;
  specialty?: string;
  memory?: ReporterMemory[];
}

export interface CreateReplyInput {
  articleId: number;
  reporterId: number;
  content: string;
  parentReplyId?: number;
}
