import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// UPDATE expense
export async function PUT(request: NextRequest) {
    try {
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { id, amount, category, date, description } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Expense ID is required' },
                { status: 400 }
            );
        }

        // Verify the expense belongs to the user
        const existingExpense = await prisma.personalExpense.findUnique({
            where: { id },
        });

        if (!existingExpense) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
            );
        }

        if (existingExpense.userId !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to edit this expense' },
                { status: 403 }
            );
        }

        // Update the expense
        const updatedExpense = await prisma.personalExpense.update({
            where: { id },
            data: {
                ...(amount && { amount: parseFloat(amount) }),
                ...(category && { category }),
                ...(description !== undefined && { description }),
                ...(date && { date: new Date(date) }),
            },
        });

        console.log('✅ Expense updated:', updatedExpense);

        return NextResponse.json({
            success: true,
            expense: updatedExpense,
        });
    } catch (error) {
        console.error('❌ Error updating expense:', error);
        return NextResponse.json(
            { error: 'Failed to update expense' },
            { status: 500 }
        );
    }
}
