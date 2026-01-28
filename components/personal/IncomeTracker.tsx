"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface IncomeTrackerProps {
    totalIncome: number;
    incomeBySource: Record<string, number>;
    onIncomeAdded: () => void;
}

export function IncomeTracker({ totalIncome, incomeBySource, onIncomeAdded }: IncomeTrackerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [source, setSource] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState<Date>(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/income", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    source,
                    description,
                    date: date.toISOString(),
                }),
            });

            if (response.ok) {
                setIsOpen(false);
                setAmount("");
                setSource("");
                setDescription("");
                setDate(new Date());
                onIncomeAdded();
            }
        } catch (error) {
            console.error("Failed to add income:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">INCOME TRACKER</p>
                        <p className="text-xl font-bold">
                            ${totalIncome.toFixed(2)}
                            <span className="text-xs text-zinc-400 font-normal ml-1">this month</span>
                        </p>
                    </div>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">+ Add Income</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">Add Income</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount ($)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                    className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="source" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Source</Label>
                                <Select value={source} onValueChange={setSource} required>
                                    <SelectTrigger className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white">
                                        <SelectValue placeholder="Select income source" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                        <SelectItem value="salary">Main Salary</SelectItem>
                                        <SelectItem value="freelance">Freelance</SelectItem>
                                        <SelectItem value="investment">Investment</SelectItem>
                                        <SelectItem value="bonus">Bonus</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
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
                                                "w-full justify-start text-left font-normal bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800",
                                                !date && "text-zinc-400 dark:text-zinc-500"
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
                                <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    placeholder="e.g., Monthly salary"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5" disabled={isSubmitting}>
                                {isSubmitting ? "Adding..." : "Add Income"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </Card>
    );
}
