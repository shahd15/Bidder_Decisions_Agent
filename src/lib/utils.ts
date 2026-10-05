import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "GBP"): string {
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
  if (amount >= 1_000_000) {
    return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `${symbol}${(amount / 1_000).toFixed(0)}k`;
  }
  return `${symbol}${amount.toLocaleString()}`;
}

export function formatFullCurrency(amount: number, currency: string = "GBP"): string {
  const symbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
  return `${symbol}${amount.toLocaleString()}`;
}
