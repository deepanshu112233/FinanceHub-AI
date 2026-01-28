"use client";

import { useState, useEffect } from "react";
import { BudgetProgress } from "@/components/personal/BudgetProgress";
import { IncomeTracker } from "@/components/personal/IncomeTracker";
import { ExpenseForm } from "@/components/personal/ExpenseForm";
import { CategorySpendingPieChart } from "@/components/personal/CategorySpendingPieChart";
import { RecentTransactions } from "@/components/personal/RecentTransactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIInsightsView } from "@/components/insights/AIInsightsView";

interface DashboardStats {
    totalIncome: number;
    totalExpenses: number;
    incomeBySource: Record<string, number>;
    spendingByCategory: Record<string, { total: number; count: number }>;
    recentTransactions: Array<{
        id: string;
        type: "expense" | "income";
        amount: number;
        category: string;
        description: string | null;
        date: Date;
    }>;
    budget: {
        limit: number;
        spent: number;
        remaining: number;
        progress: number;
    };
}

export default function PersonalExpensePage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalIncome: 0,
        totalExpenses: 0,
        incomeBySource: {},
        spendingByCategory: {},
        recentTransactions: [],
        budget: {
            limit: 3500,
            spent: 0,
            remaining: 3500,
            progress: 0,
        },
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/dashboard/stats");
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleDataUpdate = () => {
        fetchStats();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-zinc-500">Loading your financial data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Personal Finance Tracker</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Track your income and expenses for the current month
                </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="ai-insight">AI Insight</TabsTrigger>
                </TabsList>

                {/* Info Tab */}
                <TabsContent value="info" className="space-y-6 mt-6">
                    {/* Top Cards: Budget Progress & Income Tracker - More compact */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <BudgetProgress spent={stats.budget.spent} limit={stats.budget.limit} />
                        <IncomeTracker
                            totalIncome={stats.totalIncome}
                            incomeBySource={stats.incomeBySource}
                            onIncomeAdded={handleDataUpdate}
                        />
                    </div>

                    {/* Expense Form */}
                    <ExpenseForm onExpenseAdded={handleDataUpdate} />

                    {/* Category Spending - Pie Chart with Expense List */}
                    <CategorySpendingPieChart spendingByCategory={stats.spendingByCategory} />

                    {/* Recent Transactions */}
                    <RecentTransactions transactions={stats.recentTransactions} onTransactionUpdated={handleDataUpdate} />
                </TabsContent>

                {/* AI Insight Tab */}
                <TabsContent value="ai-insight" className="space-y-6 mt-6">
                    <AIInsightsView />
                </TabsContent>
            </Tabs>
        </div>
    );
}
