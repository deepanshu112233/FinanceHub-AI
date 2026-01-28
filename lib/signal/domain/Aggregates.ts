// Aggregated data structure for signal computation
// Signals never consume raw DB rows - always aggregated data

export interface DailyCategorySpend {
    date: string; // YYYY-MM-DD format
    category: string;
    total: number;
    count: number; // number of transactions
}

export interface CategorySummary {
    category: string;
    totalSpent: number;
    transactionCount: number;
    avgPerTransaction: number;
    dailyData: DailyCategorySpend[];
}

export interface MonthlyAggregate {
    userId: string;
    month: string; // YYYY-MM format
    categories: Record<string, CategorySummary>;
    totalSpent: number;
    budget?: number;
}

// For EWMA computation
export interface EWMAPoint {
    date: string;
    actual: number;
    ewma: number;
    isAnomaly: boolean;
}

export interface CategoryEWMA {
    category: string;
    alpha: number; // smoothing factor
    points: EWMAPoint[];
    currentBaseline: number;
}
