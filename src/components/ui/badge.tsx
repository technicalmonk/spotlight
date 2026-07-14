import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "secondary" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default: "bg-brand-50 text-brand-700 border-brand-200",
  secondary: "bg-gray-100 text-gray-700 border-gray-200",
  outline: "bg-transparent text-gray-600 border-gray-300",
};

export function Badge({
  className,
  variant = "secondary",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
