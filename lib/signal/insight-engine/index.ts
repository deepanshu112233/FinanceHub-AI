import { Signal } from "../domain/Signal";
import { DailyCategorySpend } from "../domain/Aggregates";
import { buildTrendSignal } from "./trendSignal";
import { buildAnomalySignal } from "./anomalySignal";
import { buildVolatilitySignal } from "./volatilitySignal";
import { buildBudgetPressureSignal } from "./budgetPressureSignal";

/**
 * Signal orchestrator - generates all signals for a category
 * This is the main entry point for signal generation
 */
export function generateSignalsForCategory(
    userId: string,
    category: string,
    data: DailyCategorySpend[],
    monthlyBudget?: number
): Signal[] {
    const signals: (Signal | null)[] = [
        buildTrendSignal(userId, category, data),
        buildAnomalySignal(userId, category, data),
        buildVolatilitySignal(userId, category, data),
        buildBudgetPressureSignal(userId, category, data, monthlyBudget),
    ];

    // Filter out null signals and sort by severity (HIGH first)
    return signals
        .filter((s): s is Signal => s !== null)
        .sort((a, b) => {
            const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });
}

/**
 * Generate signals for all categories
 * @param userId - User ID
 * @param categoryData - Map of category name to daily spending data
 * @param budgets - Optional map of category budgets
 */
export function generateAllSignals(
    userId: string,
    categoryData: Record<string, DailyCategorySpend[]>,
    budgets?: Record<string, number>
): Signal[] {
    const allSignals: Signal[] = [];

    for (const [category, data] of Object.entries(categoryData)) {
        const categoryBudget = budgets?.[category];
        const signals = generateSignalsForCategory(userId, category, data, categoryBudget);
        allSignals.push(...signals);
    }

    // Sort all signals by severity and confidence
    return allSignals.sort((a, b) => {
        const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return (b.confidence ?? 0) - (a.confidence ?? 0);
    });
}
