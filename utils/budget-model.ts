// Budget goal model
export interface BudgetGoal {
  id: string
  category: string
  amount: number
  period: "daily" | "weekly" | "monthly"
  createdAt: number
  updatedAt: number
}

// Budget period types
export type BudgetPeriod = "daily" | "weekly" | "monthly"

// Budget status
export interface BudgetStatus {
  id: string
  category: string
  goal: number
  current: number
  percentage: number
  period: BudgetPeriod
  status: "under" | "near" | "over"
}

// Get status based on percentage
export function getBudgetStatus(percentage: number): "under" | "near" | "over" {
  if (percentage >= 100) return "over"
  if (percentage >= 80) return "near"
  return "under"
}

// Get color based on budget status
export function getBudgetStatusColor(status: "under" | "near" | "over"): string {
  switch (status) {
    case "under":
      return "bg-green-500"
    case "near":
      return "bg-yellow-500"
    case "over":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

// Get text color based on budget status
export function getBudgetStatusTextColor(status: "under" | "near" | "over"): string {
  switch (status) {
    case "under":
      return "text-green-600"
    case "near":
      return "text-yellow-600"
    case "over":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}
