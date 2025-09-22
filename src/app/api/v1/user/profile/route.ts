import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/middleware/api-auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Schema for updating profile
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    emailAlerts: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

// GET /api/v1/user/profile - Get user profile
export const GET = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, context.apiKey.userId),
        columns: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          // Exclude sensitive fields
          hashedPassword: false,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Get additional user statistics
      const stats = await getUs
Stats(context.apiKey.userId);

      return NextResponse.json({
        success: true,
        data: {
          user,
          stats,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }
  },
  'user:read'
);

// PATCH /api/v1/user/profile - Update user profile
export const PATCH = withApiAuth(
  async (req: NextRequest, context) => {
    try {
      const body = await req.json();
      const data = updateProfileSchema.parse(body);

      const updateData: any = {};

      if (data.name !== undefined) {
        updateData.name = data.name;
      }

      if (data.bio !== undefined) {
        updateData.bio = data.bio;
      }

      if (data.preferences !== undefined) {
        updateData.preferences = data.preferences;
      }

      if (data.metadata !== undefined) {
        updateData.metadata = data.metadata;
      }

      updateData.updatedAt = new Date();

      // Update user profile
      const updatedUser = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, context.apiKey.userId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
          role: users.role,
          updatedAt: users.updatedAt,
        });

      if (updatedUser.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: updatedUser[0],
        message: 'Profile updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid request data',
            details: error.errors,
          },
          { status: 400 }
        );
      }

      console.error('Update profile error:', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }
  },
  'user:write'
);

// Helper function to get user statistics
async function getUserStats(userId: string) {
  // This would be implemented based on your specific requirements
  // Example statistics:
  return {
    totalPredictions: 0,
    accuracyRate: 0,
    totalNarratives: 0,
    followersCount: 0,
    followingCount: 0,
    apiKeysCount: await db
      .select({ count: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .then(result => result.length),
  };
}