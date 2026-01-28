import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

interface RouteContext {
    params: Promise<{
        id: string;
        expenseId: string;
    }>;
}

// GET single expense with details
export async function GET(request: NextRequest, { params }: RouteContext) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: groupId, expenseId } = await params;

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

        // Fetch expense with all details
        const expense = await prisma.groupExpense.findUnique({
            where: {
                id: expenseId,
            },
            include: {
                paidBy: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
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
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!expense || expense.groupId !== groupId) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ expense });
    } catch (error) {
        console.error('❌ Error fetching expense:', error);
        return NextResponse.json(
            { error: 'Failed to fetch expense' },
            { status: 500 }
        );
    }
}

// PUT update expense
export async function PUT(request: NextRequest, { params }: RouteContext) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: groupId, expenseId } = await params;
        const body = await request.json();
        const { description, amount, category, paidByMemberId, splits, date } = body;

        // Validate
        if (!description || !amount || !paidByMemberId || !splits || splits.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

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

        // Verify expense belongs to this group
        const existingExpense = await prisma.groupExpense.findUnique({
            where: { id: expenseId },
        });

        if (!existingExpense || existingExpense.groupId !== groupId) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
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

        // Update expense with new splits in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update expense
            const updatedExpense = await tx.groupExpense.update({
                where: { id: expenseId },
                data: {
                    description,
                    amount: parseFloat(amount),
                    category: category || 'Other',
                    paidByMemberId,
                    date: date ? new Date(date) : existingExpense.date,
                },
            });

            // Delete existing splits
            await tx.expenseSplit.deleteMany({
                where: { groupExpenseId: expenseId },
            });

            // Create new splits
            const splitRecords = await Promise.all(
                splits.map((split: { memberId: string; amount: number }) =>
                    tx.expenseSplit.create({
                        data: {
                            groupExpenseId: expenseId,
                            memberId: split.memberId,
                            amount: parseFloat(split.amount.toString()),
                        },
                    })
                )
            );

            // Log activity with change details
            const payer = await tx.groupMember.findUnique({
                where: { id: paidByMemberId },
                include: { user: { select: { name: true } } }
            });
            const payerName = payer?.user.name || 'Unknown';

            // Build change description
            const changes: string[] = [];
            if (existingExpense.description !== description) {
                changes.push(`description from "${existingExpense.description}" to "${description}"`);
            }
            if (Math.abs(existingExpense.amount - parseFloat(amount)) > 0.01) {
                changes.push(`amount from $${existingExpense.amount.toFixed(2)} to $${parseFloat(amount).toFixed(2)}`);
            }
            if (existingExpense.paidByMemberId !== paidByMemberId) {
                changes.push(`payer changed`);
            }
            if (existingExpense.category !== (category || 'Other')) {
                changes.push(`category from "${existingExpense.category}" to "${category || 'Other'}"`);
            }

            const changeText = changes.length > 0 ? ` | Changed: ${changes.join(', ')}` : '';

            await tx.activityLog.create({
                data: {
                    groupId,
                    action: 'updated',
                    entityType: 'expense',
                    entityId: expenseId,
                    details: `${user.name || 'User'} edited expense "${description}" - Amount: $${parseFloat(amount).toFixed(2)} | Paid by: ${payerName}${changeText}`,
                },
            });

            return { expense: updatedExpense, splits: splitRecords };
        });

        console.log('✅ Expense updated:', result.expense.description);

        return NextResponse.json({
            success: true,
            expense: result.expense,
        });
    } catch (error) {
        console.error('❌ Error updating expense:', error);
        return NextResponse.json(
            { error: 'Failed to update expense' },
            { status: 500 }
        );
    }
}

// DELETE expense
export async function DELETE(request: NextRequest, { params }: RouteContext) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id: groupId, expenseId } = await params;

        // Verify user is a member of the group
        const membership = await prisma.groupMember.findFirst({
            where: {
                groupId,
                userId: user.id,
                status: 'ACTIVE',
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: 'Not a member of this group' },
                { status: 403 }
            );
        }

        // Get expense details before deleting for activity log
        const expense = await prisma.groupExpense.findUnique({
            where: {
                id: expenseId,
                groupId, // Ensure expense belongs to this group
            },
        });

        if (!expense) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
            );
        }

        // Delete the expense in a transaction (cascade will delete splits)
        await prisma.$transaction(async (tx) => {
            // Delete the expense
            await tx.groupExpense.delete({
                where: { id: expenseId },
            });

            // Log activity
            await tx.activityLog.create({
                data: {
                    groupId,
                    action: 'deleted',
                    entityType: 'expense',
                    entityId: expenseId,
                    details: `${user.name || 'User'} deleted expense "${expense.description}" - Amount: $${expense.amount.toFixed(2)}`,
                },
            });
        });

        console.log('✅ Expense deleted:', expense.description);

        return NextResponse.json({
            success: true,
            message: 'Expense deleted successfully',
        });
    } catch (error) {
        console.error('❌ Error deleting group expense:', error);
        return NextResponse.json(
            { error: 'Failed to delete expense' },
            { status: 500 }
        );
    }
}
