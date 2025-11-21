import { db } from '../../db';
import { agentRuns } from '../../db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { ReporterOutput } from '../agents/types';

export interface PreviousReport {
  id: number;
  title: string;
  trends: string[];
  createdAt: Date;
}

/**
 * Fetches recent reports for a given topic to check for duplicates
 * @param topic - The topic to check (e.g., 'stock', 'coin', 'sports', 'politics')
 * @param hoursBack - How many hours back to check for duplicates (default: 24)
 * @param limit - Maximum number of reports to return (default: 10)
 * @returns Array of previous reports with id, title, trends, and creation date
 */
export async function getRecentReports(
  topic: string,
  hoursBack: number = 24,
  limit: number = 10
): Promise<PreviousReport[]> {
  try {
    // Calculate the cutoff time
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    // Query recent completed reporter runs
    const recentRuns = await db.select({
      id: agentRuns.id,
      output: agentRuns.output,
      startTime: agentRuns.startTime,
    })
      .from(agentRuns)
      .where(
        and(
          eq(agentRuns.agentType, 'REPORTER'),
          eq(agentRuns.status, 'COMPLETED'),
          gte(agentRuns.startTime, cutoffTime)
        )
      )
      .orderBy(desc(agentRuns.startTime))
      .limit(limit);

    // Extract titles and trends from the outputs
    const previousReports: PreviousReport[] = recentRuns
      .filter(run => run.output) // Only include runs with output
      .map(run => {
        const output = run.output as ReporterOutput;
        return {
          id: run.id,
          title: output.title || 'Untitled',
          trends: output.trends || [],
          createdAt: run.startTime || new Date(),
        };
      });

    return previousReports;
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    return [];
  }
}

/**
 * Formats previous reports into a readable string for the AI prompt
 * @param reports - Array of previous reports
 * @returns Formatted string describing previous reports
 */
export function formatPreviousReportsForPrompt(reports: PreviousReport[]): string {
  if (reports.length === 0) {
    return 'No recent reports found.';
  }

  const reportsList = reports
    .map((report, index) => {
      const trendsList = report.trends.length > 0
        ? `\n  Trends: ${report.trends.join(', ')}`
        : '';
      return `${index + 1}. "${report.title}" (${formatTimeAgo(report.createdAt)})${trendsList}`;
    })
    .join('\n');

  return `Recent reports from the past 24 hours:\n${reportsList}`;
}

/**
 * Helper function to format time difference
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes}m ago`;
  }
  return `${diffMinutes}m ago`;
}

/**
 * Checks if a generated report title is too similar to recent reports
 * @param newTitle - The title of the new report
 * @param previousReports - Array of previous reports to check against
 * @param similarityThreshold - Minimum word overlap to consider duplicate (default: 0.6)
 * @returns Object with isDuplicate flag and matching report if found
 */
export function checkTitleSimilarity(
  newTitle: string,
  previousReports: PreviousReport[],
  similarityThreshold: number = 0.6
): { isDuplicate: boolean; matchingReport?: PreviousReport } {
  const newTitleWords = extractKeywords(newTitle.toLowerCase());

  for (const report of previousReports) {
    const existingTitleWords = extractKeywords(report.title.toLowerCase());

    // Calculate Jaccard similarity (intersection over union)
    const intersection = newTitleWords.filter(word => existingTitleWords.includes(word));
    const union = [...new Set([...newTitleWords, ...existingTitleWords])];

    if (union.length === 0) continue;

    const similarity = intersection.length / union.length;

    if (similarity >= similarityThreshold) {
      return {
        isDuplicate: true,
        matchingReport: report,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Extracts meaningful keywords from a title
 * Removes common stop words and short words
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}
