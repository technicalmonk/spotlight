import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names with conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a numeric price as a USD string.
 *
 * @example formatPrice(1.5) → "$1.50"
 * @example formatPrice(0.0015) → "$0.0015"
 * @example formatPrice(null) → "—"
 */
export function formatPrice(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";

  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  if (num === 0) return "$0.00";

  // For very small values, show more precision
  if (num < 0.01) {
    return `$${num.toFixed(6)}`;
  }
  if (num < 1) {
    return `$${num.toFixed(4)}`;
  }

  return `$${num.toFixed(2)}`;
}

/**
 * Format a number with thousands separators.
 *
 * @example formatNumber(1000000) → "1,000,000"
 * @example formatNumber(128000) → "128,000"
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";

  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num)) return "—";

  return num.toLocaleString("en-US");
}

/**
 * Format a context window (token count) as a human-readable string.
 *
 * @example formatContext(128000) → "128K"
 * @example formatContext(1000000) → "1M"
 * @example formatContext(8192) → "8K"
 */
export function formatContext(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";

  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num)) return "—";

  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    // Show 1M, 2M, 1.5M etc.
    return millions % 1 === 0
      ? `${millions}M`
      : `${millions.toFixed(1)}M`;
  }

  if (num >= 1000) {
    const thousands = num / 1000;
    return thousands % 1 === 0
      ? `${thousands}K`
      : `${thousands.toFixed(1)}K`;
  }

  return String(num);
}

/**
 * Format a multiplier value (e.g., for batch discounts).
 *
 * @example formatMultiplier(0.5) → "0.5x"
 * @example formatMultiplier(2) → "2x"
 */
export function formatMultiplier(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value}x`;
}

/**
 * Convert a string to a URL-safe slug.
 *
 * @example slugify("GPT-4o") → "gpt-4o"
 * @example slugify("Claude 3.5 Sonnet") → "claude-3-5-sonnet"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Capitalize the first letter of each word in a string.
 * Useful for display names derived from slugs.
 */
export function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Format a context window value as a human-readable string.
 * Alias for formatContext, used by components that refer to it as formatContextWindow.
 */
export function formatContextWindow(value: number | string | null | undefined): string {
  return formatContext(value);
}

/**
 * Format a date (Date, ISO string, or date-only string) as a short date.
 *
 * @example formatDate("2024-01-15") → "Jan 15, 2024"
 * @example formatDate(new Date("2024-01-15")) → "Jan 15, 2024"
 */
export function formatDate(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format a date with time for display.
 *
 * @example formatDateTime(new Date("2024-01-15T10:30:00Z")) → "Jan 15, 2024, 10:30 AM"
 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
