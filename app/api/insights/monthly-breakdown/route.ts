import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get all personal expenses for the user
        const expenses = await prisma.personalExpense.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                date: 'asc',
            },
        });

        // Group expenses by month and category
        const monthlyBreakdown: Record<string, Record<string, number>> = {};

        expenses.forEach((expense) => {
            const date = new Date(expense.date);
            const monthKey = `${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;

            if (!monthlyBreakdown[monthKey]) {
                monthlyBreakdown[monthKey] = {
                    Food: 0,
                    Travel: 0,
                    Groceries: 0,
                    Rent_utilities: 0,
                    Personal_utilities: 0,
                    Other: 0,
                };
            }

            const category = expense.category;
            const amount = Math.abs(expense.amount);

            if (monthlyBreakdown[monthKey][category] !== undefined) {
                monthlyBreakdown[monthKey][category] += amount;
            }
        });

        // Convert to array format with totals
        const result = Object.entries(monthlyBreakdown).map(([month, categories]) => {
            const total = Object.values(categories).reduce((sum, val) => sum + val, 0);
            return {
                month,
                ...categories,
                total,
            };
        });

        // Sort by date
        result.sort((a, b) => {
            const dateA = new Date(a.month);
            const dateB = new Date(b.month);
            return dateA.getTime() - dateB.getTime();
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error fetching monthly expense breakdown:", error);
        return NextResponse.json(
            { error: "Failed to fetch expense breakdown" },
            { status: 500 }
        );
    }
}
