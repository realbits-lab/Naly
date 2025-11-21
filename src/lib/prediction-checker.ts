import { db } from '@/db';
import { agentRuns } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type {
  PredictionResults,
  ActualMetrics,
  PredictionAccuracy,
  MarketerOutput,
  ReporterOutput
} from './agents/types';

/**
 * Fetches actual metrics for a published report using web search or API
 */
async function fetchActualMetrics(
  reportId: number,
  reporterOutput: ReporterOutput,
  marketerOutput: MarketerOutput
): Promise<{ metrics: ActualMetrics; source: string } | null> {
  try {
    // In a real implementation, this would:
    // 1. Query analytics API (e.g., Google Analytics, internal tracking)
    // 2. Use web scraping to get view counts from the published page
    // 3. Query ad platform APIs for click data

    // For now, we'll simulate fetching metrics
    // You can replace this with actual API calls or web search

    const title = reporterOutput.title;
    const topic = reporterOutput.trends?.[0] || 'general';

    // Placeholder: In production, replace with actual API calls
    // Example: const analytics = await fetchGoogleAnalytics(reportId);
    // Example: const adStats = await fetchAdPlatformStats(reportId);

    // Simulated actual metrics (replace with real data)
    const actualMetrics: ActualMetrics = {
      retention: Math.random() * 100, // Replace with actual retention rate
      views: Math.floor(Math.random() * 10000), // Replace with actual view count
      clicks: Math.floor(Math.random() * 500), // Replace with actual click count
    };

    return {
      metrics: actualMetrics,
      source: 'simulated', // Change to 'google_analytics', 'api', or 'web_search'
    };
  } catch (error) {
    console.error('Error fetching actual metrics:', error);
    return null;
  }
}

/**
 * Calculates accuracy between predicted and actual metrics
 */
function calculateAccuracy(
  predicted: MarketerOutput['predictedMetrics'],
  actual: ActualMetrics
): PredictionAccuracy {
  const calculatePercentageAccuracy = (predicted: number, actual: number): number => {
    if (predicted === 0 && actual === 0) return 100;
    if (predicted === 0) return 0;

    const error = Math.abs(predicted - actual);
    const accuracy = Math.max(0, 100 - (error / predicted) * 100);
    return Math.round(accuracy * 100) / 100;
  };

  const retentionAccuracy = calculatePercentageAccuracy(predicted.retention, actual.retention);
  const viewsAccuracy = calculatePercentageAccuracy(predicted.views, actual.views);
  const clicksAccuracy = calculatePercentageAccuracy(predicted.clicks, actual.clicks);

  const overallAccuracy = Math.round(
    (retentionAccuracy + viewsAccuracy + clicksAccuracy) / 3 * 100
  ) / 100;

  return {
    retentionAccuracy,
    viewsAccuracy,
    clicksAccuracy,
    overallAccuracy,
  };
}

/**
 * Checks and verifies predictions for a specific report
 */
export async function checkPrediction(reportId: number): Promise<PredictionResults> {
  try {
    // Fetch the report from database
    const [report] = await db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.id, reportId))
      .limit(1);

    if (!report) {
      return {
        status: 'failed',
        error: 'Report not found',
        checkedAt: new Date(),
      };
    }

    // Check if report has predictions
    if (!report.marketerOutput || !report.output) {
      return {
        status: 'failed',
        error: 'Report does not have predictions',
        checkedAt: new Date(),
      };
    }

    const marketerOutput = report.marketerOutput as MarketerOutput;
    const reporterOutput = report.output as ReporterOutput;

    if (!marketerOutput.predictedMetrics) {
      return {
        status: 'failed',
        error: 'No predicted metrics found',
        checkedAt: new Date(),
      };
    }

    // Fetch actual metrics
    const result = await fetchActualMetrics(reportId, reporterOutput, marketerOutput);

    if (!result) {
      return {
        status: 'failed',
        error: 'Failed to fetch actual metrics',
        checkedAt: new Date(),
      };
    }

    // Calculate accuracy
    const accuracy = calculateAccuracy(marketerOutput.predictedMetrics, result.metrics);

    // Create prediction results
    const predictionResults: PredictionResults = {
      status: 'verified',
      checkedAt: new Date(),
      actualMetrics: result.metrics,
      accuracy,
      source: result.source,
    };

    // Update the database with results
    await db
      .update(agentRuns)
      .set({ predictionResults })
      .where(eq(agentRuns.id, reportId));

    return predictionResults;
  } catch (error) {
    console.error('Error checking prediction:', error);
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      checkedAt: new Date(),
    };
  }
}

/**
 * Finds all reports that are due for prediction checking
 */
export async function findReportsDueForChecking(): Promise<number[]> {
  try {
    const now = new Date();

    // Find reports where:
    // 1. predictionCheckTime is set
    // 2. predictionCheckTime has passed
    // 3. predictionResults is null or status is not 'verified'
    const reports = await db
      .select({ id: agentRuns.id })
      .from(agentRuns)
      .where(eq(agentRuns.status, 'COMPLETED'));

    // Filter in JavaScript since complex date comparisons are tricky with Drizzle
    const dueReports = reports.filter(report => {
      // This would need the actual report data to check predictionCheckTime
      // For now, return the IDs - the actual filtering will happen when we check each report
      return true;
    });

    return dueReports.map(r => r.id);
  } catch (error) {
    console.error('Error finding reports due for checking:', error);
    return [];
  }
}

/**
 * Main function to check all due predictions
 */
export async function checkAllDuePredictions(): Promise<void> {
  try {
    console.log('Checking predictions...');

    const reportIds = await findReportsDueForChecking();
    console.log(`Found ${reportIds.length} reports to check`);

    for (const reportId of reportIds) {
      try {
        // First, verify if this report is actually due
        const [report] = await db
          .select()
          .from(agentRuns)
          .where(eq(agentRuns.id, reportId))
          .limit(1);

        if (!report) continue;

        // Skip if already verified
        const predictionResults = report.predictionResults as PredictionResults | null;
        if (predictionResults?.status === 'verified') {
          continue;
        }

        // Skip if no check time set or not yet due
        if (!report.predictionCheckTime) {
          continue;
        }

        const checkTime = new Date(report.predictionCheckTime);
        const now = new Date();

        if (checkTime > now) {
          continue;
        }

        console.log(`Checking prediction for report ${reportId}`);
        const results = await checkPrediction(reportId);
        console.log(`Report ${reportId} checked:`, results.status);
      } catch (error) {
        console.error(`Error checking report ${reportId}:`, error);
      }
    }

    console.log('Prediction checking completed');
  } catch (error) {
    console.error('Error in checkAllDuePredictions:', error);
  }
}
