"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Scan } from "lucide-react";
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
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/scan-receipt", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                const { amount, date, description, category } = result.data;

                // Auto-populate form fields
                setAmount(amount.toString());
                setCategory(category);
                setDescription(description);
                setDate(new Date(date));

                console.log("✅ Receipt scanned successfully", result.data);
            } else {
                console.error("❌ Failed to scan receipt:", result);
                alert(`Failed to scan receipt: ${result.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error("❌ Network error scanning receipt:", error);
            alert("Network error occurred while scanning receipt");
        } finally {
            setIsScanning(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <>
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleScanReceipt}
                className="hidden"
            />

            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:items-end">
                    {/* Amount */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Amount</label>
                        <Input
                            type="number"
                            step="0.01"
                            placeholder="44.61"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            className="w-full h-10"
                        />
                    </div>

                    {/* Category */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full h-10">
                                <SelectValue placeholder="Select" />
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

                    {/* Date */}
                    <div className="lg:col-span-2">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full h-10 justify-start text-left font-normal",
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

                    {/* Notes/Description */}
                    <div className="lg:col-span-3">
                        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2 uppercase">Notes/Description</label>
                        <Input
                            type="text"
                            placeholder="What was this for?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full h-10"
                        />
                    </div>

                    {/* Buttons */}
                    <div className="lg:col-span-3 flex flex-col sm:flex-row gap-2">
                        <Button
                            type="submit"
                            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 font-medium"
                            disabled={isSubmitting || isScanning}
                        >
                            {isSubmitting ? "Adding..." : "+ Add Expense"}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 h-10 bg-green-600 hover:bg-green-700 font-medium"
                            disabled={isSubmitting || isScanning}
                            title="Scan Receipt"
                        >
                            {isScanning ? (
                                <span className="flex items-center justify-center gap-1.5">
                                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                    Scan
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    <Scan className="h-4 w-4" />
                                    Scan Receipt
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </>
    );
}
