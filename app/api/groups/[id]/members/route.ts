import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// GET members for a specific group
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const userMembership = await prisma.groupMember.findFirst({
            where: {
                groupId,
                userId: user.id,
            },
        });

        if (!userMembership) {
            return NextResponse.json(
                { error: 'You are not a member of this group' },
                { status: 403 }
            );
        }

        // Get all members of the group with their user info
        const members = await prisma.groupMember.findMany({
            where: {
                groupId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                    },
                },
            },
        });

        // Calculate balances for all members in one optimized batch operation
        // This replaces the N+1 query pattern with a single batch calculation
        const { calculateGroupBalances } = await import('@/lib/splitwise-utils');
        const balances = await calculateGroupBalances(groupId);

        // Create a map for quick balance lookup
        const balanceMap = new Map(
            balances.map(b => [b.memberId, b.balance])
        );

        // Enrich members with balance data
        const membersWithBalances = members.map((member) => {
            const balance = balanceMap.get(member.id) || 0;

            return {
                id: member.id,
                userId: member.user.id,
                name: member.user.name || member.user.email || 'Unknown User',
                email: member.user.email,
                role: member.role,
                status: member.status,
                userStatus: member.user.status,
                balance,
                joinedAt: member.joinedAt,
            };
        });

        return NextResponse.json({ members: membersWithBalances });
    } catch (error) {
        console.error('❌ Error fetching group members:', error);
        return NextResponse.json(
            { error: 'Failed to fetch group members' },
            { status: 500 }
        );
    }
}
