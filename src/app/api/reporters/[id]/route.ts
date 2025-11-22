import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { aiReporters } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { UpdateReporterInput } from '@/lib/types/reporter';

// GET /api/reporters/[id] - Get a specific reporter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [reporter] = await db
      .select()
      .from(aiReporters)
      .where(eq(aiReporters.id, parseInt(id)));

    if (!reporter) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reporter });
  } catch (error) {
    console.error('Error fetching reporter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reporter' },
      { status: 500 }
    );
  }
}

// PATCH /api/reporters/[id] - Update a reporter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateReporterInput = await request.json();

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name) updateData.name = body.name;
    if (body.personality) updateData.personality = body.personality;
    if (body.avatar !== undefined) updateData.avatar = body.avatar;
    if (body.specialty !== undefined) updateData.specialty = body.specialty;
    if (body.memory) updateData.memory = body.memory;

    const [updatedReporter] = await db
      .update(aiReporters)
      .set(updateData)
      .where(eq(aiReporters.id, parseInt(id)))
      .returning();

    if (!updatedReporter) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ reporter: updatedReporter });
  } catch (error) {
    console.error('Error updating reporter:', error);
    return NextResponse.json(
      { error: 'Failed to update reporter' },
      { status: 500 }
    );
  }
}

// DELETE /api/reporters/[id] - Delete a reporter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [deletedReporter] = await db
      .delete(aiReporters)
      .where(eq(aiReporters.id, parseInt(id)))
      .returning();

    if (!deletedReporter) {
      return NextResponse.json(
        { error: 'Reporter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reporter:', error);
    return NextResponse.json(
      { error: 'Failed to delete reporter' },
      { status: 500 }
    );
  }
}
