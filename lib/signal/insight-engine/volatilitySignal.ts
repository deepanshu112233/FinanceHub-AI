import { Signal, VolatilitySignalMetadata, SignalSeverity } from "../domain/Signal";
import { DailyCategorySpend } from "../domain/Aggregates";
import { volatility, classifyVolatility } from "../analysis/volatility";

/**
 * Build VOLATILITY signal - measures spending predictability
 * High volatility = chaotic/unpredictable spending
 * Low volatility = stable/predictable spending
 */
export function buildVolatilitySignal(
    userId: string,
    category: string,
    data: DailyCategorySpend[]
): Signal | null {
    // Need at least 7 days for meaningful volatility calculation
    if (data.length < 7) return null;

    const values = data.map((d) => d.total);
    const vol = volatility(values);
    const classification = classifyVolatility(vol);

    // Only report if volatility is noteworthy
    if (classification === "NORMAL") return null;

    const severity: SignalSeverity = classification === "HIGH" ? "MEDIUM" : "LOW";

    const metadata: VolatilitySignalMetadata = {
        score: Number(vol.toFixed(2)),
        stdRatio: Number(vol.toFixed(2)),
    };

    const emoji = classification === "HIGH" ? "🎢" : "📊";
    const adjective = classification === "HIGH" ? "unstable" : "stable";

    return {
        type: "VOLATILITY",
        userId,
        category,
        value: classification,
        confidence: Math.min(vol, 1),
        severity,
        title: `${emoji} ${category} spending is ${adjective}`,
        message: `Your ${category.toLowerCase()} spending ${classification === "HIGH"
                ? "varies significantly day-to-day (high volatility)"
                : "is very consistent (low volatility)"
            }. Volatility score: ${(vol * 100).toFixed(0)}%`,
        dateRange: `Last ${data.length} days`,
        metadata,
        generatedAt: new Date(),
    };
}
