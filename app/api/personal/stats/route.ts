import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// GET personal dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const user = await getOrCreateUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get month and year from query params
        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get('month');
        const yearParam = searchParams.get('year');

        // Use current month/year if not provided
        const now = new Date();
        const targetYear = yearParam ? parseInt(yearParam) : now.getFullYear();
        const targetMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1;

        // Calculate date range for the selected month
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // Fetch all data in parallel
        const [
            expenses,
            incomes,
            budgetData,
        ] = await Promise.all([
            // Get all expenses for the month
            prisma.personalExpense.findMany({
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                orderBy: {
                    date: 'desc',
                },
            }),

            // Get all income for the month
            prisma.income.findMany({
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                orderBy: {
                    date: 'desc',
                },
            }),

            // Get budget settings (you might want to add a Budget model later)
            // For now, we'll use a default budget limit
            Promise.resolve({ limit: 3500 }),
        ]);

        // Calculate total income
        const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

        // Calculate total expenses
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Group income by source
        const incomeBySource: Record<string, number> = {};
        incomes.forEach((income) => {
            incomeBySource[income.source] = (incomeBySource[income.source] || 0) + income.amount;
        });

        // Group expenses by category
        const spendingByCategory: Record<string, { total: number; count: number }> = {};
        expenses.forEach((expense) => {
            if (!spendingByCategory[expense.category]) {
                spendingByCategory[expense.category] = { total: 0, count: 0 };
            }
            spendingByCategory[expense.category].total += expense.amount;
            spendingByCategory[expense.category].count += 1;
        });

        // Combine recent transactions (expenses + income)
        const recentTransactions = [
            ...expenses.map((expense) => ({
                id: expense.id,
                type: 'expense' as const,
                amount: expense.amount,
                category: expense.category,
                description: expense.description,
                date: expense.date,
            })),
            ...incomes.map((income) => ({
                id: income.id,
                type: 'income' as const,
                amount: income.amount,
                category: income.source,
                description: income.description,
                date: income.date,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate budget progress
        const budget = {
            limit: budgetData.limit,
            spent: totalExpenses,
            remaining: budgetData.limit - totalExpenses,
            progress: (totalExpenses / budgetData.limit) * 100,
        };

        return NextResponse.json({
            totalIncome,
            totalExpenses,
            incomeBySource,
            spendingByCategory,
            recentTransactions,
            budget,
        });
    } catch (error) {
        console.error('Error fetching personal stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch personal statistics' },
            { status: 500 }
        );
    }
}
