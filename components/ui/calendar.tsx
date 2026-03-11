"use client"

import * as React from "react"
import { CustomCalendar } from "./custom-calendar"

export type CalendarProps = {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    className?: string
    mode?: "single"
    /** If true, only month/year selection (no day grid) */
    monthOnly?: boolean
    /** Called when month is selected in monthOnly mode */
    onMonthSelect?: (value: string) => void
    /** Selected month in "YYYY-MM" format */
    selectedMonth?: string
}

function Calendar({ selected, onSelect, className, monthOnly, onMonthSelect, selectedMonth }: CalendarProps) {
    return (
        <CustomCalendar
            selected={selected}
            onSelect={onSelect}
            className={className}
            monthOnly={monthOnly}
            onMonthSelect={onMonthSelect}
            selectedMonth={selectedMonth}
        />
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
