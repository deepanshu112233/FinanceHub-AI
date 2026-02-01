'use client';

import { useEffect, useState } from "react";
import { ExpenseBreakdownTable } from "@/components/insights/ExpenseBreakdownTable";
import { MonthlyExpenseChart } from "@/components/insights/MonthlyExpenseChart";
import { AIInsightCard } from "@/components/insights/AIInsightCard";
import { Loader2 } from "lucide-react";

interface MonthlyExpenseData {
    month: string;
    Food: number;
    Travel: number;
    Groceries: number;
    Rent_utilities: number;
    Personal_utilities: number;
    Other: number;
    total: number;
}

export default function InsightsPage() {
    const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpenseData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMonthlyBreakdown();
    }, []);

    const fetchMonthlyBreakdown = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/insights/monthly-breakdown');

            if (!response.ok) {
                // 404 means user not found - treat as empty state, not error
                if (response.status === 404) {
                    console.log('User not found in database - showing empty state');
                    setMonthlyExpenses([]);
                    setIsLoading(false);
                    return;
                }

                // For other errors (401, 500, etc.), log and throw
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                console.error(`Failed to fetch monthly breakdown - Status: ${response.status}`, errorData);
                throw new Error('Unable to load insights. Please try again later.');
            }

            const data = await response.json();
            setMonthlyExpenses(data);
            console.log(`Successfully fetched monthly breakdown - ${data.length} months`);
        } catch (err) {
            console.error('Error fetching monthly breakdown:', err);
            // Only set error for actual failures (network errors, server errors, etc.)
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const chartData = monthlyExpenses.map(expense => ({
        month: expense.month,
        amount: expense.total
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                        No Insights Available
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">{error}</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        Add some expenses in the Personal tab to see AI-powered insights.
                    </p>
                </div>
            </div>
        );
    }

    // Empty state - when no expenses yet
    if (monthlyExpenses.length === 0) {
        return (
            <div className="p-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                        Start Tracking Your Expenses
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 mb-4">
                        Add your first expense to unlock AI-powered insights and spending analysis.
                    </p>
                    <a
                        href="/personal"
                        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Go to Personal Expenses
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                    AI Insights & Reports
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400 mt-2">
                    Analyze your spending patterns and get AI-powered financial insights
                </p>
            </div>

            {/* Chart and AI Insights Grid */}
            {monthlyExpenses.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Expense Chart */}
                    <MonthlyExpenseChart data={chartData} />

                    {/* AI Insight Card */}
                    <AIInsightCard />
                </div>
            )}

            {/* Expense Breakdown Table */}
            <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4">
                    Category-wise Expense Breakdown
                </h2>
                <ExpenseBreakdownTable data={monthlyExpenses} />
            </div>
        </div>
    );
}
