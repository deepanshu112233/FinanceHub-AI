"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MonthYearPickerProps {
    value: string // "YYYY-MM"
    onChange: (value: string) => void
    className?: string
}

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

export function MonthYearPicker({ value, onChange, className }: MonthYearPickerProps) {
    const [open, setOpen] = React.useState(false)

    const displayLabel = React.useMemo(() => {
        if (!value) return "Select month"
        const [year, month] = value.split("-")
        const monthIndex = parseInt(month) - 1
        return `${monthNames[monthIndex]} ${year}`
    }, [value])

    const handleMonthSelect = (val: string) => {
        onChange(val)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-start text-left font-normal gap-2",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-zinc-800 dark:text-zinc-200" />
                    {displayLabel}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
                <Calendar
                    monthOnly
                    selectedMonth={value}
                    onMonthSelect={handleMonthSelect}
                />
            </PopoverContent>
        </Popover>
    )
}
