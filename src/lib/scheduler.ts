import { db } from '../db';
import { agentConfigs, agentRuns } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import cronParser from 'cron-parser';
import { runReporter } from './agents/reporter';
import { runMarketer } from './agents/marketer';
import { runEditor } from './agents/editor';
import { runDesigner } from './agents/designer';
import { ReporterInput, MarketerInput, ReporterOutput, MarketerOutput, EditorOutput } from './agents/types';
import { getRandomReporter, addReporterMemory } from './services/reporter-selector';

export async function checkAndTriggerJobs() {
  const configs = await db.select().from(agentConfigs).where(eq(agentConfigs.status, 'ACTIVE'));

  for (const config of configs) {
    try {
      // 1. Check if due
      const interval = cronParser.parse(config.schedule);
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
        const nextScheduled = cronParser.parse(config.schedule, { currentDate: lastRunTime }).next().toDate();
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
  try {
    let output: any;
    let editorReview: EditorOutput | null = null;
    let designerOutput: any | null = null;
    let marketerOutput: any | null = null;
    let reporterId: number | null = null;

    // 2. Run Agent
    if (type === 'REPORTER') {
      // A. Get or select a random reporter
      const reporter = await getRandomReporter(params.topic);
      reporterId = reporter.id;

      // 1. Create Run Record with reporter
      const [run] = await db.insert(agentRuns).values({
        agentType: type,
        reporterId: reporter.id,
        status: 'RUNNING',
        startTime: new Date(),
      }).returning();

      try {
        // B. Run Reporter with personality
        const reporterInput: ReporterInput = {
          ...params,
          reporter: {
            id: reporter.id,
            name: reporter.name,
            personality: reporter.personality,
            memory: reporter.memory as any[],
          },
        };
        output = await runReporter(reporterInput);
      
        // C. Run Editor
        editorReview = await runEditor({ originalContent: output as ReporterOutput });

        // D. Run Designer (if Editor approved or revised, but let's run it anyway for the flow)
        // Ideally we only design if approved, but for this demo we chain all.
        if (editorReview) {
            designerOutput = await runDesigner({ content: editorReview });
        }

        // 3. Update Run with Output
        await db.update(agentRuns).set({
          status: 'COMPLETED',
          endTime: new Date(),
          output: output,
          editorReview: editorReview,
          designerOutput: designerOutput,
        }).where(eq(agentRuns.id, run.id));

        // E. Update reporter's memory
        await addReporterMemory(
          reporter.id,
          'article_created',
          `Created article: "${output.title}" about ${params.topic}`,
          run.id
        );

      } catch (error: any) {
        console.error(`Error running REPORTER agent:`, error);
        await db.update(agentRuns).set({
          status: 'FAILED',
          endTime: new Date(),
          logs: [{ message: error.message, timestamp: new Date().toISOString() }],
        }).where(eq(agentRuns.id, run.id));
      }

    } else if (type === 'MARKETER') {
      // 1. Create Run Record (no reporter for marketer)
      const [run] = await db.insert(agentRuns).values({
        agentType: type,
        status: 'RUNNING',
        startTime: new Date(),
      }).returning();

      try {
        // Marketer needs content + assets.
        // Find the latest Reporter output to market.
        const lastReportRun = await db.select().from(agentRuns)
          .where(and(
            eq(agentRuns.agentType, 'REPORTER'),
            eq(agentRuns.status, 'COMPLETED')
          ))
          .orderBy(desc(agentRuns.startTime))
          .limit(1);

        if (lastReportRun.length > 0 && lastReportRun[0].editorReview && lastReportRun[0].designerOutput) {
           const review = lastReportRun[0].editorReview as EditorOutput;
           const assets = lastReportRun[0].designerOutput as any; // Cast to DesignerOutput

           output = await runMarketer({
               content: review,
               assets: assets
           });
           marketerOutput = output;
        } else {
            throw new Error('No recent complete report (with Editor & Designer output) found to market');
        }

        // 3. Update Run with Output
        await db.update(agentRuns).set({
          status: 'COMPLETED',
          endTime: new Date(),
          marketerOutput: marketerOutput,
        }).where(eq(agentRuns.id, run.id));

      } catch (error: any) {
        console.error(`Error running MARKETER agent:`, error);
        await db.update(agentRuns).set({
          status: 'FAILED',
          endTime: new Date(),
          logs: [{ message: error.message, timestamp: new Date().toISOString() }],
        }).where(eq(agentRuns.id, run.id));
      }
    }
  } catch (error: any) {
    console.error(`Error in triggerAgent ${type}:`, error);
  }
}
