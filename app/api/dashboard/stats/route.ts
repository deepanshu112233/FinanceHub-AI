import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';

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

        // Get month and year from query parameters (optional)
        const searchParams = request.nextUrl.searchParams;
        const monthParam = searchParams.get('month');
        const yearParam = searchParams.get('year');

        // Use provided month/year or default to current month
        const targetDate = (monthParam && yearParam)
            ? new Date(parseInt(yearParam), parseInt(monthParam) - 1)
            : new Date();

        const monthStart = startOfMonth(targetDate);
        const monthEnd = endOfMonth(targetDate);

        // Get total income for current month
        const incomeRecords = await prisma.income.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });

        const totalIncome = incomeRecords.reduce((sum, record) => sum + record.amount, 0);

        // Group income by source
        const incomeBySource = incomeRecords.reduce((acc, record) => {
            acc[record.source] = (acc[record.source] || 0) + record.amount;
            return acc;
        }, {} as Record<string, number>);

        // Get total expenses for current month
        const expenseRecords = await prisma.personalExpense.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            },
        });

        const totalExpenses = expenseRecords.reduce((sum, record) => sum + record.amount, 0);

        // Calculate spending by category
        const spendingByCategory = expenseRecords.reduce((acc, record) => {
            if (!acc[record.category]) {
                acc[record.category] = {
                    total: 0,
                    count: 0,
                };
            }
            acc[record.category].total += record.amount;
            acc[record.category].count += 1;
            return acc;
        }, {} as Record<string, { total: number; count: number }>);

        // Get all transactions (expenses and income) - no limit
        const recentExpenses = await prisma.personalExpense.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            // Removed take limit to fetch all expenses
        });

        const recentIncome = await prisma.income.findMany({
            where: { userId: user.id },
            orderBy: { date: 'desc' },
            // Removed take limit to fetch all income
        });

        // Combine and sort all transactions by date
        const recentTransactions = [
            ...recentExpenses.map(e => ({
                id: e.id,
                type: 'expense' as const,
                amount: -e.amount,
                category: e.category,
                description: e.description,
                date: e.date,
            })),
            ...recentIncome.map(i => ({
                id: i.id,
                type: 'income' as const,
                amount: i.amount,
                category: i.source,
                description: i.description,
                date: i.date,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        // Removed slice limit - all transactions will be returned

        // Calculate budget based on actual income (not a fixed limit)
        // This shows how much of your earned income you've spent
        const budgetLimit = totalIncome || 0; // Use total income as the budget
        const budgetProgress = budgetLimit > 0 ? totalExpenses / budgetLimit : 0;

        return NextResponse.json({
            totalIncome,
            totalExpenses,
            incomeBySource,
            spendingByCategory,
            recentTransactions,
            budget: {
                limit: budgetLimit, // Now represents total income
                spent: totalExpenses,
                remaining: budgetLimit - totalExpenses,
                progress: budgetProgress,
            },
        });

    } catch (error) {
        console.error('❌ Error fetching dashboard stats:');
        console.error('Error details:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }

        return NextResponse.json(
            {
                error: 'Failed to fetch dashboard stats',
                details: error instanceof Error ? error.message : 'Unknown error',
                // Return default empty stats instead of just error
                totalIncome: 0,
                totalExpenses: 0,
                incomeBySource: {},
                spendingByCategory: {},
                recentTransactions: [],
                budget: {
                    limit: 3500,
                    spent: 0,
                    remaining: 3500,
                    progress: 0,
                },
            },
            { status: 200 } // Return 200 with empty data instead of 500
        );
    }
}
