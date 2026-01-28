import { NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';

/**
 * Test endpoint to verify user auto-creation works
 * GET /api/test-user
 */
export async function GET() {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Not authenticated', message: 'Please sign in first' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'User found or created successfully!',
            user: {
                id: user.id,
                clerkId: user.clerkId,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('❌ Error in test-user endpoint:', error);
        return NextResponse.json(
            {
                error: 'Failed to get or create user',
                details: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}
