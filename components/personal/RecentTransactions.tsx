"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { DollarSign, Utensils, Plane, ShoppingBag, Zap, Search, MoreVertical, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface Transaction {
    id: string;
    type: "expense" | "income";
    amount: number;
    category: string;
    description: string | null;
    date: Date;
}

interface RecentTransactionsProps {
    transactions: Transaction[];
    onTransactionUpdated?: () => void;
}

const CATEGORY_ICONS: Record<string, typeof Utensils> = {
    Food: Utensils,
    Travel: Plane,
    Groceries: ShoppingBag,
    Rent_utilities: Zap,
    Personal_utilities: Zap,
    Other: DollarSign,
    salary: DollarSign,
    freelance: DollarSign,
    investment: DollarSign,
    Income: DollarSign,
};

const CATEGORY_COLORS: Record<string, string> = {
    Food: "bg-orange-500",
    Travel: "bg-blue-500",
    Groceries: "bg-purple-500",
    Rent_utilities: "bg-green-500",
    Personal_utilities: "bg-teal-500",
    Other: "bg-zinc-500",
    Income: "bg-green-500",
    salary: "bg-green-500",
    freelance: "bg-green-500",
    investment: "bg-green-500",
};

const EXPENSE_CATEGORIES = ["Food", "Travel", "Groceries", "Rent_utilities", "Personal_utilities", "Other"];
const INCOME_SOURCES = ["salary", "freelance", "investment", "bonus", "other"];

