"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Zap, ShoppingCart, Loader2, Edit, Trash2 } from "lucide-react";
import { EditExpenseDialog } from "@/components/groups/EditExpenseDialog";
import { useGroupData } from "@/contexts/GroupDataContext";

interface Transaction {
    id: string;
    description: string;
    amount: number;
    paidBy: string;
    splitType: string;
    date: string;
    icon: "bill" | "groceries";
}

// Helper function to format date to relative time
function formatRelativeDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diff / (1000 * 60));

    if (diffMinutes < 60) {
        return "TODAY, " + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffHours < 24) {
        return "TODAY, " + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffDays === 1) {
        return "YESTERDAY";
    } else if (diffDays < 7) {
        return `${diffDays} DAYS AGO`;
    } else if (diffDays < 14) {
        return "1 WEEK AGO";
    } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)} WEEKS AGO`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Helper function to get icon based on category
function getCategoryIcon(category: string): "bill" | "groceries" {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('food') || lowerCategory.includes('groceries') || lowerCategory.includes('restaurant')) {
        return "groceries";
    }
    return "bill";
}

export function GroupTransactions() {
    const { data, isLoading, isError, mutate } = useGroupData();
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const expenses = data?.expenses || [];

    // Transform API response to match component structure
    const transactions: Transaction[] = expenses.map((expense: any) => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        paidBy: expense.paidBy?.user?.name || 'Unknown',
        splitType: expense.splits?.length > 0 ? 'Split equally' : 'Not split',
        date: formatRelativeDate(new Date(expense.date)),
        icon: getCategoryIcon(expense.category || 'Other'),
    }));

    // Paginated transactions
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [transactions, currentPage]);

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);

    const handleEditClick = (expenseId: string) => {
        setEditingExpenseId(expenseId);
        setIsEditDialogOpen(true);
    };

    const handleEditSuccess = async () => {
        // EditExpenseDialog already handles optimistic updates and revalidation
        // No need to do anything here
    };

    const handleDeleteClick = (expenseId: string) => {
        setDeletingExpenseId(expenseId);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingExpenseId || !data?.groupId) return;

        setIsDeleting(true);

        // Close dialog immediately for better UX
        setIsDeleteDialogOpen(false);

        try {
            // Optimistic update - remove from UI immediately after dialog closes
            const currentData = data;
            const optimisticData = {
                ...currentData,
                expenses: currentData.expenses.filter((exp: any) => exp.id !== deletingExpenseId)
            };

            // Update UI immediately with optimistic data
            await mutate(optimisticData, {
                revalidate: false, // Don't revalidate yet
            });

            const response = await fetch(`/api/groups/${data.groupId}/expenses/${deletingExpenseId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Rollback on error
                await mutate(currentData, { revalidate: false });
                throw new Error('Failed to delete expense');
            }

            // Clear state
            setDeletingExpenseId(null);

            // Revalidate to get fresh data from server
            await mutate(undefined, { revalidate: true });
        } catch (error) {
            console.error('Failed to delete expense:', error);
            alert('Failed to delete expense. Please try again.');
            setDeletingExpenseId(null);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card className="p-6">
                <div className="text-center py-8">
                    <p className="text-red-600 dark:text-red-400">Failed to load transactions</p>
                </div>
            </Card>
        );
    }

    if (transactions.length === 0) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Recent Transactions</h3>
                </div>
                <div className="text-center py-12">
                    <p className="text-zinc-500 dark:text-zinc-400">No transactions yet</p>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2">
                        Add an expense to get started
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Recent Transactions</h3>
                {/* Removed "View All" button */}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800">
                            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Description
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Paid By
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Split Type
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Date
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Amount
                            </th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedTransactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="group border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                            >
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            {transaction.icon === "bill" ? (
                                                <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            )}
                                        </div>
                                        <span className="font-medium text-zinc-900 dark:text-white">
                                            {transaction.description}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                                    {transaction.paidBy}
                                </td>
                                <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                                    {transaction.splitType}
                                </td>
                                <td className="py-3 px-4 text-sm text-zinc-500 dark:text-zinc-400">
                                    {transaction.date}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-zinc-900 dark:text-white">
                                    ${transaction.amount.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEditClick(transaction.id)}
                                            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Edit expense"
                                        >
                                            <Edit className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(transaction.id)}
                                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete expense"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination - Always visible when there are transactions */}
            {transactions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 pb-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 order-2 sm:order-1">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, transactions.length)} of{" "}
                        {transactions.length} transactions
                    </p>
                    <div className="flex items-center gap-3 order-1 sm:order-2">
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="min-w-[100px]"
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-semibold px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-md min-w-[100px] text-center">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="default"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="min-w-[100px]"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Edit Expense Dialog */}
            {editingExpenseId && data?.groupId && (
                <EditExpenseDialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    groupId={data.groupId}
                    expenseId={editingExpenseId}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this expense? This action cannot be undone and will affect all group balances.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
