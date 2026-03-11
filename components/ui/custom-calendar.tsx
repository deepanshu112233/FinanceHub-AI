"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type CalendarView = "days" | "months" | "years"

interface CustomCalendarProps {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    className?: string
    /** If true, calendar only picks month/year (no day grid) */
    monthOnly?: boolean
    /** Called when a month is selected in monthOnly mode, format: "YYYY-MM" */
    onMonthSelect?: (value: string) => void
    /** Currently selected month string in "YYYY-MM" format (for monthOnly mode) */
    selectedMonth?: string
}

export function CustomCalendar({
    selected,
    onSelect,
    className,
    monthOnly = false,
    onMonthSelect,
    selectedMonth,
}: CustomCalendarProps) {
    const getInitialDate = () => {
        if (selectedMonth) {
            const [y, m] = selectedMonth.split("-")
            return new Date(parseInt(y), parseInt(m) - 1)
        }
        return selected || new Date()
    }

    const [currentDate, setCurrentDate] = React.useState(getInitialDate)
    const [view, setView] = React.useState<CalendarView>(monthOnly ? "months" : "days")

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ]

    const monthShort = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const previousYear = () => {
        setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()))
    }

    const nextYear = () => {
        setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()))
    }

    // Year range navigation (12 years at a time)
    const getYearRange = () => {
        const startYear = Math.floor(currentDate.getFullYear() / 12) * 12
        return Array.from({ length: 12 }, (_, i) => startYear + i)
    }

    const previousYearRange = () => {
        setCurrentDate(new Date(currentDate.getFullYear() - 12, currentDate.getMonth()))
    }

    const nextYearRange = () => {
        setCurrentDate(new Date(currentDate.getFullYear() + 12, currentDate.getMonth()))
    }

    const selectDate = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        onSelect?.(newDate)
    }

    const selectMonth = (monthIndex: number) => {
        const newDate = new Date(currentDate.getFullYear(), monthIndex)
        setCurrentDate(newDate)
        if (monthOnly) {
            const yyyy = newDate.getFullYear()
            const mm = String(monthIndex + 1).padStart(2, "0")
            onMonthSelect?.(`${yyyy}-${mm}`)
        } else {
            setView("days")
        }
    }

    const selectYear = (year: number) => {
        setCurrentDate(new Date(year, currentDate.getMonth()))
        setView("months")
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

    const isCurrentMonth = (monthIndex: number) => {
        if (selectedMonth) {
            const [y, m] = selectedMonth.split("-")
            return parseInt(y) === currentDate.getFullYear() && parseInt(m) - 1 === monthIndex
        }
        if (!selected) return false
        return (
            selected.getMonth() === monthIndex &&
            selected.getFullYear() === currentDate.getFullYear()
        )
    }

    const isCurrentYear = (year: number) => {
        if (selectedMonth) {
            const [y] = selectedMonth.split("-")
            return parseInt(y) === year
        }
        return selected ? selected.getFullYear() === year : new Date().getFullYear() === year
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const blanks = Array.from({ length: firstDay }, (_, i) => i)
    const yearRange = getYearRange()

    return (
        <div className={cn("p-3 w-[280px]", className)}>
            {/* ===== YEARS VIEW ===== */}
            {view === "years" && (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={previousYearRange}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                            {yearRange[0]} – {yearRange[yearRange.length - 1]}
                        </span>
                        <button
                            type="button"
                            onClick={nextYearRange}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {yearRange.map((year) => (
                            <button
                                key={year}
                                type="button"
                                onClick={() => selectYear(year)}
                                className={cn(
                                    "py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400",
                                    isCurrentYear(year)
                                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white"
                                        : "text-zinc-700 dark:text-zinc-300"
                                )}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* ===== MONTHS VIEW ===== */}
            {view === "months" && (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={previousYear}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("years")}
                            className="text-sm font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            {currentDate.getFullYear()}
                        </button>
                        <button
                            type="button"
                            onClick={nextYear}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {monthShort.map((month, idx) => (
                            <button
                                key={month}
                                type="button"
                                onClick={() => selectMonth(idx)}
                                className={cn(
                                    "py-2.5 rounded-lg text-sm font-medium transition-colors",
                                    "hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400",
                                    isCurrentMonth(idx)
                                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white"
                                        : "text-zinc-700 dark:text-zinc-300"
                                )}
                            >
                                {month}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* ===== DAYS VIEW ===== */}
            {view === "days" && (
                <>
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={previousMonth}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setView("months")}
                            className="text-sm font-semibold text-zinc-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </button>
                        <button
                            type="button"
                            onClick={nextMonth}
                            className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {dayNames.map((day) => (
                            <div
                                key={day}
                                className="text-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400 py-1.5 uppercase tracking-wider"
                            >
                                {day}
                            </div>
                        ))}

                        {blanks.map((blank) => (
                            <div key={`blank-${blank}`} className="aspect-square" />
                        ))}

                        {days.map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => selectDate(day)}
                                className={cn(
                                    "aspect-square flex items-center justify-center text-sm rounded-lg transition-colors",
                                    "hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400",
                                    isSelected(day) &&
                                        "bg-blue-600 text-white hover:bg-blue-700 hover:text-white dark:hover:bg-blue-700 dark:hover:text-white",
                                    isToday(day) &&
                                        !isSelected(day) &&
                                        "bg-zinc-100 font-semibold dark:bg-zinc-800",
                                    !isSelected(day) &&
                                        !isToday(day) &&
                                        "text-zinc-900 dark:text-zinc-100"
                                )}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
