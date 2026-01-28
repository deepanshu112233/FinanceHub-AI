import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// GET activity logs for a group
export async function GET(request: NextRequest, { params }: RouteContext) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: groupId } = await params;

        // Verify user is a member of this group
        const membership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: user.id,
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: 'Not a member of this group' },
                { status: 403 }
            );
        }

        // Fetch activity logs
        const activities = await prisma.activityLog.findMany({
            where: {
                groupId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 100, // Limit to last 100 activities
        });

        return NextResponse.json({ activities });
    } catch (error) {
        console.error('❌ Error fetching activity logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activity logs' },
            { status: 500 }
        );
    }
}
