"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { addCustomCategory } from "@/utils/db"

// Color options for categories
const COLOR_OPTIONS = [
  { name: "Green", value: "#4ade80" },
  { name: "Blue", value: "#60a5fa" },
  { name: "Pink", value: "#f472b6" },
  { name: "Purple", value: "#a78bfa" },
  { name: "Yellow", value: "#fbbf24" },
  { name: "Teal", value: "#34d399" },
  { name: "Orange", value: "#fb923c" },
  { name: "Red", value: "#f87171" },
  { name: "Indigo", value: "#818cf8" },
]

interface AddCategoryDialogProps {
  onCategoryAdded: (category: { id: string; name: string; color: string }) => void
  currentTheme: any
  trigger?: React.ReactNode
}

export default function AddCategoryDialog({ onCategoryAdded, currentTheme, trigger }: AddCategoryDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].value)
  const [error, setError] = useState("")

  const handleAddCategory = async () => {
    // Validate input
    if (!categoryName.trim()) {
      setError("Please enter a category name")
      return
    }

    setError("")

    try {
      // Create category ID from name (lowercase, no spaces)
      const categoryId = categoryName.trim().toLowerCase().replace(/\s+/g, "-")

      // Create new category object
      const newCategory = {
        id: categoryId,
        name: categoryName.trim(),
        color: selectedColor,
      }

      // Add to database
      await addCustomCategory(newCategory)

      // Notify parent component
      onCategoryAdded(newCategory)

      // Reset form and close dialog
      setCategoryName("")
      setSelectedColor(COLOR_OPTIONS[0].value)
      setIsOpen(false)

      // Show success toast
      toast.success("Category added", {
        description: `${categoryName} has been added to your categories`,
      })
    } catch (error) {
      console.error("Error adding category:", error)
      toast.error("Failed to add category")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
            <PlusCircle className="h-3.5 w-3.5" />
            Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category Name</label>
            <Input
              type="text"
              placeholder="e.g. Groceries, Rent, Subscriptions"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className={`${currentTheme.input.background} ${currentTheme.input.border}`}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category Color</label>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <div
                  key={color.value}
                  className={`h-10 rounded-md cursor-pointer flex items-center justify-center ${
                    selectedColor === color.value ? "ring-2 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} className={`${currentTheme.button} text-white`}>
              Add Category
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
