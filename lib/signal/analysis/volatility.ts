/**
 * Calculate mean (average) of a series
 */
export function mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = mean(values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
    return Math.sqrt(variance);
}

/**
 * Calculate coefficient of variation (volatility measure)
 * Returns standard deviation / mean
 * Higher value = more volatile
 */
export function volatility(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = mean(values);
    if (avg === 0) return 0;
    const std = standardDeviation(values);
    return std / avg;
}

/**
 * Classify volatility level
 */
export function classifyVolatility(vol: number): "LOW" | "NORMAL" | "HIGH" {
    if (vol < 0.3) return "LOW";
    if (vol < 0.6) return "NORMAL";
    return "HIGH";
}

/**
 * Calculate rolling volatility (volatility over time windows)
 * @param values - Time series data
 * @param windowSize - Size of rolling window
 */
export function rollingVolatility(values: number[], windowSize = 7): number[] {
    const result: number[] = [];

    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - windowSize + 1);
        const window = values.slice(start, i + 1);
        result.push(volatility(window));
    }

    return result;
}
