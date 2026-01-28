"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomCalendarProps {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    className?: string
}

export function CustomCalendar({ selected, onSelect, className }: CustomCalendarProps) {
    const [currentDate, setCurrentDate] = React.useState(selected || new Date())

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month, 1).getDay()
    }

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const selectDate = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        onSelect?.(newDate)
    }

    const isSelected = (day: number) => {
        if (!selected) return false
        return (
            selected.getDate() === day &&
            selected.getMonth() === currentDate.getMonth() &&
            selected.getFullYear() === currentDate.getFullYear()
        )
    }

    const isToday = (day: number) => {
        const today = new Date()
        return (
            today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear()
        )
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const blanks = Array.from({ length: firstDay }, (_, i) => i)

    return (
        <div className={cn("p-3", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={previousMonth}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                    type="button"
                    onClick={nextMonth}
                    className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Day Names */}
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="text-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400 py-2 uppercase tracking-wider"
                    >
                        {day}
                    </div>
                ))}

                {/* Blank cells */}
                {blanks.map((blank) => (
                    <div key={`blank-${blank}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {days.map((day) => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => selectDate(day)}
                        className={cn(
                            "aspect-square flex items-center justify-center text-sm rounded-md transition-colors",
                            "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                            isSelected(day) && "bg-zinc-900 text-white hover:bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50",
                            isToday(day) && !isSelected(day) && "bg-zinc-100 font-semibold dark:bg-zinc-800",
                            !isSelected(day) && !isToday(day) && "text-zinc-900 dark:text-zinc-100"
                        )}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    )
}
