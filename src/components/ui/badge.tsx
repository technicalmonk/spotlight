import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Variant = "default" | "accent" | "secondary" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  default: "bg-brand-50 text-brand-700 border-brand-200",
  accent: "bg-spotlight-100 text-spotlight-700 border-spotlight-300",
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
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
