"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { invalidateInsightsCache } from "@/lib/utils/cacheInvalidation";

interface ExpenseFormProps {
    onExpenseAdded: () => void;
}

const CATEGORIES = [
    "Food",
    "Travel",
    "Groceries",
    "Rent_utilities",
    "Personal_utilities",
    "Other",
];

export function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!amount || !category) {
            alert('Please fill in all required fields: Amount and Category');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/expenses/personal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    category,
                    description,
                    date: date.toISOString(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Expense added successfully:', data);
                setAmount("");
                setCategory("");
                setDescription("");
                setDate(new Date());

                // Invalidate insights cache so new data is fetched
                invalidateInsightsCache();

                onExpenseAdded();
            } else {
                console.error('❌ Failed to add expense:', data);
                alert(`Failed to add expense: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("❌ Network error adding expense:", error);
            alert('Network error occurred while adding expense');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-1">
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Amount</label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="$ 0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="w-full"
                    />
                </div>

                <div className="md:col-span-1">
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Category</label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="md:col-span-1">
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Date</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "MM/dd/yyyy") : <span>mm/dd/yyyy</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="start" className="w-auto p-0">
                            <Calendar mode="single" selected={date} onSelect={(day) => day && setDate(day)} />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="md:col-span-1">
                    <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Notes/Description</label>
                    <Input
                        type="text"
                        placeholder="What was this for?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full"
                    />
                </div>

                <div className="md:col-span-1 flex items-end">
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                        {isSubmitting ? "Adding..." : "+ Add Expense"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
