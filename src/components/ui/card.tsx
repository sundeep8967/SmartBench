import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = "", noPadding = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950 ${className}`}
                {...props}
            >
                <div className={noPadding ? "" : "p-6"}>{children}</div>
            </div>
        );
    }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = "", children, ...props }, ref) => (
        <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
            {children}
        </div>
    )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className = "", children, ...props }, ref) => (
        <h3 ref={ref} className={`font-semibold leading-none tracking-tight ${className}`} {...props}>
            {children}
        </h3>
    )
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className = "", children, ...props }, ref) => (
        <div ref={ref} className={`p-6 pt-0 ${className}`} {...props}>
            {children}
        </div>
    )
);
CardContent.displayName = "CardContent";
