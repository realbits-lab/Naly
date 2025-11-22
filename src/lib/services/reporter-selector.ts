import { db } from '@/db';
import { aiReporters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { AIReporter } from '@/lib/types/reporter';

// Default reporter personas to create
const DEFAULT_REPORTERS = [
  {
    name: 'Alex Chen',
    personality: 'Analytical and data-driven financial reporter with a focus on market trends and economic indicators. Known for precise, numbers-focused reporting.',
    avatar: '📊',
    specialty: 'stock',
  },
  {
    name: 'Maya Rodriguez',
    personality: 'Tech-savvy crypto enthusiast with a deep understanding of blockchain technology. Writes with passion and explains complex concepts clearly.',
    avatar: '₿',
    specialty: 'coin',
  },
  {
    name: 'Jordan Kim',
    personality: 'Sports journalist with insider knowledge and a flair for dramatic storytelling. Brings energy and excitement to sports coverage.',
    avatar: '⚽',
    specialty: 'sports',
  },
  {
    name: 'Sam Taylor',
    personality: 'Investigative political reporter with a balanced perspective. Known for thorough research and fair analysis of political events.',
    avatar: '🏛️',
    specialty: 'politics',
  },
  {
    name: 'Riley Park',
    personality: 'Versatile general news reporter with a curious mind and engaging writing style. Adapts tone based on topic and audience.',
    avatar: '📰',
    specialty: null,
  },
];

/**
 * Get or create default reporters
 */
export async function ensureDefaultReporters(): Promise<AIReporter[]> {
  const existingReporters = await db.select().from(aiReporters);

  if (existingReporters.length === 0) {
    // Create default reporters
    const newReporters = await Promise.all(
      DEFAULT_REPORTERS.map(async (reporter) => {
        const [created] = await db.insert(aiReporters).values({
          name: reporter.name,
          personality: reporter.personality,
          avatar: reporter.avatar,
          specialty: reporter.specialty,
          memory: [],
          updatedAt: new Date(),
        }).returning();
        return created;
      })
    );
    return newReporters as AIReporter[];
  }

  return existingReporters as AIReporter[];
}

/**
 * Get a random reporter, optionally filtered by specialty
 */
export async function getRandomReporter(specialty?: string): Promise<AIReporter> {
  await ensureDefaultReporters();

  let reporters;
  if (specialty) {
    // Try to find reporters with matching specialty
    reporters = await db
      .select()
      .from(aiReporters)
      .where(eq(aiReporters.specialty, specialty));

    // If no specialist found, get all reporters
    if (reporters.length === 0) {
      reporters = await db.select().from(aiReporters);
    }
  } else {
    reporters = await db.select().from(aiReporters);
  }

  if (reporters.length === 0) {
    throw new Error('No reporters available');
  }

  // Select random reporter
  const randomIndex = Math.floor(Math.random() * reporters.length);
  return reporters[randomIndex] as AIReporter;
}

/**
 * Create a new reporter with AI-generated personality
 */
export async function createNewReporter(
  name: string,
  specialty?: string
): Promise<AIReporter> {
  const personalities = [
    'Data-driven and analytical, focusing on facts and figures',
    'Creative and engaging storyteller with vivid descriptions',
    'Skeptical investigative journalist who questions everything',
    'Optimistic and enthusiastic, highlighting positive developments',
    'Balanced and neutral, presenting multiple perspectives',
    'Deep-dive specialist who explores topics in great detail',
  ];

  const randomPersonality = personalities[Math.floor(Math.random() * personalities.length)];

  const [newReporter] = await db.insert(aiReporters).values({
    name,
    personality: randomPersonality,
    avatar: '👤',
    specialty: specialty || null,
    memory: [],
    updatedAt: new Date(),
  }).returning();

  return newReporter as AIReporter;
}

/**
 * Update reporter's memory with a new event
 */
export async function addReporterMemory(
  reporterId: number,
  event: string,
  context: string,
  articleId?: number
): Promise<void> {
  const [reporter] = await db
    .select()
    .from(aiReporters)
    .where(eq(aiReporters.id, reporterId));

  if (!reporter) {
    throw new Error('Reporter not found');
  }

  const newMemory = {
    timestamp: new Date().toISOString(),
    event,
    context,
    articleId,
  };

  const existingMemory = (reporter.memory as any[]) || [];

  // Keep only last 50 memories to avoid memory bloat
  const updatedMemory = [...existingMemory, newMemory].slice(-50);

  await db
    .update(aiReporters)
    .set({
      memory: updatedMemory,
      updatedAt: new Date(),
    })
    .where(eq(aiReporters.id, reporterId));
}
