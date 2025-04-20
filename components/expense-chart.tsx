"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { getExpenses } from "@/utils/db"
import { formatCurrency } from "@/utils/format-utils"
import {
  getStartOfMonth,
  getEndOfMonth,
  getStartOfPreviousMonth,
  getEndOfPreviousMonth,
  getMonthName,
} from "@/utils/date-utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Pie,
  Cell,
  PieChart,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface ExpenseChartProps {
  currentTheme: any
  currentCurrency: string
}

interface DailyExpense {
  date: string
  amount: number
  formattedDate: string
}

interface CategoryTotal {
  name: string
  value: number
  color: string
}

export default function ExpenseChart({ currentTheme, currentCurrency }: ExpenseChartProps) {
  const [currentMonthData, setCurrentMonthData] = useState<DailyExpense[]>([])
  const [previousMonthData, setPreviousMonthData] = useState<DailyExpense[]>([])
  const [categoryData, setCategoryData] = useState<CategoryTotal[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [currentMonthTotal, setCurrentMonthTotal] = useState<number>(0)
  const [previousMonthTotal, setPreviousMonthTotal] = useState<number>(0)
  const [percentChange, setPercentChange] = useState<number>(0)

  // Category colors
  const categoryColors = {
    food: "#4ade80", // green
    transport: "#60a5fa", // blue
    shopping: "#f472b6", // pink
    entertainment: "#a78bfa", // purple
    utilities: "#fbbf24", // yellow
    health: "#34d399", // emerald
    other: "#94a3b8", // slate
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const expenses = await getExpenses()

        // Get date ranges
        const currentMonthStart = getStartOfMonth()
        const currentMonthEnd = getEndOfMonth()
        const previousMonthStart = getStartOfPreviousMonth()
        const previousMonthEnd = getEndOfPreviousMonth()

        // Filter expenses for current and previous month
        const currentMonthExpenses = expenses.filter(
          (expense) => expense.timestamp >= currentMonthStart && expense.timestamp <= currentMonthEnd,
        )
        const previousMonthExpenses = expenses.filter(
          (expense) => expense.timestamp >= previousMonthStart && expense.timestamp <= previousMonthEnd,
        )

        // Calculate totals
        const currentTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        const previousTotal = previousMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)

        setCurrentMonthTotal(currentTotal)
        setPreviousMonthTotal(previousTotal)

        // Calculate percent change
        if (previousTotal > 0) {
          const change = ((currentTotal - previousTotal) / previousTotal) * 100
          setPercentChange(change)
        } else if (currentTotal > 0) {
          setPercentChange(100) // If previous month was 0, and current month has expenses
        } else {
          setPercentChange(0) // Both months are 0
        }

        // Group by day for current month
        const currentMonthByDay = groupExpensesByDay(currentMonthExpenses, currentMonthStart, currentMonthEnd)
        setCurrentMonthData(currentMonthByDay)

        // Group by day for previous month
        const previousMonthByDay = groupExpensesByDay(previousMonthExpenses, previousMonthStart, previousMonthEnd)
        setPreviousMonthData(previousMonthByDay)

        // Group by category for current month
        const categoryTotals = groupExpensesByCategory(currentMonthExpenses)
        setCategoryData(categoryTotals)
      } catch (error) {
        console.error("Error fetching expense data for chart:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Group expenses by day
  const groupExpensesByDay = (expenses: any[], startDate: number, endDate: number) => {
    // Create a map of dates with 0 amount
    const dateMap = new Map()
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      const dateStr = day.toISOString().split("T")[0]
      const formattedDate = `${day.getDate()}`
      dateMap.set(dateStr, { date: dateStr, amount: 0, formattedDate })
    }

    // Add expense amounts to corresponding dates
    expenses.forEach((expense) => {
      const date = new Date(expense.timestamp)
      const dateStr = date.toISOString().split("T")[0]
      const formattedDate = `${date.getDate()}`

      if (dateMap.has(dateStr)) {
        const existing = dateMap.get(dateStr)
        dateMap.set(dateStr, {
          ...existing,
          amount: existing.amount + expense.amount,
        })
      }
    })

    // Convert map to array and sort by date
    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  }

  // Group expenses by category
  const groupExpensesByCategory = (expenses: any[]) => {
    const categoryMap = new Map()

    // Initialize with all categories
    Object.keys(categoryColors).forEach((category) => {
      categoryMap.set(category, {
        name: getCategoryName(category),
        value: 0,
        color: categoryColors[category as keyof typeof categoryColors],
      })
    })

    // Add expense amounts to corresponding categories
    expenses.forEach((expense) => {
      if (categoryMap.has(expense.category)) {
        const existing = categoryMap.get(expense.category)
        categoryMap.set(expense.category, {
          ...existing,
          value: existing.value + expense.amount,
        })
      } else {
        // Handle any categories not in our predefined list
        categoryMap.set(expense.category, {
          name: getCategoryName(expense.category),
          value: expense.amount,
          color: categoryColors.other,
        })
      }
    })

    // Convert map to array, filter out zero values, and sort by amount
    return Array.from(categoryMap.values())
      .filter((category) => category.value > 0)
      .sort((a, b) => b.value - a.value)
  }

  // Get readable category name
  const getCategoryName = (categoryId: string) => {
    const categories: { [key: string]: string } = {
      food: "Food & Dining",
      transport: "Transportation",
      shopping: "Shopping",
      entertainment: "Entertainment",
      utilities: "Bills & Utilities",
      health: "Health",
      other: "Other",
    }

    return categories[categoryId] || categoryId
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const { value, suffix } = formatCurrency(payload[0].value, 2, currentCurrency)
      return (
        <div
          className={`p-3 border rounded-md shadow-lg ${currentTheme.card} border-${currentTheme.text.tertiary.replace("text-", "")}/20`}
        >
          <p className={`font-medium ${currentTheme.text.primary}`}>Day {label}</p>
          <p className={`text-sm ${currentTheme.text.secondary} flex items-center gap-2`}>
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
            <span className="font-semibold">{value}</span>
            {suffix && <span className="text-xs">{suffix}</span>}
          </p>
        </div>
      )
    }
    return null
  }

  // Custom tooltip for the donut chart
  const DonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { value, suffix } = formatCurrency(payload[0].value, 2, currentCurrency)
      return (
        <div
          className={`p-3 border rounded-md shadow-lg ${currentTheme.card} border-${currentTheme.text.tertiary.replace("text-", "")}/20`}
        >
          <p className={`font-medium ${currentTheme.text.primary}`}>{payload[0].name}</p>
          <div className="flex flex-col gap-1 mt-1">
            <p className={`text-sm ${currentTheme.text.secondary} flex items-center gap-2`}>
              <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
              <span className="font-semibold">{value}</span>
              {suffix && <span className="text-xs">{suffix}</span>}
            </p>
            <p className={`text-xs ${currentTheme.text.tertiary}`}>
              {((payload[0].value / currentMonthTotal) * 100).toFixed(1)}% of total
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </Card>
    )
  }

  return (
    <Card className="p-4 md:p-6 lg:p-8 overflow-hidden w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-2">
        <h2 className={`text-lg md:text-xl font-bold ${currentTheme.text.primary}`}>Expense Trends</h2>
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 px-2 py-1 md:px-3 md:py-1 rounded-full">
            <p className="text-xs md:text-sm font-medium">
              {getMonthName(new Date())}:{" "}
              <span className={percentChange > 0 ? "text-red-500" : "text-green-500"}>
                {percentChange > 0 ? "+" : ""}
                {percentChange.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="donut">
        <TabsList className="mb-4">
          <TabsTrigger value="donut">Category Breakdown</TabsTrigger>
          <TabsTrigger value="comparison">Monthly Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="donut">
          {categoryData.length > 0 ? (
            <div className="h-[250px] md:h-[300px] lg:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%" className="donut-chart-container">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={false}
                    labelLine={false}
                    isAnimationActive={true}
                    onClick={(data) => {
                      toast(`${data.name}: ${formatCurrency(data.value, 2, currentCurrency).value}`, {
                        description: `${((data.value / currentMonthTotal) * 100).toFixed(1)}% of your total spending`,
                        position: "bottom-center",
                        icon: <span className="text-xl">🫰🏾</span>,
                      })
                    }}
                    activeShape={(props) => {
                      const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, name, value, percent } =
                        props
                      const { value: formattedValue, suffix } = formatCurrency(value, 2, currentCurrency)

                      return (
                        <g>
                          {/* Highlighted sector with stroke */}
                          <path
                            d={`M ${cx},${cy} L ${cx + outerRadius * Math.cos((-startAngle * Math.PI) / 180)},${cy + outerRadius * Math.sin((-startAngle * Math.PI) / 180)} A ${outerRadius},${outerRadius} 0 ${endAngle - startAngle > 180 ? 1 : 0},0 ${cx + outerRadius * Math.cos((-endAngle * Math.PI) / 180)},${cy + outerRadius * Math.sin((-endAngle * Math.PI) / 180)} L ${cx},${cy}`}
                            fill={fill}
                            stroke="#fff"
                            strokeWidth={2}
                          />

                          {/* Center text details */}
                          <text x={cx} y={cy - 30} textAnchor="middle" fill="#333" fontSize={14} fontWeight="bold">
                            {name}
                          </text>
                          <text x={cx} y={cy} textAnchor="middle" fill="#333" fontSize={16} fontWeight="bold">
                            {formattedValue}
                            {suffix && suffix}
                          </text>
                          <text x={cx} y={cy + 25} textAnchor="middle" fill="#666" fontSize={14}>
                            {`${(percent * 100).toFixed(1)}%`}
                          </text>
                          <text x={cx} y={cy + 45} textAnchor="middle" fill="#888" fontSize={12}>
                            {`of total spending`}
                          </text>
                        </g>
                      )
                    }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No category data available</p>
              <p className="text-sm mt-2">Start adding expenses to see your category breakdown</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comparison">
          {currentMonthData.length > 0 || previousMonthData.length > 0 ? (
            <div className="h-[250px] md:h-[300px] lg:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="formattedDate" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {currentMonthData.length > 0 && (
                    <Line
                      type="monotone"
                      data={currentMonthData}
                      dataKey="amount"
                      name={`${getMonthName(new Date())} Spending`}
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                  {previousMonthData.length > 0 && (
                    <Line
                      type="monotone"
                      data={previousMonthData}
                      dataKey="amount"
                      name={`${getMonthName(new Date(getStartOfPreviousMonth()))} Spending`}
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No comparison data available</p>
              <p className="text-sm mt-2">Start adding expenses to see monthly comparisons</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
        <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
          <p className="text-xs md:text-sm text-gray-500">Current Month</p>
          <div className="flex items-baseline">
            <span className="text-base md:text-xl font-bold">
              {formatCurrency(currentMonthTotal, 2, currentCurrency).value}
            </span>
            {formatCurrency(currentMonthTotal, 2, currentCurrency).suffix && (
              <span className="text-xs ml-1">{formatCurrency(currentMonthTotal, 2, currentCurrency).suffix}</span>
            )}
          </div>
        </div>
        <div className="bg-gray-50 p-2 md:p-3 rounded-lg">
          <p className="text-xs md:text-sm text-gray-500">Previous Month</p>
          <div className="flex items-baseline">
            <span className="text-base md:text-xl font-bold">
              {formatCurrency(previousMonthTotal, 2, currentCurrency).value}
            </span>
            {formatCurrency(previousMonthTotal, 2, currentCurrency).suffix && (
              <span className="text-xs ml-1">{formatCurrency(previousMonthTotal, 2, currentCurrency).suffix}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
