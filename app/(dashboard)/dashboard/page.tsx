"use client";

import { useState, useEffect } from "react";
import { IncomeCard } from "@/components/dashboard/IncomeCard";
import { MonthlySpendCard } from "@/components/dashboard/MonthlySpendCard";
import { TopCategoryCard } from "@/components/dashboard/TopCategoryCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { UserGroupsList } from "@/components/dashboard/UserGroupsList";
import { Loader2 } from "lucide-react";

interface DashboardData {
    income: {
        current: number;
        previous: number;
        change: number;
    };
    spending: {
        current: number;
        previous: number;
        change: number;
    };
    topCategory: {
        category: string;
        amount: number;
        percentage: number;
    } | null;
    groups: Array<{
        id: string;
        name: string;
        description: string | null;
        memberCount: number;
        role: string;
    }>;
    alerts: Array<{
        type: 'warning' | 'info';
        message: string;
        category: string;
    }>;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/dashboard/stats');
            if (response.ok) {
                const result = await response.json();
                setData(result.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6">
                <div className="text-center py-12 text-zinc-500">
                    Failed to load dashboard data
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Financial Snapshot</h2>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <IncomeCard
                    current={data.income.current}
                    previous={data.income.previous}
                    change={data.income.change}
                />
                <MonthlySpendCard
                    current={data.spending.current}
                    previous={data.spending.previous}
                    change={data.spending.change}
                />
                <TopCategoryCard
                    category={data.topCategory?.category || null}
                    amount={data.topCategory?.amount || 0}
                    percentage={data.topCategory?.percentage || 0}
                />
                <AlertsCard alerts={data.alerts} />
            </div>

            {/* Groups List */}
            <UserGroupsList groups={data.groups} />
        </div>
    );
}
