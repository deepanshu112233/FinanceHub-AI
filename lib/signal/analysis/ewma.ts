import { DailyCategorySpend, EWMAPoint } from "../domain/Aggregates";

/**
 * Compute EWMA (Exponential Weighted Moving Average) for a series of values
 * @param values - Array of numbers to smooth
 * @param alpha - Smoothing factor (0 < alpha <= 1). Lower = more smoothing
 * @returns Array of EWMA values
 */
export function computeEWMA(values: number[], alpha = 0.3): number[] {
    if (values.length === 0) return [];

    const ewma: number[] = [values[0]];

    for (let i = 1; i < values.length; i++) {
        ewma[i] = alpha * values[i] + (1 - alpha) * ewma[i - 1];
    }

    return ewma;
}

/**
 * Compute EWMA with anomaly detection
 * @param series - Daily category spending data
 * @param alpha - Smoothing factor
 * @param anomalyFactor - Multiplier for anomaly threshold (e.g., 2.5 = 2.5x baseline)
 * @returns Array of EWMA points with anomaly flags
 */
export function computeEWMAWithAnomalies(
    series: DailyCategorySpend[],
    alpha = 0.3,
    anomalyFactor = 2.5
): EWMAPoint[] {
    if (series.length === 0) return [];

    let ewma = series[0]?.total ?? 0;
    const result: EWMAPoint[] = [];

    for (let i = 0; i < series.length; i++) {
        const actual = series[i].total;

        if (i > 0) {
            ewma = alpha * actual + (1 - alpha) * ewma;
        }

        const isAnomaly = i > 0 && actual > anomalyFactor * result[i - 1].ewma;

        result.push({
            date: series[i].date,
            actual,
            ewma: Number(ewma.toFixed(2)),
            isAnomaly,
        });
    }

    return result;
}

/**
 * Get the current EWMA baseline (last value)
 */
export function getCurrentBaseline(ewmaPoints: EWMAPoint[]): number {
    if (ewmaPoints.length === 0) return 0;
    return ewmaPoints[ewmaPoints.length - 1].ewma;
}

/**
 * Calculate the trend (delta) between last two EWMA values
 */
export function getEWMATrend(ewmaPoints: EWMAPoint[]): number {
    if (ewmaPoints.length < 2) return 0;
    const last = ewmaPoints[ewmaPoints.length - 1].ewma;
    const prev = ewmaPoints[ewmaPoints.length - 2].ewma;
    return last - prev;
}
