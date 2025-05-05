"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusCircle, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { addExpense, getCustomCategories } from "@/utils/db"
import { logUserActivity } from "@/utils/vercel-analytics"
import AddCategoryDialog from "./add-category-dialog"

// Default categories
const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Dining", color: "#4ade80" },
  { id: "transport", name: "Transportation", color: "#60a5fa" },
  { id: "shopping", name: "Shopping", color: "#f472b6" },
  { id: "entertainment", name: "Entertainment", color: "#a78bfa" },
  { id: "utilities", name: "Bills & Utilities", color: "#fbbf24" },
  { id: "health", name: "Health", color: "#34d399" },
]

interface ExpenseInputFormProps {
  currentTheme: any
  onExpenseAdded: () => void
  playMoneySound: () => void
}

export default function ExpenseInputForm({ currentTheme, onExpenseAdded, playMoneySound }: ExpenseInputFormProps) {
  const [newAmount, setNewAmount] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("food")
  const [note, setNote] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState([...DEFAULT_CATEGORIES])

  // Load custom categories on component mount
  useEffect(() => {
    async function loadCustomCategories() {
      try {
        const customCategories = await getCustomCategories()
        if (customCategories && customCategories.length > 0) {
          // Combine default and custom categories, avoiding duplicates
          const allCategories = [...DEFAULT_CATEGORIES]

          customCategories.forEach((customCat) => {
            if (!allCategories.some((cat) => cat.id === customCat.id)) {
              allCategories.push(customCat)
            }
          })

          setCategories(allCategories)
        }
      } catch (error) {
        console.error("Error loading custom categories:", error)
      }
    }

    loadCustomCategories()
  }, [])

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

    if (!selectedCategory) {
      setError("Please select a category")
      return
    }

    setError("")
    setIsAdding(true)

    // Add new expense with current timestamp and unique ID
    const newExpense = {
      id: crypto.randomUUID(),
      amount,
      timestamp: Date.now(),
      category: selectedCategory,
      note: note.trim() || undefined,
    }

    try {
      // Add to database
      await addExpense(newExpense)

      // Reset form
      setNewAmount("")
      setNote("")

      // Play money sound
      playMoneySound()

      // Log expense added event
      logUserActivity(`expense_added_${selectedCategory}`)

      // Notify parent component
      onExpenseAdded()

      // Show toast notification with Sonner
      toast(`${amount.toFixed(2)} added`, {
        description: `Added to ${categories.find((c) => c.id === selectedCategory)?.name || selectedCategory}`,
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

  // Handle new category added
  const handleCategoryAdded = (newCategory: { id: string; name: string; color: string }) => {
    setCategories((prev) => {
      // Check if category already exists
      if (prev.some((cat) => cat.id === newCategory.id)) {
        return prev
      }
      return [...prev, newCategory]
    })

    // Select the newly added category
    setSelectedCategory(newCategory.id)
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
              <SelectContent className="max-h-[200px] overflow-y-auto">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                      {category.name}
                    </div>
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

        <div className="flex justify-between items-center">
          <Input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`rounded-xl ${currentTheme.input.background} ${
              currentTheme.input.border
            } ${currentTheme.input.focus} ${currentTheme.input.text} ${currentTheme.input.placeholder}`}
          />

          <div className="ml-2">
            <AddCategoryDialog
              onCategoryAdded={handleCategoryAdded}
              currentTheme={currentTheme}
              trigger={
                <Button variant="outline" size="sm" className="h-10 rounded-xl">
                  <PlusCircle className="w-4 h-4 mr-1" />
                  New
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-2 animate-pulse">{error}</p>}
    </div>
  )
}
