import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

// POST add expense to group
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
        const { description, amount, category, paidByMemberId, splits, date } = body;

        // Validate
        if (!description || !amount || !paidByMemberId || !splits || splits.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify user is a member
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

        // Verify payer is a member
        const payerMember = await prisma.groupMember.findUnique({
            where: { id: paidByMemberId },
        });

        if (!payerMember || payerMember.groupId !== groupId) {
            return NextResponse.json(
                { error: 'Invalid payer' },
                { status: 400 }
            );
        }

        // Create expense with splits in transaction
        const result = await prisma.$transaction(async (tx) => {
            const expense = await tx.groupExpense.create({
                data: {
                    groupId,
                    description,
                    amount: parseFloat(amount),
                    category: category || 'Other',
                    paidByMemberId,
                    date: date ? new Date(date) : new Date(),
                    status: 'ACTIVE',
                },
            });

            // Create splits
            const splitRecords = await Promise.all(
                splits.map((split: { memberId: string; amount: number }) =>
                    tx.expenseSplit.create({
                        data: {
                            groupExpenseId: expense.id,
                            memberId: split.memberId,
                            amount: parseFloat(split.amount.toString()),
                        },
                    })
                )
            );

            // Log activity
            const payer = await tx.groupMember.findUnique({
                where: { id: paidByMemberId },
                include: { user: { select: { name: true } } }
            });

            const payerName = payer?.user.name || 'Unknown';
            await tx.activityLog.create({
                data: {
                    groupId,
                    action: 'created',
                    entityType: 'expense',
                    entityId: expense.id,
                    details: `${user.name || 'User'} added expense "$${description || category}" - Amount: $${parseFloat(amount).toFixed(2)} | Paid by: ${payerName} | Split ${splits.length} ${splits.length === 1 ? 'way' : 'ways'}`,
                },
            });

            return { expense, splits: splitRecords };
        });

        console.log('✅ Expense created:', result.expense.description);

        return NextResponse.json({
            success: true,
            expense: result.expense,
        });
    } catch (error) {
        console.error('❌ Error creating expense:', error);
        return NextResponse.json(
            { error: 'Failed to create expense' },
            { status: 500 }
        );
    }
}

// GET expenses for a group
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

        // Fetch expenses
        const expenses = await prisma.groupExpense.findMany({
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
        });

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error('❌ Error fetching expenses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expenses' },
            { status: 500 }
        );
    }
}
