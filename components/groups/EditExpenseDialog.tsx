"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { useGroupData } from "@/contexts/GroupDataContext";
import { dispatchCacheInvalidation } from "@/lib/cache-utils";

interface Member {
    id: string;
    name: string;
    email: string;
    status: string;
}

interface Split {
    memberId: string;
    amount: number;
}

interface EditExpenseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    expenseId: string | null;
    onSuccess?: () => void;
}

export function EditExpenseDialog({ open, onOpenChange, groupId, expenseId, onSuccess }: EditExpenseDialogProps) {
    const { data, mutate } = useGroupData();

    // Use members from context instead of fetching separately
    const members = (data?.members || []) as Member[];

    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [paidByMemberId, setPaidByMemberId] = useState("");
    const [date, setDate] = useState("");
    const [isEqualSplit, setIsEqualSplit] = useState(true);
    const [customSplits, setCustomSplits] = useState<{ [memberId: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingExpense, setIsFetchingExpense] = useState(false);
    const [error, setError] = useState("");

    // Try to get expense from context first, otherwise fetch
    useEffect(() => {
        if (open && groupId && expenseId) {
            // Try to find expense in cached data
            const cachedExpense = data?.expenses?.find(e => e.id === expenseId);

            if (cachedExpense) {
                // Use cached data - instant load!
                populateFormFromExpense(cachedExpense);
            } else {
                // Fallback: fetch expense if not in cache
                fetchExpenseData();
            }
        }
    }, [open, groupId, expenseId, data]);

    const populateFormFromExpense = (expense: any) => {
        // Pre-populate form fields
        setDescription(expense.description);
        setAmount(expense.amount.toString());
        setPaidByMemberId(expense.paidByMemberId);

        // Format date to YYYY-MM-DD for input type="date"
        const expenseDate = new Date(expense.date);
        setDate(expenseDate.toISOString().split('T')[0]);

        // Determine if equal split
        const splits = expense.splits || [];
        const allEqual = splits.length > 0 && splits.every((s: any) =>
            Math.abs(s.amount - splits[0].amount) < 0.01
        );
        setIsEqualSplit(allEqual);

        // Set custom splits
        const splitsMap: { [key: string]: string } = {};
        members.forEach((member: Member) => {
            const split = splits.find((s: any) => s.memberId === member.id);
            splitsMap[member.id] = split ? split.amount.toString() : "0";
        });
        setCustomSplits(splitsMap);
    };

    const fetchExpenseData = async () => {
        try {
            setIsFetchingExpense(true);

            // Only fetch expense details - members already in context!
            const expenseResponse = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`);
            if (!expenseResponse.ok) throw new Error('Failed to fetch expense');
            const expenseData = await expenseResponse.json();

            populateFormFromExpense(expenseData.expense);

        } catch (err) {
            console.error("Failed to fetch expense data:", err);
            setError("Failed to load expense data");
        } finally {
            setIsFetchingExpense(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!description.trim()) {
            setError("Description is required");
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            setError("Amount must be greater than 0");
            return;
        }
        if (!paidByMemberId) {
            setError("Please select who paid");
            return;
        }

        // Calculate splits
        const splits: Split[] = [];
        const totalAmount = parseFloat(amount);

        if (isEqualSplit) {
            // Equal split among all members
            const splitAmount = totalAmount / members.length;
            for (const member of members) {
                splits.push({
                    memberId: member.id,
                    amount: splitAmount,
                });
            }
        } else {
            // Custom split
            let totalSplit = 0;
            for (const member of members) {
                const splitAmount = parseFloat(customSplits[member.id] || "0");
                if (splitAmount > 0) {
                    splits.push({
                        memberId: member.id,
                        amount: splitAmount,
                    });
                    totalSplit += splitAmount;
                }
            }

            // Validate total matches
            if (Math.abs(totalSplit - totalAmount) > 0.01) {
                setError(`Split amounts must equal total amount ($${totalAmount.toFixed(2)})`);
                return;
            }

            if (splits.length === 0) {
                setError("At least one member must have a split amount");
                return;
            }
        }

        try {
            setIsLoading(true);

            // Close dialog immediately for better UX
            onOpenChange(false);

            // Prepare updated expense data
            const updatedExpenseData = {
                id: expenseId,
                description,
                amount: totalAmount,
                category: "Other",
                paidByMemberId,
                date: date ? new Date(date).toISOString() : new Date().toISOString(),
                splits: splits.map(s => ({
                    ...s,
                    memberId: s.memberId,
                    amount: s.amount
                }))
            };

            // Optimistic update - update UI immediately without refetching
            if (data) {
                const currentData = data;
                const optimisticData = {
                    ...currentData,
                    expenses: currentData.expenses.map((exp: any) =>
                        exp.id === expenseId
                            ? {
                                ...exp,
                                description,
                                amount: totalAmount,
                                paidByMemberId,
                                date: updatedExpenseData.date,
                                // Keep existing expense structure
                                paidBy: {
                                    ...exp.paidBy,
                                    id: paidByMemberId
                                }
                            }
                            : exp
                    )
                };

                // Update cache immediately without refetching
                await mutate(optimisticData, { revalidate: false });
            }

            const response = await fetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    description,
                    amount: totalAmount,
                    category: "Other",
                    paidByMemberId,
                    splits,
                    date: date ? new Date(date).toISOString() : new Date().toISOString(),
                }),
            });

            if (response.ok) {
                // Dispatch cache invalidation event
                dispatchCacheInvalidation('expense-edited', { groupId, expenseId: expenseId || undefined });

                // Silently revalidate in background to sync with server
                mutate(undefined, { revalidate: true });

                // Call onSuccess callback if provided
                if (onSuccess) onSuccess();
            } else {
                // Rollback on error - refetch to get correct data
                await mutate(undefined, { revalidate: true });

                const data = await response.json();
                setError(data.error || "Failed to update expense");
            }
        } catch (err) {
            // Rollback on error - refetch to get correct data
            await mutate(undefined, { revalidate: true });

            setError("An error occurred while updating the expense");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomSplitChange = (memberId: string, value: string) => {
        setCustomSplits(prev => ({
            ...prev,
            [memberId]: value,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Expense</DialogTitle>
                </DialogHeader>

                {isFetchingExpense ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">Loading expense...</span>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="e.g., Dinner at restaurant"
                                required
                            />
                        </div>

                        {/* Amount and Date - Side by Side */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Amount */}
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount ($) *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            {/* Date */}
                            <div className="space-y-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Paid By */}
                        <div className="space-y-2">
                            <Label htmlFor="paidBy">Paid By *</Label>
                            <Select value={paidByMemberId} onValueChange={setPaidByMemberId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select who paid" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name}
                                            {member.status === "PENDING" && " (Pending)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Split Type */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="equalSplit"
                                    checked={isEqualSplit}
                                    onCheckedChange={(checked: boolean) => setIsEqualSplit(checked)}
                                />
                                <Label htmlFor="equalSplit" className="cursor-pointer">
                                    Split Equally
                                </Label>
                            </div>

                            {isEqualSplit ? (
                                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Each member will owe ${amount ? (parseFloat(amount) / members.length).toFixed(2) : "0.00"}
                                </p>
                            ) : (
                                <div className="space-y-3 border rounded-lg p-4">
                                    <Label>Custom Split Amounts ($)</Label>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Enter amounts for each member (must total ${amount || "0.00"})
                                    </p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {members.map((member) => (
                                            <div key={member.id} className="flex items-center gap-3">
                                                <Label className="w-40 text-sm truncate">
                                                    {member.name}
                                                    {member.status === "PENDING" && " (Pending)"}
                                                </Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={customSplits[member.id] || ""}
                                                    onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                                                    placeholder="0.00"
                                                    className="flex-1"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {!isEqualSplit && amount && (
                                        <p className="text-sm">
                                            Total: $
                                            {Object.values(customSplits)
                                                .reduce((sum, val) => sum + parseFloat(val || "0"), 0)
                                                .toFixed(2)}
                                            {" / $"}
                                            {parseFloat(amount).toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1"
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Expense"
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
