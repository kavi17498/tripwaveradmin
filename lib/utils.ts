import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyRs(amount: number) {
  return `Rs ${amount.toLocaleString("en-LK")}`
}

export function formatFirestoreTimestamp(timestamp?: { _seconds: number; _nanoseconds: number } | null) {
  if (!timestamp) return "-";

  return new Date(timestamp._seconds * 1000).toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
