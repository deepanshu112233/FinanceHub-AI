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
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            setMonthlyExpenses(data);
        } catch (err) {
            console.error('Error fetching monthly breakdown:', err);
            setError('Failed to load expense data');
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
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
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
