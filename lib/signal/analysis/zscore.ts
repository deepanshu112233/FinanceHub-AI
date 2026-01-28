import { mean, standardDeviation } from "./volatility";

/**
 * Calculate z-score (number of standard deviations from mean)
 * @param value - Value to test
 * @param meanVal - Mean of the distribution
 * @param std - Standard deviation
 * @returns Z-score
 */
export function zScore(value: number, meanVal: number, std: number): number {
    if (std === 0) return 0;
    return (value - meanVal) / std;
}

/**
 * Calculate z-score for a value in a series
 */
export function zScoreInSeries(value: number, series: number[]): number {
    const avg = mean(series);
    const std = standardDeviation(series);
    return zScore(value, avg, std);
}

/**
 * Check if a value is an outlier based on z-score
 * @param value - Value to test
 * @param series - Historical series
 * @param threshold - Z-score threshold (default 2 = 95% confidence)
 */
export function isOutlier(value: number, series: number[], threshold = 2): boolean {
    const z = zScoreInSeries(value, series);
    return Math.abs(z) > threshold;
}

/**
 * Get outlier severity
 */
export function getOutlierSeverity(zScore: number): "NONE" | "LOW" | "MEDIUM" | "HIGH" {
    const absZ = Math.abs(zScore);
    if (absZ < 2) return "NONE";
    if (absZ < 2.5) return "LOW";
    if (absZ < 3) return "MEDIUM";
    return "HIGH";
}
