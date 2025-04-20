"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { getExpenses } from "@/utils/db"
import { formatCurrency } from "@/utils/format-utils"
import { getStartOfMonth, getEndOfMonth } from "@/utils/date-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "react-hot-toast"

interface CategorySummaryProps {
  currentTheme: any
  currentCurrency: string
}

interface CategoryData {
  id: string
  name: string
  amount: number
  percentage: number
  color: string
}

export default function CategorySummary({ currentTheme, currentCurrency }: CategorySummaryProps) {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [totalSpent, setTotalSpent] = useState<number>(0)

  // Category definitions
  const categoryDefinitions = [
    { id: "food", name: "Food & Dining", color: "#4ade80" },
    { id: "transport", name: "Transportation", color: "#60a5fa" },
    { id: "shopping", name: "Shopping", color: "#f472b6" },
    { id: "entertainment", name: "Entertainment", color: "#a78bfa" },
    { id: "utilities", name: "Bills & Utilities", color: "#fbbf24" },
    { id: "health", name: "Health", color: "#34d399" },
    { id: "other", name: "Other", color: "#94a3b8" },
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const expenses = await getExpenses()

        // Get current month range
        const monthStart = getStartOfMonth()
        const monthEnd = getEndOfMonth()

        // Filter expenses for current month
        const currentMonthExpenses = expenses.filter(
          (expense) => expense.timestamp >= monthStart && expense.timestamp <= monthEnd,
        )

        // Calculate total spent
        const total = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        setTotalSpent(total)

        // Group by category
        const categoryMap = new Map()

        // Initialize with all categories
        categoryDefinitions.forEach((category) => {
          categoryMap.set(category.id, { ...category, amount: 0, percentage: 0 })
        })

        // Add expense amounts to corresponding categories
        currentMonthExpenses.forEach((expense) => {
          if (categoryMap.has(expense.category)) {
            const existing = categoryMap.get(expense.category)
            categoryMap.set(expense.category, {
              ...existing,
              amount: existing.amount + expense.amount,
            })
          } else {
            // Handle any categories not in our predefined list
            categoryMap.set(expense.category, {
              id: expense.category,
              name: expense.category,
              amount: expense.amount,
              percentage: 0,
              color: "#94a3b8", // Default to gray
            })
          }
        })

        // Calculate percentages
        if (total > 0) {
          categoryMap.forEach((category, id) => {
            categoryMap.set(id, {
              ...category,
              percentage: (category.amount / total) * 100,
            })
          })
        }

        // Convert map to array and sort by amount
        const sortedCategories = Array.from(categoryMap.values())
          .filter((category) => category.amount > 0)
          .sort((a, b) => b.amount - a.amount)

        setCategories(sortedCategories)
      } catch (error) {
        console.error("Error fetching category data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get progress bar color based on percentage
  const getProgressColor = (percentage: number) => {
    if (percentage <= 30) return "bg-green-500"
    if (percentage <= 70) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6 lg:p-8 w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${currentTheme.text.primary}`}>Category Breakdown</h2>
        <div className="bg-gray-100 px-3 py-1 rounded-full">
          <p className="text-sm font-medium">
            Total: {formatCurrency(totalSpent, 2, currentCurrency).value}
            {formatCurrency(totalSpent, 2, currentCurrency).suffix && (
              <span className="text-xs ml-1">{formatCurrency(totalSpent, 2, currentCurrency).suffix}</span>
            )}
          </p>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="space-y-1 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              onClick={() => {
                toast(`${category.name}: ${formatCurrency(category.amount, 2, currentCurrency).value}`, {
                  description: `${category.percentage.toFixed(1)}% of your total spending`,
                  position: "bottom-center",
                  icon: <span className="text-xl">🫰🏾</span>,
                })
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="text-sm">
                  {formatCurrency(category.amount, 2, currentCurrency).value}
                  {formatCurrency(category.amount, 2, currentCurrency).suffix && (
                    <span className="text-xs ml-1">{formatCurrency(category.amount, 2, currentCurrency).suffix}</span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${getProgressColor(category.percentage)} h-2 rounded-full`}
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-right">{category.percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No category data available</p>
          <p className="text-sm mt-2">Start adding expenses to see your category breakdown</p>
        </div>
      )}
    </Card>
  )
}
