"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                month_caption: "flex justify-center mb-4 relative items-center",
                caption_label: "text-sm font-medium inline-flex items-center gap-1",
                nav: "flex items-center justify-between absolute inset-x-0 top-0 bottom-0 z-20 px-1 pointer-events-none",
                button_previous: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 pointer-events-auto"
                ),
                button_next: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 pointer-events-auto"
                ),
                month_grid: "w-full border-collapse space-y-1",
                weekdays: "flex border-b border-neutral-200 pb-2 mb-2",
                weekday:
                    "text-neutral-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-neutral-400 flex-1 text-center",
                week: "flex w-full mt-2 justify-between",
                day: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-neutral-100/50 [&:has([aria-selected])]:bg-neutral-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-neutral-800/50 dark:[&:has([aria-selected])]:bg-neutral-800",
                day_button: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal rounded-full hover:bg-neutral-100 aria-selected:opacity-100"
                ),
                range_end: "day-range-end",
                selected:
                    "bg-[#0b3366] text-white hover:bg-[#0b3366] hover:text-white focus:bg-[#0b3366] focus:text-white shadow-md dark:bg-blue-600 dark:text-white",
                today: "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-50",
                outside:
                    "day-outside text-neutral-400 opacity-50 aria-selected:bg-neutral-100/50 aria-selected:text-neutral-500 aria-selected:opacity-30 dark:text-neutral-400 dark:aria-selected:bg-neutral-800/50",
                disabled: "text-neutral-500 opacity-50 dark:text-neutral-400",
                range_middle:
                    "aria-selected:bg-neutral-100 aria-selected:text-neutral-900 dark:aria-selected:bg-neutral-800 dark:aria-selected:text-neutral-50",
                hidden: "invisible",
                dropdowns: "flex justify-center gap-2 items-center",
                dropdown: "absolute inset-0 w-full h-full opacity-0 cursor-pointer",
                dropdown_root: "relative inline-flex items-center gap-1 bg-white border border-neutral-200 rounded-md shadow-sm px-3 py-1 text-sm font-medium hover:bg-neutral-50 cursor-pointer",
                chevron: "h-4 w-4",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation, ...rest }) => {
                    if (orientation === 'left') {
                        return <ChevronLeft className="h-4 w-4" />
                    }
                    if (orientation === 'right') {
                        return <ChevronRight className="h-4 w-4" />
                    }
                    return <ChevronDown className="h-3.5 w-3.5" />
                }
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
