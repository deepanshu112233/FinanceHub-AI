"use client";

import { EXPENSE_CATEGORIES } from "@/src/constants/categories";

interface MonthlyExpense {
    month: string;
    Food: number;
    Travel: number;
    Groceries: number;
    Rent_utilities: number;
    Personal_utilities: number;
    Other: number;
    total: number;
}

interface ExpenseBreakdownTableProps {
    data: MonthlyExpense[];
}

export function ExpenseBreakdownTable({ data }: ExpenseBreakdownTableProps) {
    const formatCurrency = (amount: number) => {
        return `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatCategoryName = (category: string) => {
        return category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full">
                <thead>
                    <tr className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
                        <th className="px-4 py-3 text-left text-sm font-semibold border-r border-cyan-400 whitespace-nowrap">
                            Month
                        </th>
                        {EXPENSE_CATEGORIES.map((category) => (
                            <th
                                key={category}
                                className="px-4 py-3 text-center text-sm font-semibold border-r border-cyan-400 whitespace-nowrap"
                            >
                                {formatCategoryName(category)}
                            </th>
                        ))}
                        <th className="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap">
                            Total
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={EXPENSE_CATEGORIES.length + 2}
                                className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400"
                            >
                                No expense data available
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => {
                            const isEvenRow = index % 2 === 0;
                            return (
                                <tr
                                    key={row.month}
                                    className={`${isEvenRow
                                            ? "bg-white dark:bg-zinc-950"
                                            : "bg-zinc-50 dark:bg-zinc-900"
                                        } border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}
                                >
                                    <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-white border-r border-zinc-200 dark:border-zinc-800 italic whitespace-nowrap">
                                        {row.month}
                                    </td>
                                    {EXPENSE_CATEGORIES.map((category) => (
                                        <td
                                            key={category}
                                            className="px-4 py-3 text-sm text-center text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800"
                                        >
                                            {row[category].toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-sm text-right font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                                        {formatCurrency(row.total)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