export function RecentTransactions({ transactions, onTransactionUpdated }: RecentTransactionsProps) {
    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
    const [timeFilter, setTimeFilter] = useState<"all" | "month" | "3months" | "6months" | "year">("all");

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Dialog states
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for editing
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [description, setDescription] = useState("");

    // Filter and search transactions
    const filteredTransactions = useMemo(() => {
        let filtered = [...transactions];

        // Type filter
        if (typeFilter !== "all") {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        // Time filter
        const now = new Date();
        if (timeFilter === "month") {
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filtered = filtered.filter(t => new Date(t.date) >= monthAgo);
        } else if (timeFilter === "3months") {
            const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
            filtered = filtered.filter(t => new Date(t.date) >= threeMonthsAgo);
        } else if (timeFilter === "6months") {
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
            filtered = filtered.filter(t => new Date(t.date) >= sixMonthsAgo);
        } else if (timeFilter === "year") {
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filtered = filtered.filter(t => new Date(t.date) >= yearAgo);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.description?.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [transactions, typeFilter, timeFilter, searchQuery]);

    // Paginated transactions
    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const isAllSelected = paginatedTransactions.length > 0 &&
        paginatedTransactions.every(t => selectedIds.has(t.id));

    // Delete handlers
    const handleDeleteClick = (ids: string[]) => {
        setDeletingIds(ids);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsSubmitting(true);
        try {
            // Separate expense and income IDs
            const expenseIds = deletingIds.filter(id =>
                transactions.find(t => t.id === id)?.type === "expense"
            );
            const incomeIds = deletingIds.filter(id =>
                transactions.find(t => t.id === id)?.type === "income"
            );

            // Delete expenses
            if (expenseIds.length > 0) {
                const response = await fetch('/api/expenses/personal/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: expenseIds }),
                });
                if (!response.ok) {
                    throw new Error('Failed to delete expenses');
                }
            }

            // Delete income
            if (incomeIds.length > 0) {
                const response = await fetch('/api/income/delete', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: incomeIds }),
                });
                if (!response.ok) {
                    throw new Error('Failed to delete income');
                }
            }

            // Clear selection and close dialog
            setSelectedIds(new Set());
            setIsDeleteDialogOpen(false);

            // Refresh transactions
            if (onTransactionUpdated) {
                onTransactionUpdated();
            }
        } catch (error) {
            console.error('Failed to delete transactions:', error);
            alert('Failed to delete transactions. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Edit handlers
    const handleEditClick = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setAmount(transaction.amount.toString());
        setCategory(transaction.category);
        setDate(new Date(transaction.date));
        setDescription(transaction.description || "");
        setIsEditDialogOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingTransaction) return;

        setIsSubmitting(true);

        try {
            const endpoint = editingTransaction.type === "income"
                ? `/api/income/${editingTransaction.id}`
                : `/api/expenses/personal/${editingTransaction.id}`;

            const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingTransaction.id,
                    amount: parseFloat(amount),
                    [editingTransaction.type === "income" ? "source" : "category"]: category,
                    description,
                    date: date.toISOString(),
                }),
            });

            if (response.ok) {
                setIsEditDialogOpen(false);
                setEditingTransaction(null);
                if (onTransactionUpdated) {
                    onTransactionUpdated();
                }
            } else {
                const data = await response.json();
                alert(`Failed to update: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Failed to update transaction:", error);
            alert('Network error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            {/* Header with Search and Filters */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recent Transactions</h3>
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteClick(Array.from(selectedIds))}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedIds.size})
                        </Button>
                    )}
                </div>

                {/* Search and Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Search transactions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* Type Filter */}
                    <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Time Filter */}
                    <Select value={timeFilter} onValueChange={(val: any) => setTimeFilter(val)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="All Transactions" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Transactions</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="3months">Last 3 Months</SelectItem>
                            <SelectItem value="6months">Last 6 Months</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Transaction Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                            <th className="p-4 w-10">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={handleSelectAll}
                                />
                            </th>
                            <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase p-4">
                                Date
                            </th>
                            <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase p-4">
                                Description
                            </th>
                            <th className="text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase p-4">
                                Category
                            </th>
                            <th className="text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase p-4">
                                Amount
                            </th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {paginatedTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-zinc-400">
                                    {searchQuery || typeFilter !== "all" || timeFilter !== "all"
                                        ? "No transactions match your filters"
                                        : "No transactions yet. Add your first expense or income!"}
                                </td>
                            </tr>
                        ) : (
                            paginatedTransactions.map((transaction) => {
                                const Icon = CATEGORY_ICONS[transaction.category] || DollarSign;
                                const categoryColor = CATEGORY_COLORS[transaction.category] || "bg-zinc-500";

                                return (
                                    <tr key={transaction.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                        <td className="p-4">
                                            <Checkbox
                                                checked={selectedIds.has(transaction.id)}
                                                onCheckedChange={(checked) =>
                                                    handleSelectOne(transaction.id, checked as boolean)
                                                }
                                            />
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium">
                                                {new Date(transaction.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium">
                                                {transaction.description || transaction.category}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded ${categoryColor} text-white`}>
                                                    <Icon className="h-3 w-3" />
                                                </div>
                                                <span className="text-sm">{transaction.category}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <p
                                                className={`text-sm font-semibold ${transaction.type === "income"
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-red-600 dark:text-red-400"
                                                    }`}
                                            >
                                                {transaction.type === "income" ? "+" : "-"}₹
                                                {Math.abs(transaction.amount).toLocaleString('en-IN', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2
                                                })}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(transaction)}>
                                                        <Pencil className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleDeleteClick([transaction.id])}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination - Always visible */}
            {filteredTransactions.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 pb-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 order-2 sm:order-1">
                        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} of{" "}
                        {filteredTransactions.length} transactions
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

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Edit {editingTransaction?.type === "income" ? "Income" : "Expense"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount">Amount (₹)</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-category">
                                {editingTransaction?.type === "income" ? "Source" : "Category"}
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(editingTransaction?.type === "income" ? INCOME_SOURCES : EXPENSE_CATEGORIES).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-zinc-400"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="start" className="w-auto p-0">
                                    <Calendar mode="single" selected={date} onSelect={(day) => day && setDate(day)} />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description (Optional)</Label>
                            <Input
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {deletingIds.length} transaction(s)? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
