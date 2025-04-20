"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExpenses, deleteExpense } from "@/utils/db"
import { formatDate, formatTime } from "@/utils/date-utils"
import { formatCurrency } from "@/utils/format-utils"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

// Default categories with icons
const CATEGORY_ICONS: Record<string, string> = {
  food: "🍔",
  transport: "🚗",
  shopping: "🛍️",
  entertainment: "🎬",
  utilities: "📱",
  health: "💊",
  other: "📦",
}

interface Transaction {
  id: string
  amount: number
  timestamp: number
  category: string
  note?: string
}

export default function TransactionList({
  currentTheme,
  currentCurrency = "$",
  onTransactionDeleted,
}: {
  currentTheme: any
  currentCurrency?: string
  onTransactionDeleted: () => void
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      setIsLoading(true)
      const expenses = await getExpenses()

      // Sort by timestamp (newest first)
      expenses.sort((a, b) => b.timestamp - a.timestamp)

      setTransactions(expenses)
    } catch (error) {
      console.error("Error loading transactions:", error)
      toast.error("Failed to load transactions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteExpense(id)
        setTransactions(transactions.filter((t) => t.id !== id))
        toast.success("Transaction deleted")
        onTransactionDeleted()
      } catch (error) {
        console.error("Error deleting transaction:", error)
        toast.error("Failed to delete transaction")
      }
    }
  }

  // Group transactions by date
  const groupedTransactions: Record<string, Transaction[]> = {}

  transactions.forEach((transaction) => {
    const date = formatDate(transaction.timestamp)
    if (!groupedTransactions[date]) {
      groupedTransactions[date] = []
    }
    groupedTransactions[date].push(transaction)
  })

  return (
    <Card className={`${currentTheme.card} rounded-[24px] w-full`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg font-semibold ${currentTheme.text.primary}`}>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading transactions...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-center">
            <div className="text-gray-400">
              <p>No transactions yet</p>
              <p className="text-sm mt-2">Add expenses to see your transaction history</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{date}</h3>
                <div className="space-y-3">
                  {dayTransactions.map((transaction) => {
                    const { value, suffix } = formatCurrency(transaction.amount, 2, currentCurrency)
                    const categoryIcon = CATEGORY_ICONS[transaction.category] || "📦"

                    return (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                        onClick={() => {
                          toast(
                            `${transaction.category ? transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1) : "Other"}`,
                            {
                              description:
                                transaction.note ||
                                `${formatCurrency(transaction.amount, 2, currentCurrency).value} on ${formatDate(transaction.timestamp)}`,
                              position: "bottom-center",
                              icon: (
                                <span role="img" aria-label={transaction.category || "Other"}>
                                  {categoryIcon}
                                </span>
                              ),
                            },
                          )
                        }}
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 mr-3">
                            <span role="img" aria-label={transaction.category || "Other"}>
                              {categoryIcon}
                            </span>
                          </div>
                          <div>
                            <p className={`font-medium ${currentTheme.text.secondary}`}>
                              {transaction.category
                                ? transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1)
                                : "Other"}
                            </p>
                            {transaction.note && <p className="text-sm text-gray-500">{transaction.note}</p>}
                            <p className="text-xs text-gray-400">{formatTime(transaction.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <p className={`font-semibold ${currentTheme.text.primary} mr-3`}>
                            {value}
                            {suffix && <span className="text-xs ml-1">{suffix}</span>}
                          </p>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
