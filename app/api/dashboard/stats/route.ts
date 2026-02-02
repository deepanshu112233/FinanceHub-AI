import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser } from '@/lib/auth-utils';
import { prisma } from '@/lib/db';

// GET dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const user = await getOrCreateUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current month date range
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // Get previous month date range for comparison
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Fetch all data in parallel
        const [
            currentMonthIncome,
            lastMonthIncome,
            currentMonthExpenses,
            lastMonthExpenses,
            categoryStats,
            userGroups,
        ] = await Promise.all([
            // Current month income
            prisma.income.aggregate({
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                _sum: { amount: true },
            }),

            // Last month income
            prisma.income.aggregate({
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth,
                    },
                },
                _sum: { amount: true },
            }),

            // Current month expenses
            prisma.personalExpense.aggregate({
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                _sum: { amount: true },
            }),

            // Last month expenses
            prisma.personalExpense.aggregate({
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfLastMonth,
                        lte: endOfLastMonth,
                    },
                },
                _sum: { amount: true },
            }),

            // Category breakdown for current month
            prisma.personalExpense.groupBy({
                by: ['category'],
                where: {
                    userId: user.id,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
                _sum: { amount: true },
                orderBy: {
                    _sum: {
                        amount: 'desc',
                    },
                },
                take: 5,
            }),

            // User's groups with balances
            prisma.groupMember.findMany({
                where: {
                    userId: user.id,
                },
                include: {
                    group: {
                        select: {
                            id: true,
                            name: true,
                            description: true,
                            _count: {
                                select: {
                                    members: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        // Calculate income stats
        const income = currentMonthIncome._sum.amount || 0;
        const lastIncome = lastMonthIncome._sum.amount || 0;
        const incomeChange = lastIncome > 0 ? ((income - lastIncome) / lastIncome) * 100 : 0;

        // Calculate spending stats
        const spending = currentMonthExpenses._sum.amount || 0;
        const lastSpending = lastMonthExpenses._sum.amount || 0;
        const spendingChange = lastSpending > 0 ? ((spending - lastSpending) / lastSpending) * 100 : 0;

        // Get top category
        const topCategory = categoryStats[0] || null;
        const topCategoryData = topCategory
            ? {
                category: topCategory.category,
                amount: topCategory._sum.amount || 0,
                percentage: spending > 0 ? ((topCategory._sum.amount || 0) / spending) * 100 : 0,
            }
            : null;

        // Format groups data
        const groups = userGroups.map((membership) => ({
            id: membership.group.id,
            name: membership.group.name,
            description: membership.group.description,
            memberCount: membership.group._count.members,
            role: membership.role,
        }));

        // Generate alerts based on spending patterns
        const alerts = [];

        // Alert if spending increased significantly
        if (spendingChange > 20) {
            alerts.push({
                type: 'warning',
                message: `Your spending increased by ${spendingChange.toFixed(1)}% this month`,
                category: 'spending',
            });
        }

        // Alert if income decreased
        if (incomeChange < -10) {
            alerts.push({
                type: 'warning',
                message: `Your income decreased by ${Math.abs(incomeChange).toFixed(1)}% this month`,
                category: 'income',
            });
        }

        // Alert if top category is very high
        if (topCategoryData && topCategoryData.percentage > 40) {
            alerts.push({
                type: 'info',
                message: `${topCategoryData.percentage.toFixed(0)}% of spending is on ${topCategoryData.category}`,
                category: 'category',
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                income: {
                    current: income,
                    previous: lastIncome,
                    change: incomeChange,
                },
                spending: {
                    current: spending,
                    previous: lastSpending,
                    change: spendingChange,
                },
                topCategory: topCategoryData,
                groups,
                alerts,
            },
        });
    } catch (error) {
        console.error('❌ Error fetching dashboard stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard statistics' },
            { status: 500 }
        );
    }
}
