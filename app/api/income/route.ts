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
        const { amount, source, date, description } = body;

        // Validate required fields
        if (!amount || !source || !date) {
            return NextResponse.json(
                { error: 'Missing required fields: amount, source, date' },
                { status: 400 }
            );
        }

        // Create the income entry
        const income = await prisma.income.create({
            data: {
                userId: user.id,
                amount: parseFloat(amount),
                source,
                description: description || null,
                date: new Date(date),
            },
        });

        console.log('✅ Income created:', income);

        return NextResponse.json({
            success: true,
            income,
        });

    } catch (error) {
        console.error('❌ Error creating income:', error);
        return NextResponse.json(
            { error: 'Failed to create income', details: error instanceof Error ? error.message : 'Unknown error' },
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

        // Get all income entries for this user
        const income = await prisma.income.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                date: 'desc',
            },
            take: limit,
        });

        return NextResponse.json({ income });

    } catch (error) {
        console.error('❌ Error fetching income:', error);
        return NextResponse.json(
            { error: 'Failed to fetch income' },
            { status: 500 }
        );
    }
}
