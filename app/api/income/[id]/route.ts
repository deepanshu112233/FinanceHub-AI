import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// UPDATE income
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
        const { id, amount, source, date, description } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'Income ID is required' },
                { status: 400 }
            );
        }

        // Verify the income belongs to the user
        const existingIncome = await prisma.income.findUnique({
            where: { id },
        });

        if (!existingIncome) {
            return NextResponse.json(
                { error: 'Income not found' },
                { status: 404 }
            );
        }

        if (existingIncome.userId !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized to edit this income' },
                { status: 403 }
            );
        }

        // Update the income
        const updatedIncome = await prisma.income.update({
            where: { id },
            data: {
                ...(amount && { amount: parseFloat(amount) }),
                ...(source && { source }),
                ...(description !== undefined && { description }),
                ...(date && { date: new Date(date) }),
            },
        });

        console.log('✅ Income updated:', updatedIncome);

        return NextResponse.json({
            success: true,
            income: updatedIncome,
        });
    } catch (error) {
        console.error('❌ Error updating income:', error);
        return NextResponse.json(
            { error: 'Failed to update income' },
            { status: 500 }
        );
    }
}
