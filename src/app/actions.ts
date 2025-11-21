'use server';

import { signIn } from '@/auth';
import { db } from '@/db';
import { agentConfigs } from '@/db/schema';
import { triggerAgent } from '@/lib/scheduler';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if ((error as Error).message.includes('CredentialsSignin')) {
      return 'CredentialSignin';
    }
    throw error;
  }
}

export async function updateAgentConfig(type: 'REPORTER' | 'MARKETER', schedule: string, status: 'ACTIVE' | 'PAUSED', params: any) {
  // Check if exists
  const existing = await db.select().from(agentConfigs).where(eq(agentConfigs.type, type));
  
  if (existing.length > 0) {
    await db.update(agentConfigs).set({
      schedule,
      status,
      params,
      updatedAt: new Date(),
    }).where(eq(agentConfigs.type, type));
  } else {
    await db.insert(agentConfigs).values({
      type,
      schedule,
      status,
      params,
    });
  }
  
  revalidatePath('/admin/agents');
  revalidatePath('/admin/dashboard');
}

export async function runAgentManually(type: 'REPORTER' | 'MARKETER') {
  // Get params from config
  const config = await db.select().from(agentConfigs).where(eq(agentConfigs.type, type));
  if (config.length === 0) {
    throw new Error('Agent not configured');
  }
  
  await triggerAgent(type, config[0].params);
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/history');
}
