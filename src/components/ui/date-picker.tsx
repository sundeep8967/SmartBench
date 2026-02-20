import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
    value?: Date;
    onChange?: (date?: Date) => void;
    placeholder?: string;
    className?: string;
    fromYear?: number;
    toYear?: number;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Pick a date",
    className,
    fromYear,
    toYear
}: DatePickerProps) {
    const defaultFromYear = new Date().getFullYear() - 100;
    const defaultToYear = new Date().getFullYear() + 20;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "PPP") : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={onChange}
                    initialFocus
                    captionLayout="dropdown"
                    fromYear={fromYear ?? defaultFromYear}
                    toYear={toYear ?? defaultToYear}
                />
            </PopoverContent>
        </Popover>
    )
}
