import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth-utils";
import { aggregatePersonalExpensesByCategory, getCategoryBudgets } from "@/lib/utils/expenseAggregation";
import { generateAllSignals } from "@/lib/signal/insight-engine";
import { computeEWMAWithAnomalies } from "@/lib/signal/analysis/ewma";

/**
 * GET /api/analyze
 * Generates all AI insights/signals for the current user's personal expenses
 */
export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const user = await getOrCreateUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Aggregate expense data by category
        const categoryData = await aggregatePersonalExpensesByCategory(user.id);

        // Get category budgets
        const budgets = getCategoryBudgets();

        // Generate all signals
        const signals = generateAllSignals(user.id, categoryData, budgets);

        // Generate EWMA chart data for each category
        const chartData: Record<string, any[]> = {};
        for (const [category, data] of Object.entries(categoryData)) {
            chartData[category] = computeEWMAWithAnomalies(data);
        }

        // Calculate summary statistics
        const signalSummary = {
            total: signals.length,
            byType: signals.reduce((acc, s) => {
                acc[s.type] = (acc[s.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            bySeverity: signals.reduce((acc, s) => {
                acc[s.severity] = (acc[s.severity] || 0) + 1;
                return acc;
            }, {} as Record<string, number>),
            highPriority: signals.filter((s) => s.severity === "HIGH").length,
        };

        return NextResponse.json({
            success: true,
            userId: user.id,
            generatedAt: new Date().toISOString(),
            summary: signalSummary,
            signals,
            chartData,
        });
    } catch (error) {
        console.error("❌ Error generating signals:", error);
        return NextResponse.json(
            {
                error: "Failed to generate insights",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
