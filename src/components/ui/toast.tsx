"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    persistent?: boolean;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, persistent?: boolean) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

const toastStyles: Record<ToastType, { bg: string; border: string; icon: string; iconBg: string }> = {
    success: {
        bg: "bg-white",
        border: "border-green-200",
        icon: "text-green-500",
        iconBg: "bg-green-50"
    },
    error: {
        bg: "bg-white",
        border: "border-red-200",
        icon: "text-red-500",
        iconBg: "bg-red-50"
    },
    info: {
        bg: "bg-white",
        border: "border-blue-200",
        icon: "text-blue-500",
        iconBg: "bg-blue-50"
    },
    warning: {
        bg: "bg-white",
        border: "border-yellow-200",
        icon: "text-yellow-500",
        iconBg: "bg-yellow-50"
    }
};

const ToastIcon = ({ type }: { type: ToastType }) => {
    const icons = {
        success: CheckCircle,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle
    };
    const Icon = icons[type];
    return <Icon size={32} />;
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
    const [isExiting, setIsExiting] = useState(false);
    const styles = toastStyles[toast.type];

    useEffect(() => {
        if (!toast.persistent) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(onRemove, 300);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [toast.persistent, onRemove]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onRemove, 300);
    };

    return (
        <div
            className={`
                flex items-center gap-4 p-6 rounded-2xl shadow-2xl border-2
                ${styles.bg} ${styles.border}
                transform transition-all duration-300 ease-out
                ${isExiting ? "scale-95 opacity-0" : "scale-100 opacity-100"}
                min-w-[400px] max-w-[500px]
            `}
        >
            <div className={`p-3 rounded-full ${styles.iconBg} ${styles.icon}`}>
                <ToastIcon type={toast.type} />
            </div>
            <p className="flex-1 text-lg font-semibold text-gray-800">{toast.message}</p>
            <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notification"
            >
                <X size={18} />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = "info", persistent: boolean = false) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts((prev) => [...prev, { id, message, type, persistent }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast, removeToast }}>
            {children}
            {/* Toast Container - Centered on screen */}
            {toasts.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="flex flex-col gap-3">
                        {toasts.map((toast) => (
                            <ToastItem
                                key={toast.id}
                                toast={toast}
                                onRemove={() => removeToast(toast.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
}
