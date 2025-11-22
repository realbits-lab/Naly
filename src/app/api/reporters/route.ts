import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiReporters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { CreateReporterInput } from '@/lib/types/reporter';

// GET /api/reporters - Get all reporters
export async function GET() {
  try {
    const reporters = await db.select().from(aiReporters).orderBy(aiReporters.createdAt);
    return NextResponse.json({ reporters });
  } catch (error) {
    console.error('Error fetching reporters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reporters' },
      { status: 500 }
    );
  }
}

// POST /api/reporters - Create a new reporter
export async function POST(request: NextRequest) {
  try {
    const body: CreateReporterInput = await request.json();

    const [newReporter] = await db.insert(aiReporters).values({
      name: body.name,
      personality: body.personality,
      avatar: body.avatar,
      specialty: body.specialty,
      memory: [],
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ reporter: newReporter }, { status: 201 });
  } catch (error) {
    console.error('Error creating reporter:', error);
    return NextResponse.json(
      { error: 'Failed to create reporter' },
      { status: 500 }
    );
  }
}
