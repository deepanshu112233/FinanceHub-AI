import { Signal, AnomalySignalMetadata, SignalSeverity } from "../domain/Signal";
import { DailyCategorySpend } from "../domain/Aggregates";
import { computeEWMAWithAnomalies, getCurrentBaseline } from "../analysis/ewma";

/**
 * Build ANOMALY signal - detects spikes (phone purchase, unexpected large expense)
 * Uses EWMA baseline to identify deviations that are significantly higher than expected
 */
export function buildAnomalySignal(
    userId: string,
    category: string,
    data: DailyCategorySpend[]
): Signal | null {
    // Need at least 7 days to establish baseline
    if (data.length < 7) return null;

    const ewmaPoints = computeEWMAWithAnomalies(data, 0.3, 2.5);

    // Find the most recent anomaly
    let latestAnomaly = null;
    for (let i = ewmaPoints.length - 1; i >= 0; i--) {
        if (ewmaPoints[i].isAnomaly) {
            latestAnomaly = ewmaPoints[i];
            break;
        }
    }

    if (!latestAnomaly) return null;

    const baseline = getCurrentBaseline(ewmaPoints);
    const multiplier = baseline > 0 ? latestAnomaly.actual / baseline : 0;

    // Determine severity based on how extreme the anomaly is
    let severity: SignalSeverity = "MEDIUM";
    if (multiplier > 5) severity = "HIGH";
    else if (multiplier < 3) severity = "LOW";

    const metadata: AnomalySignalMetadata = {
        baseline: Math.round(baseline),
        multiplier: Number(multiplier.toFixed(1)),
        date: latestAnomaly.date,
    };

    const dateStr = new Date(latestAnomaly.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    return {
        type: "ANOMALY",
        userId,
        category,
        value: latestAnomaly.actual,
        confidence: Math.min(multiplier / 10, 1), // normalize to 0-1
        severity,
        title: "⚠️ Unusual large expense detected",
        message: `Your ${category.toLowerCase()} spending was ${multiplier.toFixed(1)}× higher than usual on ${dateStr} ($${latestAnomaly.actual.toFixed(0)} vs baseline $${baseline.toFixed(0)})`,
        dateRange: dateStr,
        metadata,
        generatedAt: new Date(),
    };
}
