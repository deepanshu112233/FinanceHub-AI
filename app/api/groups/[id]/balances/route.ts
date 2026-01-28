import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { calculateGroupBalances } from '@/lib/splitwise-utils';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// GET group balances
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

        // Calculate balances for all members
        const balances = await calculateGroupBalances(groupId);

        return NextResponse.json({ balances });
    } catch (error) {
        console.error('❌ Error fetching group balances:', error);
        return NextResponse.json(
            { error: 'Failed to fetch balances' },
            { status: 500 }
        );
    }
}
