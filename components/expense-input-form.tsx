"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addExpense } from "@/utils/db"
import { logUserActivity } from "@/utils/vercel-analytics"

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

interface ExpenseInputFormProps {
  currentTheme: any
  onExpenseAdded: () => void
  playMoneySound: () => void
}

export default function ExpenseInputForm({ currentTheme, onExpenseAdded, playMoneySound }: ExpenseInputFormProps) {
  const [newAmount, setNewAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("food")
  const [customCategory, setCustomCategory] = useState("")
  const [note, setNote] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")
  const [showCustomCategory, setShowCustomCategory] = useState(false)

  // When category changes, check if it's "other" to show custom input
  useEffect(() => {
    setShowCustomCategory(selectedCategory === "other")
    if (selectedCategory !== "other") {
      setCustomCategory("")
    }
  }, [selectedCategory])

  const handleAddExpense = async () => {
    const amount = Number.parseFloat(newAmount)

    // Validate input
    if (isNaN(amount)) {
      setError("Please enter a valid number")
      return
    }

    if (amount <= 0) {
      setError("Amount must be greater than zero")
      return
    }

    // Validate custom category if "other" is selected
    if (selectedCategory === "other" && !customCategory.trim()) {
      setError("Please enter a custom category name")
      return
    }

    setError("")
    setIsAdding(true)

    // Determine the final category to use
    const finalCategory = selectedCategory === "other" ? customCategory.trim().toLowerCase() : selectedCategory

    // Add new expense with current timestamp and unique ID
    const newExpense = {
      id: crypto.randomUUID(),
      amount,
      timestamp: Date.now(),
      category: finalCategory,
      note: note.trim() || undefined,
    }

    try {
      // Add to database
      await addExpense(newExpense)

      // Reset form
      setNewAmount("")
      setNote("")
      if (selectedCategory === "other") {
        setCustomCategory("")
      }

      // Play money sound
      playMoneySound()

      // Log expense added event
      logUserActivity(`expense_added_${finalCategory}`)

      // Notify parent component
      onExpenseAdded()

      // Show toast notification with Sonner
      toast(`${amount.toFixed(2)} added`, {
        description: `Added to ${selectedCategory === "other" ? customCategory : selectedCategory}`,
        position: "bottom-center",
        icon: <span className="text-xl">🫰🏾</span>,
      })
    } catch (error) {
      console.error("Error adding expense:", error)
      toast.error("Failed to add expense")
    } finally {
      setTimeout(() => setIsAdding(false), 300)
    }
  }

  return (
    <div className="pt-6 border-t border-gray-100">
      <div className="space-y-3">
        <div className="relative flex-1">
          <Input
            type="number"
            placeholder="Add expense"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className={`rounded-xl ${currentTheme.input.background} ${
              currentTheme.input.border
            } ${currentTheme.input.focus} ${currentTheme.input.text} ${
              currentTheme.input.placeholder
            } pr-10 ${error ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
            onKeyDown={(e) => e.key === "Enter" && handleAddExpense()}
          />
          {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className={`rounded-xl ${currentTheme.input.background} ${currentTheme.input.border}`}>
                <SelectValue placeholder="Category" />
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

          <Button
            onClick={handleAddExpense}
            className={`rounded-xl ${currentTheme.button} text-white transition-all ${isAdding ? "scale-95" : ""}`}
          >
            <PlusCircle className="w-5 h-5 mr-1" />
            Add
          </Button>
        </div>

        {showCustomCategory && (
          <Input
            type="text"
            placeholder="Enter custom category name"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            className={`rounded-xl ${currentTheme.input.background} ${
              currentTheme.input.border
            } ${currentTheme.input.focus} ${currentTheme.input.text} ${currentTheme.input.placeholder}`}
          />
        )}

        <Input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={`rounded-xl ${currentTheme.input.background} ${
            currentTheme.input.border
          } ${currentTheme.input.focus} ${currentTheme.input.text} ${currentTheme.input.placeholder}`}
        />
      </div>

      {error && <p className="text-red-500 text-sm mt-2 animate-pulse">{error}</p>}
    </div>
  )
}
