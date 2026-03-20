import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyRs(amount: number) {
  return `Rs ${amount.toLocaleString("en-LK")}`
}
