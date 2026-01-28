import { prisma } from "@/lib/db";
import { DailyCategorySpend } from "../signal/domain/Aggregates";
import { startOfMonth, endOfMonth, format } from "date-fns";

/**
 * Aggregate personal expenses by category and day for the current month
 * Returns data in the format needed for signal generation
 */
export async function aggregatePersonalExpensesByCategory(
    userId: string,
    month?: Date
): Promise<Record<string, DailyCategorySpend[]>> {
    const targetMonth = month || new Date();
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    // Fetch all expenses for the month
    const expenses = await prisma.personalExpense.findMany({
        where: {
            userId,
            date: {
                gte: monthStart,
                lte: monthEnd,
            },
        },
        orderBy: {
            date: "asc",
        },
    });

    // Group by category and date
    const categoryMap: Record<string, Record<string, { total: number; count: number }>> = {};

    for (const expense of expenses) {
        const category = expense.category;
        const dateKey = format(expense.date, "yyyy-MM-dd");

        if (!categoryMap[category]) {
            categoryMap[category] = {};
        }

        if (!categoryMap[category][dateKey]) {
            categoryMap[category][dateKey] = { total: 0, count: 0 };
        }

        categoryMap[category][dateKey].total += expense.amount;
        categoryMap[category][dateKey].count += 1;
    }

    // Convert to DailyCategorySpend[] format
    const result: Record<string, DailyCategorySpend[]> = {};

    for (const [category, dates] of Object.entries(categoryMap)) {
        result[category] = Object.entries(dates)
            .map(([date, data]) => ({
                date,
                category,
                total: data.total,
                count: data.count,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    return result;
}

/**
 * Get category budgets (placeholder - can be extended to fetch from DB)
 * For now, returns default budgets per category
 */
export function getCategoryBudgets(): Record<string, number> {
    return {
        Food: 8000,
        Travel: 5000,
        Groceries: 6000,
        Rent_utilities: 15000,
        Personal_utilities: 4000,
        Other: 3000,
    };
}
