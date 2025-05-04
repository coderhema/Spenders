"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { PlusCircle, Edit, Trash2, AlertTriangle } from "lucide-react"
import { getBudgetGoals, saveBudgetGoal, deleteBudgetGoal } from "@/utils/db"
import { getExpensesByPeriod } from "@/utils/db"
import { formatCurrency } from "@/utils/format-utils"
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
} from "@/utils/date-utils"
import {
  type BudgetGoal,
  type BudgetPeriod,
  type BudgetStatus,
  getBudgetStatus,
  getBudgetStatusColor,
  getBudgetStatusTextColor,
} from "@/utils/budget-model"

// Default categories
const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Dining" },
  { id: "transport", name: "Transportation" },
  { id: "shopping", name: "Shopping" },
  { id: "entertainment", name: "Entertainment" },
  { id: "utilities", name: "Bills & Utilities" },
  { id: "health", name: "Health" },
  { id: "other", name: "Other (Custom)" },
]

interface BudgetGoalsProps {
  currentTheme: any
  currentCurrency: string
}

export default function BudgetGoals({ currentTheme, currentCurrency }: BudgetGoalsProps) {
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([])
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatus[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [editingGoal, setEditingGoal] = useState<BudgetGoal | null>(null)

  // Form state
  const [category, setCategory] = useState<string>("food")
  const [customCategory, setCustomCategory] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [period, setPeriod] = useState<BudgetPeriod>("monthly")
  const [formError, setFormError] = useState<string>("")
  const [showCustomCategory, setShowCustomCategory] = useState<boolean>(false)

  useEffect(() => {
    loadBudgetGoals()
  }, [])

  // When category changes, check if it's "other" to show custom input
  useEffect(() => {
    setShowCustomCategory(category === "other")
    if (category !== "other") {
      setCustomCategory("")
    }
  }, [category])

  const loadBudgetGoals = async () => {
    try {
      setLoading(true)
      const goals = await getBudgetGoals()
      setBudgetGoals(goals)

      // Calculate current status for each goal
      const statuses = await Promise.all(
        goals.map(async (goal) => {
          const currentAmount = await calculateCurrentSpending(goal.category, goal.period)
          const percentage = goal.amount > 0 ? (currentAmount / goal.amount) * 100 : 0
          const status = getBudgetStatus(percentage)

          return {
            id: goal.id,
            category: goal.category,
            goal: goal.amount,
            current: currentAmount,
            percentage,
            period: goal.period,
            status,
          }
        }),
      )

      setBudgetStatuses(statuses)
    } catch (error) {
      console.error("Error loading budget goals:", error)
      toast.error("Failed to load budget goals")
    } finally {
      setLoading(false)
    }
  }

  const calculateCurrentSpending = async (category: string, period: BudgetPeriod): Promise<number> => {
    let startTime: number
    let endTime: number

    // Determine time range based on period
    switch (period) {
      case "daily":
        startTime = getStartOfDay()
        endTime = getEndOfDay()
        break
      case "weekly":
        startTime = getStartOfWeek()
        endTime = getEndOfWeek()
        break
      case "monthly":
        startTime = getStartOfMonth()
        endTime = getEndOfMonth()
        break
      default:
        startTime = getStartOfMonth()
        endTime = getEndOfMonth()
    }

    try {
      // Get expenses for the specified category and time period
      const expenses = await getExpensesByPeriod(startTime, endTime)
      const categoryExpenses = expenses.filter((expense) => expense.category === category)

      // Calculate total amount
      return categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    } catch (error) {
      console.error("Error calculating current spending:", error)
      return 0
    }
  }

  const handleSubmit = async () => {
    // Validate form
    if (!category) {
      setFormError("Please select a category")
      return
    }

    // Validate custom category if "other" is selected
    if (category === "other" && !customCategory.trim()) {
      setFormError("Please enter a custom category name")
      return
    }

    const amountValue = Number.parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      setFormError("Please enter a valid amount")
      return
    }

    if (!period) {
      setFormError("Please select a period")
      return
    }

    setFormError("")

    // Determine the final category to use
    const finalCategory = category === "other" ? customCategory.trim().toLowerCase() : category

    try {
      // Create or update budget goal
      const goal: BudgetGoal = editingGoal
        ? {
            ...editingGoal,
            category: finalCategory,
            amount: amountValue,
            period,
            updatedAt: Date.now(),
          }
        : {
            id: crypto.randomUUID(),
            category: finalCategory,
            amount: amountValue,
            period,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }

      await saveBudgetGoal(goal)

      // Reset form and close dialog
      resetForm()
      setIsDialogOpen(false)

      // Reload budget goals
      await loadBudgetGoals()

      toast.success(editingGoal ? "Budget goal updated" : "Budget goal created")
    } catch (error) {
      console.error("Error saving budget goal:", error)
      toast.error("Failed to save budget goal")
    }
  }

  const handleEdit = (goal: BudgetGoal) => {
    setEditingGoal(goal)

    // Check if this is a custom category
    const isCustomCategory = !DEFAULT_CATEGORIES.some((cat) => cat.id === goal.category && cat.id !== "other")

    if (isCustomCategory) {
      setCategory("other")
      setCustomCategory(goal.category)
      setShowCustomCategory(true)
    } else {
      setCategory(goal.category)
      setCustomCategory("")
      setShowCustomCategory(false)
    }

    setAmount(goal.amount.toString())
    setPeriod(goal.period)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this budget goal?")) {
      try {
        await deleteBudgetGoal(id)
        await loadBudgetGoals()
        toast.success("Budget goal deleted")
      } catch (error) {
        console.error("Error deleting budget goal:", error)
        toast.error("Failed to delete budget goal")
      }
    }
  }

  const resetForm = () => {
    setEditingGoal(null)
    setCategory("food")
    setCustomCategory("")
    setShowCustomCategory(false)
    setAmount("")
    setPeriod("monthly")
    setFormError("")
  }

  const getCategoryName = (categoryId: string) => {
    const category = DEFAULT_CATEGORIES.find((c) => c.id === categoryId)
    return category ? category.name : categoryId.charAt(0).toUpperCase() + categoryId.slice(1)
  }

  const getPeriodName = (period: BudgetPeriod) => {
    switch (period) {
      case "daily":
        return "Daily"
      case "weekly":
        return "Weekly"
      case "monthly":
        return "Monthly"
      default:
        return period
    }
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
    <Card className={`${currentTheme.card} rounded-[24px]`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className={`text-lg font-semibold ${currentTheme.text.primary}`}>Budget Goals</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className={`rounded-full ${currentTheme.button} text-white`} size="sm">
              <PlusCircle className="w-4 h-4 mr-1" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? "Edit Budget Goal" : "Create Budget Goal"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showCustomCategory && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Category Name</label>
                  <Input
                    type="text"
                    placeholder="Enter custom category name"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Period</label>
                <Select value={period} onValueChange={(value) => setPeriod(value as BudgetPeriod)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {budgetStatuses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No budget goals yet</p>
            <p className="text-sm mt-2">Add a budget goal to track your spending</p>
          </div>
        ) : (
          <div className="space-y-6">
            {budgetStatuses.map((status) => (
              <div key={status.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{getCategoryName(status.category)}</h3>
                    <p className="text-sm text-gray-500">{getPeriodName(status.period)} Budget</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(budgetGoals.find((goal) => goal.id === status.id)!)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(status.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {status.status === "over" && <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />}
                    <p className={`text-sm ${getBudgetStatusTextColor(status.status)}`}>
                      {status.status === "under"
                        ? "Under budget"
                        : status.status === "near"
                          ? "Near limit"
                          : "Over budget"}
                    </p>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-baseline">
                      <span className="font-medium">{formatCurrency(status.current, 2, currentCurrency).value}</span>
                      {formatCurrency(status.current, 2, currentCurrency).suffix && (
                        <span className="text-xs ml-0.5">
                          {formatCurrency(status.current, 2, currentCurrency).suffix}
                        </span>
                      )}
                      <span className="mx-1">/</span>
                      <span>{formatCurrency(status.goal, 2, currentCurrency).value}</span>
                      {formatCurrency(status.goal, 2, currentCurrency).suffix && (
                        <span className="text-xs ml-0.5">{formatCurrency(status.goal, 2, currentCurrency).suffix}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getBudgetStatusColor(status.status)} h-2 rounded-full`}
                    style={{ width: `${Math.min(status.percentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right text-gray-500">{status.percentage.toFixed(1)}% used</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
