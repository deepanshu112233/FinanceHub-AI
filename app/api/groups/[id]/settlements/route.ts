import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// POST record a settlement
export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: groupId } = await params;
        const body = await request.json();
        const { fromMemberId, toMemberId, amount } = body;

        if (!fromMemberId || !toMemberId || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify user is involved in this settlement
        const userMembership = await prisma.groupMember.findUnique({
            where: {
                groupId_userId: {
                    groupId,
                    userId: user.id,
                },
            },
        });

        if (!userMembership) {
            return NextResponse.json(
                { error: 'Not a member of this group' },
                { status: 403 }
            );
        }

        // For now, only allow the payer to record settlements
        if (userMembership.id !== fromMemberId) {
            return NextResponse.json(
                { error: 'You can only record settlements you are paying' },
                { status: 403 }
            );
        }

        // Create settlement and log in transaction
        const result = await prisma.$transaction(async (tx) => {
            const settlement = await tx.groupSettlement.create({
                data: {
                    groupId,
                    fromMemberId,
                    toMemberId,
                    amount: parseFloat(amount),
                },
            });

            // Get member names for logging
            const fromMember = await tx.groupMember.findUnique({
                where: { id: fromMemberId },
                include: { user: { select: { name: true } } },
            });
            const toMember = await tx.groupMember.findUnique({
                where: { id: toMemberId },
                include: { user: { select: { name: true } } },
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    groupId,
                    action: 'settled',
                    entityType: 'settlement',
                    entityId: settlement.id,
                    details: `${fromMember?.user.name || 'User'} paid $${amount} to ${toMember?.user.name || 'User'}`,
                },
            });

            return settlement;
        });

        console.log('✅ Settlement recorded');

        return NextResponse.json({
            success: true,
            settlement: result,
        });
    } catch (error) {
        console.error('❌ Error recording settlement:', error);
        return NextResponse.json(
            { error: 'Failed to record settlement' },
            { status: 500 }
        );
    }
}

// GET settlement history
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

        // Fetch settlements
        const settlements = await prisma.groupSettlement.findMany({
            where: { groupId },
            include: {
                fromMember: {
                    include: {
                        user: {
                            select: { name: true },
                        },
                    },
                },
                toMember: {
                    include: {
                        user: {
                            select: { name: true },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ settlements });
    } catch (error) {
        console.error('❌ Error fetching settlements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settlements' },
            { status: 500 }
        );
    }
}
