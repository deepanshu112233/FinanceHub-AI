import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { calculateGroupBalances } from '@/lib/splitwise-utils';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// GET unified group summary with all data in one optimized call
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

        // Fetch all data in parallel for maximum performance
        const [expenses, members, balances, activities] = await Promise.all([
            // Fetch all expenses with splits
            prisma.groupExpense.findMany({
                where: {
                    groupId,
                    status: 'ACTIVE',
                },
                include: {
                    paidBy: {
                        include: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                    splits: {
                        include: {
                            member: {
                                include: {
                                    user: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    date: 'desc',
                },
            }),

            // Fetch all members
            prisma.groupMember.findMany({
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
            }),

            // Calculate balances for all members (optimized batch calculation)
            calculateGroupBalances(groupId),

            // Fetch recent activity logs
            prisma.activityLog.findMany({
                where: {
                    groupId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 100,
            }),
        ])

            ;

        console.log('📊 Group Summary Debug:');
        console.log('- Total members fetched:', members.length);
        console.log('- Member details:', members.map(m => ({
            id: m.id,
            userId: m.userId,
            userName: m.user?.name,
            userEmail: m.user?.email,
            userStatus: m.user?.status,
            role: m.role,
            status: m.status
        })));

        // Calculate total group spend
        const totalSpend = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Create balance map for quick lookup
        const balanceMap = new Map(
            balances.map(b => [b.memberId, b.balance])
        );

        // Enrich members with balance data
        const membersWithBalances = members.map(member => {
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

        console.log('- Members with balances:', membersWithBalances.length);

        // Find current user's balance
        const userMembership = members.find(m => m.userId === user.id);
        const userBalance = userMembership ? (balanceMap.get(userMembership.id) || 0) : 0;

        return NextResponse.json({
            success: true,
            data: {
                groupId,
                totalSpend,
                userBalance,
                expenses,
                members: membersWithBalances,
                activities,
            },
        });
    } catch (error) {
        console.error('❌ Error fetching group summary:', error);
        return NextResponse.json(
            { error: 'Failed to fetch group summary' },
            { status: 500 }
        );
    }
}
