import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        // Get or create the user
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { amount, category, date, description } = body;

        // Validate required fields
        if (!amount || !category || !date) {
            return NextResponse.json(
                { error: 'Missing required fields: amount, category, date' },
                { status: 400 }
            );
        }

        // Create the personal expense
        const expense = await prisma.personalExpense.create({
            data: {
                userId: user.id,
                amount: parseFloat(amount),
                category,
                description: description || null,
                date: new Date(date),
            },
        });

        console.log('✅ Personal expense created:', expense);

        return NextResponse.json({
            success: true,
            expense,
        });

    } catch (error) {
        console.error('❌ Error creating expense:', error);
        return NextResponse.json(
            { error: 'Failed to create expense', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Get or create the user
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get URL search params for filtering
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

        // Get all personal expenses for this user
        const expenses = await prisma.personalExpense.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                date: 'desc',
            },
            take: limit,
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
