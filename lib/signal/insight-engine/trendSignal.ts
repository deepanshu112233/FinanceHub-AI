import { Signal, TrendSignalMetadata, SignalSeverity } from "../domain/Signal";
import { DailyCategorySpend } from "../domain/Aggregates";
import { computeEWMAWithAnomalies, getEWMATrend, getCurrentBaseline } from "../analysis/ewma";

/**
 * Build TREND signal - detects spending direction (UP/DOWN)
 * Uses EWMA to smooth out daily fluctuations and detect sustained trends
 */
export function buildTrendSignal(
    userId: string,
    category: string,
    data: DailyCategorySpend[]
): Signal | null {
    // Need at least 1 day to establish baseline
    if (data.length < 1) return null;

    const ewmaPoints = computeEWMAWithAnomalies(data);
    const trend = getEWMATrend(ewmaPoints);
    const baseline = getCurrentBaseline(ewmaPoints);

    if (baseline === 0) return null;

    const changePct = (trend / baseline) * 100;
    const absChangePct = Math.abs(changePct);

    // Determine severity based on change magnitude
    let severity: SignalSeverity = "LOW";
    if (absChangePct > 20) severity = "HIGH";
    else if (absChangePct > 10) severity = "MEDIUM";

    // Only report significant trends (reduced threshold for quicker insights)
    if (absChangePct < 1) return null;

    const direction = trend > 0 ? "UP" : "DOWN";
    const emoji = trend > 0 ? "📈" : "📉";

    const metadata: TrendSignalMetadata = {
        delta: Math.round(trend),
        baseline: Math.round(baseline),
        changePct: Math.round(changePct),
    };

    return {
        type: "TREND",
        userId,
        category,
        value: direction,
        confidence: Math.min(absChangePct / 30, 1), // normalize to 0-1
        severity,
        title: `${emoji} ${category} spending is trending ${direction.toLowerCase()}`,
        message: `Your ${category.toLowerCase()} spending has ${direction === "UP" ? "increased" : "decreased"} by ${absChangePct.toFixed(0)}% compared to your baseline of $${baseline.toFixed(0)}`,
        dateRange: `Last ${data.length} days`,
        metadata,
        generatedAt: new Date(),
    };
}
