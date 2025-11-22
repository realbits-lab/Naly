import { db } from '../db';
import { agentConfigs, agentRuns } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import cronParser from 'cron-parser';
import { runReporterWorkflow } from './agents/reporter';
import { runMarketer, calculateROI } from './agents/marketer';
import { runEditor } from './agents/editor';
import { runDesigner } from './agents/designer';
import { ReporterInput, MarketerInput, ReporterOutput, MarketerOutput, EditorOutput } from './agents/types';

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
  // 1. Create Run Record
  const [run] = await db.insert(agentRuns).values({
    agentType: type,
    status: 'RUNNING',
    startTime: new Date(),
  }).returning();

  try {
    let output: any;
    let editorReview: EditorOutput | null = null;
    let designerOutput: any | null = null;
    let marketerOutput: any | null = null;

    // Token tracking
    let reporterTokens = 0;
    let editorTokens = 0;
    let designerTokens = 0;
    let marketerTokens = 0;

    // 2. Run Agent
    if (type === 'REPORTER') {
      // A. Run Reporter
      const reporterResult = await runReporterWorkflow(params as ReporterInput);
      output = reporterResult.output;
      reporterTokens = reporterResult.tokensUsed;

      // B. Run Editor
      const editorResult = await runEditor({ originalContent: output as ReporterOutput });
      editorReview = editorResult.output;
      editorTokens = editorResult.tokensUsed;

      // C. Run Designer (if Editor approved or revised, but let's run it anyway for the flow)
      // Ideally we only design if approved, but for this demo we chain all.
      if (editorReview) {
          const designerResult = await runDesigner({ content: editorReview });
          designerOutput = designerResult.output;
          designerTokens = designerResult.tokensUsed;
      }

      // Calculate total tokens
      const totalTokens = reporterTokens + editorTokens + designerTokens;

      // 3. Update Run with Output and Token Usage
      await db.update(agentRuns).set({
        status: 'COMPLETED',
        endTime: new Date(),
        output: output,
        editorReview: editorReview,
        designerOutput: designerOutput,
        reporterTokens,
        editorTokens,
        designerTokens,
        totalTokens,
      }).where(eq(agentRuns.id, run.id));

    } else if (type === 'MARKETER') {
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

         const marketerResult = await runMarketer({
             content: review,
             assets: assets
         });
         output = marketerResult.output;
         marketerOutput = output;
         marketerTokens = marketerResult.tokensUsed;

         // Get total tokens from the reporter run
         const reportRunTotalTokens = lastReportRun[0].totalTokens || 0;
         const totalTokens = reportRunTotalTokens + marketerTokens;

         // Calculate ROI based on predicted clicks
         const predictedClicks = (marketerOutput as MarketerOutput).predictedMetrics.clicks;
         const { estimatedCost, estimatedRevenue, roi } = calculateROI(totalTokens, predictedClicks);

         // Update the marketer run
         await db.update(agentRuns).set({
           status: 'COMPLETED',
           endTime: new Date(),
           marketerOutput: marketerOutput,
           marketerTokens,
           totalTokens: marketerTokens,
         }).where(eq(agentRuns.id, run.id));

         // Update the reporter run with ROI data
         await db.update(agentRuns).set({
           marketerOutput: marketerOutput,
           marketerTokens,
           totalTokens,
           estimatedCost: estimatedCost.toFixed(6),
           adRevenue: estimatedRevenue.toFixed(2),
           roi: roi.toFixed(2),
         }).where(eq(agentRuns.id, lastReportRun[0].id));

      } else {
          throw new Error('No recent complete report (with Editor & Designer output) found to market');
      }
    }

  } catch (error: any) {
    console.error(`Error running agent ${type}:`, error);
    await db.update(agentRuns).set({
      status: 'FAILED',
      endTime: new Date(),
      logs: [{ message: error.message, timestamp: new Date().toISOString() }],
    }).where(eq(agentRuns.id, run.id));
  }
}
