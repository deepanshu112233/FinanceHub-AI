import { Signal, BudgetPressureMetadata, SignalSeverity } from "../domain/Signal";
import { DailyCategorySpend } from "../domain/Aggregates";
import { getCurrentBaseline } from "../analysis/ewma";
import { computeEWMAWithAnomalies } from "../analysis/ewma";

/**
 * Build BUDGET_PRESSURE signal - predicts if user will exceed budget
 * Time-aware: compares actual spending vs expected based on days elapsed
 */
export function buildBudgetPressureSignal(
    userId: string,
    category: string,
    data: DailyCategorySpend[],
    monthlyBudget?: number
): Signal | null {
    if (!monthlyBudget || monthlyBudget === 0) return null;
    if (data.length === 0) return null;

    // Calculate total spent so far
    const spentSoFar = data.reduce((sum, d) => sum + d.total, 0);

    // Determine days in month and days elapsed
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    // Calculate expected spending based on time elapsed
    const expectedByNow = (monthlyBudget * dayOfMonth) / daysInMonth;

    // Calculate pressure ratio
    const pressureRatio = spentSoFar / expectedByNow;

    // Determine risk level
    let risk: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let severity: SignalSeverity = "LOW";

    if (pressureRatio > 1.3) {
        risk = "HIGH";
        severity = "HIGH";
    } else if (pressureRatio > 1.1) {
        risk = "MEDIUM";
        severity = "MEDIUM";
    } else if (pressureRatio < 0.8) {
        // Under budget - positive signal
        risk = "LOW";
        severity = "LOW";
    } else {
        // On track
        return null;
    }

    // Project end-of-month spending using EWMA
    const ewmaPoints = computeEWMAWithAnomalies(data);
    const dailyAvg = getCurrentBaseline(ewmaPoints);
    const projectedMonthly = spentSoFar + dailyAvg * daysLeft;

    const metadata: BudgetPressureMetadata = {
        spentSoFar: Math.round(spentSoFar),
        expectedByNow: Math.round(expectedByNow),
        daysLeft,
        budget: monthlyBudget,
    };

    const emoji = risk === "HIGH" ? "🚨" : risk === "MEDIUM" ? "⚠️" : "✅";
    const statusText =
        risk === "HIGH"
            ? "significantly ahead of budget"
            : risk === "MEDIUM"
                ? "slightly ahead of budget"
                : "under budget";

    return {
        type: "BUDGET_PRESSURE",
        userId,
        category,
        value: risk,
        confidence: Math.min(Math.abs(pressureRatio - 1), 1),
        severity,
        title: `${emoji} ${category} budget ${risk === "LOW" ? "on track" : "at risk"}`,
        message: `You've spent $${spentSoFar.toFixed(0)} of $${monthlyBudget} (${statusText}). Expected: $${expectedByNow.toFixed(0)}. Projected monthly: $${projectedMonthly.toFixed(0)}`,
        dateRange: `${daysLeft} days remaining`,
        metadata,
        generatedAt: new Date(),
    };
}
