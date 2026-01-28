"use client"

import * as React from "react"
import { CustomCalendar } from "./custom-calendar"

export type CalendarProps = {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    className?: string
    mode?: "single"
}

function Calendar({ selected, onSelect, className, ...props }: CalendarProps) {
    return <CustomCalendar selected={selected} onSelect={onSelect} className={className} />
}

Calendar.displayName = "Calendar"

export { Calendar }
