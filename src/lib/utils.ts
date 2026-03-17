import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Bill calculation helpers
export function calculateElectricBill(prevUnit: number, currUnit: number, costPerUnit: number): number {
  const netUnits = currUnit - prevUnit;
  return netUnits * costPerUnit;
}

export function calculateTotalBill(
  baseRent: number,
  electricBill: number,
  gasBill: number = 0,
  waterBill: number = 0,
  otherCharges: { label: string; amount: number }[] = []
): number {
  const otherTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
  return baseRent + electricBill + gasBill + waterBill + otherTotal;
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
}

export function getBillStatusColor(status: string): string {
  switch (status) {
    case "PAID": return "text-emerald-400";
    case "UNPAID": return "text-red-400";
    case "PARTIAL": return "text-amber-400";
    default: return "text-gray-400";
  }
}

export function getBillStatusBg(status: string): string {
  switch (status) {
    case "PAID": return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    case "UNPAID": return "bg-red-500/10 border-red-500/20 text-red-400";
    case "PARTIAL": return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    default: return "bg-gray-500/10 border-gray-500/20 text-gray-400";
  }
}
