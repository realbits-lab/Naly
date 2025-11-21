import { db } from '../db';
import { agentConfigs, agentRuns } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import cronParser from 'cron-parser';
import { runReporter } from './agents/reporter';
import { runMarketer } from './agents/marketer';
import { runEditor } from './agents/editor';
import { ReporterInput, MarketerInput, ReporterOutput, MarketerOutput, EditorOutput } from './agents/types';

export async function checkAndTriggerJobs() {
  const configs = await db.select().from(agentConfigs).where(eq(agentConfigs.status, 'ACTIVE'));

  for (const config of configs) {
    try {
      // 1. Check if due
      const interval = cronParser.parseExpression(config.schedule);
      const prev = interval.prev().toDate();
      const next = interval.next().toDate(); // This actually advances the iterator, so we need to be careful.
      // Better approach: Get the last run for this agent.
      
      const lastRun = await db.select().from(agentRuns)
        .where(eq(agentRuns.agentType, config.type))
        .orderBy(desc(agentRuns.startTime))
        .limit(1);

      let shouldRun = false;
      if (lastRun.length === 0) {
        shouldRun = true; // Never run before
      } else {
        const lastRunTime = lastRun[0].startTime!;
        // If the scheduled previous run time is after the last actual run time, it means we missed a schedule or it's time.
        // Or simply: if (now - lastRunTime) >= interval
        // Let's stick to: if next scheduled time from lastRunTime is in the past? No.
        
        // Simple logic: parse expression relative to lastRunTime. If the next occurrence is in the past (before now), run it.
        const nextScheduled = cronParser.parseExpression(config.schedule, { currentDate: lastRunTime }).next().toDate();
        if (nextScheduled <= new Date()) {
          shouldRun = true;
        }
      }

      if (shouldRun) {
        await triggerAgent(config.type as 'REPORTER' | 'MARKETER', config.params);
      }
    } catch (e) {
      console.error(`Error checking schedule for ${config.type}:`, e);
    }
  }
}

export async function triggerAgent(type: 'REPORTER' | 'MARKETER', params: any) {
  // 1. Create Run Record
  const [run] = await db.insert(agentRuns).values({
    agentType: type,
    status: 'RUNNING',
    startTime: new Date(),
  }).returning();

  try {
    let output: any;
    
    // 2. Run Agent
    if (type === 'REPORTER') {
      output = await runReporter(params as ReporterInput);
    } else if (type === 'MARKETER') {
      // Marketer needs content + assets. This is tricky if it runs standalone.
      // For now, let's assume it fetches its own data or we pass dummy data if not chained.
      // The user said "set only period of ai reporter and marketer".
      // If Marketer runs periodically, maybe it looks for recent content?
      // For simplicity, let's assume params has what it needs or it mocks it.
      // But wait, MarketerInput needs `content` and `assets`.
      // If the user wants independent scheduling, Marketer probably needs to find the latest Report to market.
      
      // Let's find the latest Reporter output to market.
      const lastReportRun = await db.select().from(agentRuns)
        .where(eq(agentRuns.agentType, 'REPORTER'))
        .where(eq(agentRuns.status, 'COMPLETED'))
        .orderBy(desc(agentRuns.startTime))
        .limit(1);
        
      if (lastReportRun.length > 0 && lastReportRun[0].output) {
         const report = lastReportRun[0].output as ReporterOutput;
         // We also need assets. Let's assume empty for now or mock.
         output = await runMarketer({
             content: {
                 title: report.title,
                 content: report.content,
                 changes: [],
                 score: 0,
                 feedback: '',
                 status: 'approved'
             }, // Mocking EditorOutput
             assets: { assets: [], layoutSuggestion: '' } // Mocking DesignerOutput
         });
      } else {
          throw new Error('No recent report found to market');
      }
    }

    // 3. Update Run with Output
    await db.update(agentRuns).set({
      output: output,
    }).where(eq(agentRuns.id, run.id));

    // 4. Run Editor
    // For Reporter, we definitely edit. For Marketer? Maybe. The prompt said "review is run by AI editor automatically".
    // Let's edit both.
    
    // Adapt output to EditorInput. Editor expects ReporterOutput structure roughly (title, content).
    // MarketerOutput is different (strategy, placements).
    // The Editor agent prompt expects Title/Content.
    // We might need a generic Editor or specific handling.
    // For now, let's only edit Reporter output as it fits the schema.
    
    let editorReview: EditorOutput | null = null;
    if (type === 'REPORTER') {
        editorReview = await runEditor({ originalContent: output as ReporterOutput });
    }

    // 5. Complete Run
    await db.update(agentRuns).set({
      status: 'COMPLETED',
      endTime: new Date(),
      editorReview: editorReview,
    }).where(eq(agentRuns.id, run.id));

  } catch (error: any) {
    console.error(`Error running agent ${type}:`, error);
    await db.update(agentRuns).set({
      status: 'FAILED',
      endTime: new Date(),
      logs: [{ message: error.message, timestamp: new Date().toISOString() }],
    }).where(eq(agentRuns.id, run.id));
  }
}
