"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { DollarSign, Utensils, Plane, ShoppingBag, Zap, Pencil, Loader2, CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Transaction {
    id: string;
    type: "expense" | "income";
    amount: number;
    category: string;
    description: string | null;
    date: Date;
}

interface TransactionHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTransactionUpdated?: () => void;
    shouldRefresh?: boolean; // Flag to indicate new transaction added
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
    Food: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
    Travel: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    Groceries: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    Rent_utilities: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    Personal_utilities: "text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/30",
    Other: "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900/30",
    Income: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    salary: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    freelance: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    investment: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
};

const EXPENSE_CATEGORIES = ["Food", "Travel", "Groceries", "Rent_utilities", "Personal_utilities", "Other"];
const INCOME_SOURCES = ["salary", "freelance", "investment", "bonus", "other"];

export function TransactionHistoryDialog({ open, onOpenChange, onTransactionUpdated, shouldRefresh }: TransactionHistoryDialogProps) {
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasFetched, setHasFetched] = useState(false); // Cache flag

    // Form state
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [description, setDescription] = useState("");

    // Invalidate cache when shouldRefresh changes (new transaction added)
    useEffect(() => {
        if (shouldRefresh) {
            setHasFetched(false);
        }
    }, [shouldRefresh]);

    // Fetch all transactions when dialog opens (only if not already fetched)
    useEffect(() => {
        if (open && !hasFetched) {
            fetchAllTransactions();
        }
    }, [open, hasFetched]);

    const fetchAllTransactions = async () => {
        setIsLoading(true);
        try {
            // Fetch all expenses and income separately
            const [expensesResponse, incomeResponse] = await Promise.all([
                fetch("/api/expenses/personal"),
                fetch("/api/income")
            ]);

            if (expensesResponse.ok && incomeResponse.ok) {
                const expensesData = await expensesResponse.json();
                const incomeData = await incomeResponse.json();

                // Extract arrays from response objects
                const expensesList = expensesData.expenses || [];
                const incomeList = incomeData.income || [];

                // Combine and format all transactions
                const combined = [
                    ...expensesList.map((e: any) => ({
                        id: e.id,
                        type: 'expense' as const,
                        amount: -e.amount,
                        category: e.category,
                        description: e.description,
                        date: e.date,
                    })),
                    ...incomeList.map((i: any) => ({
                        id: i.id,
                        type: 'income' as const,
                        amount: i.amount,
                        category: i.source,
                        description: i.description,
                        date: i.date,
                    })),
                ];

                // Sort by date descending (newest first)
                combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setAllTransactions(combined);
                setHasFetched(true); // Mark as fetched
            }
        } catch (error) {
            console.error("Failed to fetch transactions:", error);
        } finally {
            setIsLoading(false);
        }
    };

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
                // Invalidate cache and refresh the transaction list
                setHasFetched(false);
                await fetchAllTransactions();
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
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-5xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
                    <DialogHeader className="p-6 pb-4 flex-shrink-0">
                        <DialogTitle className="text-xl font-bold">Transaction History</DialogTitle>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {allTransactions.length} transaction{allTransactions.length !== 1 ? 's' : ''} total
                        </p>
                    </DialogHeader>

                    <div className="overflow-y-auto px-6 pb-6 flex-1 min-h-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : allTransactions.length === 0 ? (
                            <div className="text-center py-12 text-zinc-400">
                                No transactions found
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {allTransactions.map((transaction) => {
                                    const Icon = CATEGORY_ICONS[transaction.category] || DollarSign;
                                    const categoryColor = CATEGORY_COLORS[transaction.category] || "text-zinc-600 bg-zinc-100";

                                    return (
                                        <div
                                            key={transaction.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`p-2 rounded-lg flex-shrink-0 ${categoryColor}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">
                                                        {transaction.description || transaction.category}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                        <span>{new Date(transaction.date).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{transaction.category}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                <p
                                                    className={`text-sm font-semibold whitespace-nowrap ${transaction.type === "income" && transaction.amount >= 0
                                                        ? "text-green-600 dark:text-green-400"
                                                        : "text-red-600 dark:text-red-400"
                                                        }`}
                                                >
                                                    {transaction.amount >= 0 ? "+" : "-"}$
                                                    {Math.abs(transaction.amount).toFixed(2)}
                                                </p>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditClick(transaction)}
                                                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Transaction Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                            Edit {editingTransaction?.type === "income" ? "Income" : "Expense"}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-5 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-amount" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount ($)</Label>
                            <Input
                                id="edit-amount"
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-category" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                {editingTransaction?.type === "income" ? "Source" : "Category"}
                            </Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                    {(editingTransaction?.type === "income" ? INCOME_SOURCES : EXPENSE_CATEGORIES).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700",
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
                            <Label htmlFor="edit-description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description (Optional)</Label>
                            <Input
                                id="edit-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
