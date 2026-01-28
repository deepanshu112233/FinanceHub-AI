import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { getDebtTree } from '@/lib/splitwise-utils';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// GET optimal debt tree for settlements
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

        // Verify membership
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

        // Get optimal debt tree
        const debtTree = await getDebtTree(groupId);

        return NextResponse.json({
            debtTree,
            currentUserId: user.id,
            currentMemberId: membership.id,
        });
    } catch (error) {
        console.error('❌ Error fetching debt tree:', error);
        return NextResponse.json(
            { error: 'Failed to fetch debt tree' },
            { status: 500 }
        );
    }
}
