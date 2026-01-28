// Signal Types
export type SignalType =
    | "TREND"
    | "ANOMALY"
    | "VOLATILITY"
    | "BUDGET_PRESSURE"
    | "BEHAVIOR_PATTERN"
    | "GROUP_IMBALANCE"
    | "FORECAST_RISK";

// Severity Levels
export type SignalSeverity = "LOW" | "MEDIUM" | "HIGH";

// Core Signal Interface
export interface Signal {
    type: SignalType;
    userId: string;
    category?: string;
    groupId?: string;

    // Core data
    value: number | string;
    confidence?: number;
    severity: SignalSeverity;

    // Display
    title: string;
    message: string;
    dateRange?: string;

    // Metadata for detailed analysis
    metadata: Record<string, any>;
    generatedAt: Date;
}

// Specific signal metadata types for type safety
export interface TrendSignalMetadata {
    delta: number;
    baseline: number;
    changePct: number;
}

export interface AnomalySignalMetadata {
    baseline: number;
    multiplier: number;
    date: string;
}

export interface VolatilitySignalMetadata {
    score: number;
    stdRatio: number;
}

export interface BudgetPressureMetadata {
    spentSoFar: number;
    expectedByNow: number;
    daysLeft: number;
    budget: number;
}

export interface ForecastRiskMetadata {
    projectedMonthly: number;
    budget: number;
    riskPct: number;
}
