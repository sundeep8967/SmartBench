"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
    view: "card" | "table";
    onChange: (view: "card" | "table") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
    return (
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange("card")}
                className={`h-8 px-3 rounded-md transition-all ${view === "card"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                <LayoutGrid size={16} />
            </Button>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange("table")}
                className={`h-8 px-3 rounded-md transition-all ${view === "table"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
            >
                <List size={16} />
            </Button>
        </div>
    );
}
