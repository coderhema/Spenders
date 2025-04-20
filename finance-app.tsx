"use client"

import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Volume2, VolumeX, Database, BarChart3, History, Home, Target, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { saveExpenses, getExpenses, saveSetting, getSetting } from "./utils/db"
import { logUserActivity } from "./utils/vercel-analytics"
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
} from "./utils/date-utils"
import { formatCurrency } from "./utils/format-utils"
import ExpenseChart from "./components/expense-chart"
import CategorySummary from "./components/category-summary"
import TransactionList from "./components/transaction-list"
import UsageAnalytics from "./components/usage-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ExpenseInputForm from "./components/expense-input-form"
import BudgetGoals from "./components/budget-goals"
import DataExport from "./components/data-export"

interface Expense {
  id: string
  amount: number
  timestamp: number
  category: string
  note?: string
}

// Define theme types
type ThemeColor = {
  name: string
  background: string
  card: string
  text: {
    primary: string
    secondary: string
    tertiary: string
  }
  button: string
  buttonHover: string
  input: {
    background: string
    border: string
    focus: string
    text: string
    placeholder: string
  }
  toast: {
    background: string
    text: string
    border: string
  }
}

// Define available themes
const themes: ThemeColor[] = [
  {
    name: "Emerald",
    background: "bg-emerald-500",
    card: "bg-white",
    text: {
      primary: "text-emerald-700",
      secondary: "text-emerald-600",
      tertiary: "text-emerald-500",
    },
    button: "bg-black hover:bg-gray-800",
    buttonHover: "bg-gray-800",
    input: {
      background: "bg-gray-50",
      border: "border-gray-200",
      focus: "focus:border-emerald-300 focus:ring-emerald-100",
      text: "text-emerald-800",
      placeholder: "placeholder:text-emerald-300",
    },
    toast: {
      background: "white",
      text: "#047857",
      border: "#d1fae5",
    },
  },
  {
    name: "Ocean",
    background: "bg-blue-500",
    card: "bg-white",
    text: {
      primary: "text-blue-700",
      secondary: "text-blue-600",
      tertiary: "text-blue-500",
    },
    button: "bg-gray-900 hover:bg-black",
    buttonHover: "bg-black",
    input: {
      background: "bg-gray-50",
      border: "border-gray-200",
      focus: "focus:border-blue-300 focus:ring-blue-100",
      text: "text-blue-800",
      placeholder: "placeholder:text-blue-300",
    },
    toast: {
      background: "white",
      text: "#1d4ed8",
      border: "#dbeafe",
    },
  },
  {
    name: "Royal",
    background: "bg-purple-500",
    card: "bg-white",
    text: {
      primary: "text-purple-700",
      secondary: "text-purple-600",
      tertiary: "text-purple-500",
    },
    button: "bg-gray-900 hover:bg-black",
    buttonHover: "bg-black",
    input: {
      background: "bg-gray-50",
      border: "border-gray-200",
      focus: "focus:border-purple-300 focus:ring-purple-100",
      text: "text-purple-800",
      placeholder: "placeholder:text-purple-300",
    },
    toast: {
      background: "white",
      text: "#7e22ce",
      border: "#f3e8ff",
    },
  },
  {
    name: "Gold",
    background: "bg-amber-500",
    card: "bg-white",
    text: {
      primary: "text-amber-700",
      secondary: "text-amber-600",
      tertiary: "text-amber-500",
    },
    button: "bg-gray-900 hover:bg-black",
    buttonHover: "bg-black",
    input: {
      background: "bg-gray-50",
      border: "border-gray-200",
      focus: "focus:border-amber-300 focus:ring-amber-100",
      text: "text-amber-800",
      placeholder: "placeholder:text-amber-300",
    },
    toast: {
      background: "white",
      text: "#b45309",
      border: "#fef3c7",
    },
  },
  {
    name: "Teal",
    background: "bg-teal-500",
    card: "bg-white",
    text: {
      primary: "text-teal-700",
      secondary: "text-teal-600",
      tertiary: "text-teal-500",
    },
    button: "bg-gray-900 hover:bg-black",
    buttonHover: "bg-black",
    input: {
      background: "bg-gray-50",
      border: "border-gray-200",
      focus: "focus:border-teal-300 focus:ring-teal-100",
      text: "text-teal-800",
      placeholder: "placeholder:text-teal-300",
    },
    toast: {
      background: "white",
      text: "#0f766e",
      border: "#ccfbf1",
    },
  },
]

// Default categories
const DEFAULT_CATEGORIES = [
  { id: "food", name: "Food & Dining" },
  { id: "transport", name: "Transportation" },
  { id: "shopping", name: "Shopping" },
  { id: "entertainment", name: "Entertainment" },
  { id: "utilities", name: "Bills & Utilities" },
  { id: "health", name: "Health" },
  { id: "other", name: "Other" },
]

// Define view types
type ViewType = "home" | "analytics" | "transactions" | "budgets" | "export"

export default function FinanceApp() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [dailyTotal, setDailyTotal] = useState(0)
  const [weeklyTotal, setWeeklyTotal] = useState(0)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [isAdding, setIsAdding] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<ThemeColor>(themes[0])
  const [isThemeChanging, setIsThemeChanging] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dbInitialized, setDbInitialized] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>("home")
  const [lastCalculationDate, setLastCalculationDate] = useState<Date | null>(null)
  const [currentCurrency, setCurrentCurrency] = useState<string>("$")
  const [analyticsTab, setAnalyticsTab] = useState<string>("expenses")
  const [categoryData, setCategoryData] = useState<any[]>([])

  // Audio reference
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio on component mount
  useEffect(() => {
    // Create audio element directly in the DOM for better compatibility
    const audio = document.createElement("audio")
    audio.src =
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/money-pickup-2-89563-vwI1vyHrwHPllfVD5sFKDYnNOLx8hF.mp3" // Direct URL to the audio file
    audio.preload = "auto"

    // Set up event listeners
    audio.addEventListener("canplaythrough", () => {
      setAudioLoaded(true)
      console.log("Audio loaded successfully")
    })

    audio.addEventListener("error", (e) => {
      console.error("Audio loading error:", e)
      setAudioLoaded(false)
    })

    audioRef.current = audio

    return () => {
      // Cleanup audio on unmount
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.remove()
        audioRef.current = null
      }
    }
  }, [])

  // Initialize database and load data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true)

        // Load expenses from IndexedDB
        const savedExpenses = await getExpenses()
        if (savedExpenses && savedExpenses.length > 0) {
          setExpenses(savedExpenses)
        }

        // Load theme preference
        const themeIndex = await getSetting("themeIndex", 0)
        if (themeIndex >= 0 && themeIndex < themes.length) {
          setCurrentTheme(themes[themeIndex])
        }

        // Load sound preference
        const soundSetting = await getSetting("soundEnabled", true)
        setSoundEnabled(soundSetting)

        // Load last calculation date
        const lastCalcDate = await getSetting("lastCalculationDate", null)
        if (lastCalcDate) {
          setLastCalculationDate(new Date(lastCalcDate))
        }

        // Load currency preference
        const currencySetting = await getSetting("currency", "$")
        setCurrentCurrency(currencySetting)

        // Log app open event
        await logUserActivity("app_open")

        setDbInitialized(true)
      } catch (error) {
        console.error("Error initializing app data:", error)
        toast.error("Failed to load your data", {
          description: "Your data could not be loaded from the database",
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [])

  // Save expenses to IndexedDB whenever they change
  useEffect(() => {
    if (dbInitialized && expenses.length > 0) {
      saveExpenses(expenses).catch((error) => {
        console.error("Error saving expenses to IndexedDB:", error)
      })
    }
  }, [expenses, dbInitialized])

  // Save sound preference to IndexedDB
  useEffect(() => {
    if (dbInitialized) {
      saveSetting("soundEnabled", soundEnabled).catch((error) => {
        console.error("Error saving sound setting to IndexedDB:", error)
      })
    }
  }, [soundEnabled, dbInitialized])

  // Calculate totals based on time periods and check for day change
  useEffect(() => {
    const calculateTotals = async () => {
      const now = new Date()
      const today = getStartOfDay(now)

      // Check if we need to reset daily total (new day)
      if (lastCalculationDate) {
        const lastCalcDay = getStartOfDay(lastCalculationDate)

        // If it's a new day, we should reset the daily total
        if (today > lastCalcDay) {
          console.log("New day detected, resetting daily total")
          // We don't need to do anything special here as we'll recalculate below
        }
      }

      // Save current calculation date
      if (dbInitialized) {
        await saveSetting("lastCalculationDate", now.toISOString())
        setLastCalculationDate(now)
      }

      // Get time period boundaries
      const dayStart = getStartOfDay()
      const dayEnd = getEndOfDay()
      const weekStart = getStartOfWeek()
      const weekEnd = getEndOfWeek()
      const monthStart = getStartOfMonth()
      const monthEnd = getEndOfMonth()

      // Calculate totals for each time period
      const daily = expenses
        .filter((expense) => expense.timestamp >= dayStart && expense.timestamp <= dayEnd)
        .reduce((sum, expense) => sum + expense.amount, 0)

      const weekly = expenses
        .filter((expense) => expense.timestamp >= weekStart && expense.timestamp <= weekEnd)
        .reduce((sum, expense) => sum + expense.amount, 0)

      const monthly = expenses
        .filter((expense) => expense.timestamp >= monthStart && expense.timestamp <= monthEnd)
        .reduce((sum, expense) => sum + expense.amount, 0)

      setDailyTotal(daily)
      setWeeklyTotal(weekly)
      setMonthlyTotal(monthly)

      // Calculate category data for export
      const categoryMap = new Map()

      // Initialize with all categories
      DEFAULT_CATEGORIES.forEach((category) => {
        categoryMap.set(category.id, {
          name: category.name,
          value: 0,
          percentage: 0,
          color: "#94a3b8",
        })
      })

      // Add expense amounts to corresponding categories
      const monthlyExpenses = expenses.filter(
        (expense) => expense.timestamp >= monthStart && expense.timestamp <= monthEnd,
      )

      monthlyExpenses.forEach((expense) => {
        if (categoryMap.has(expense.category)) {
          const existing = categoryMap.get(expense.category)
          categoryMap.set(expense.category, {
            ...existing,
            value: existing.value + expense.amount,
          })
        } else {
          // Handle any categories not in our predefined list
          categoryMap.set(expense.category, {
            name: expense.category,
            value: expense.amount,
            percentage: 0,
            color: "#94a3b8",
          })
        }
      })

      // Calculate percentages
      if (monthly > 0) {
        categoryMap.forEach((category, id) => {
          categoryMap.set(id, {
            ...category,
            percentage: (category.value / monthly) * 100,
          })
        })
      }

      // Convert map to array and sort by amount
      const sortedCategories = Array.from(categoryMap.values())
        .filter((category) => category.value > 0)
        .sort((a, b) => b.value - a.value)

      setCategoryData(sortedCategories)
    }

    calculateTotals()
  }, [expenses, dbInitialized, lastCalculationDate])

  // Update toast theme when current theme changes
  useEffect(() => {
    document.documentElement.style.setProperty("--toast-bg", currentTheme.toast.background)
    document.documentElement.style.setProperty("--toast-text", currentTheme.toast.text)
    document.documentElement.style.setProperty("--toast-border", currentTheme.toast.border)
  }, [currentTheme])

  // Log view changes for analytics
  useEffect(() => {
    if (dbInitialized && currentView) {
      logUserActivity(`view_${currentView}`)
    }
  }, [currentView, dbInitialized])

  // Play money sound
  const playMoneySound = () => {
    if (soundEnabled && audioRef.current && audioLoaded) {
      try {
        // Reset the audio to the beginning if it's already playing
        audioRef.current.currentTime = 0

        // Play the sound with a promise to catch any errors
        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Error playing sound:", error)
          })
        }
      } catch (error) {
        console.error("Error playing sound:", error)
      }
    }
  }

  // Toggle sound on/off
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)

    toast(`Sound ${!soundEnabled ? "enabled" : "disabled"}`, {
      description: `Money sounds are now ${!soundEnabled ? "on" : "off"}`,
      position: "bottom-center",
      icon: <span className="text-xl">🫰🏾</span>,
    })

    // Log sound toggle event
    if (dbInitialized) {
      logUserActivity(`sound_${!soundEnabled ? "enabled" : "disabled"}`)
    }
  }

  // Toggle currency
  const toggleCurrency = () => {
    // Cycle through common currencies: $, €, £, ¥, ₦
    const currencies = ["$", "€", "£", "¥", "₦"]
    const currentIndex = currencies.indexOf(currentCurrency)
    const nextIndex = (currentIndex + 1) % currencies.length
    const newCurrency = currencies[nextIndex]

    setCurrentCurrency(newCurrency)

    // Save currency preference
    if (dbInitialized) {
      saveSetting("currency", newCurrency).catch((error) => {
        console.error("Error saving currency setting to IndexedDB:", error)
      })
    }

    // Log currency change event
    if (dbInitialized) {
      logUserActivity(`currency_changed_to_${newCurrency}`)
    }

    toast(`Currency: ${newCurrency}`, {
      description: "Your currency has been updated",
      position: "bottom-center",
      icon: <span className="text-xl">🫰🏾</span>,
    })
  }

  // Change to a random theme
  const shuffleTheme = () => {
    setIsThemeChanging(true)

    // Get current theme index
    const currentIndex = themes.findIndex((theme) => theme.name === currentTheme.name)

    // Select next theme (or loop back to first)
    const nextIndex = (currentIndex + 1) % themes.length
    const newTheme = themes[nextIndex]

    // Save theme preference
    if (dbInitialized) {
      saveSetting("themeIndex", nextIndex).catch((error) => {
        console.error("Error saving theme setting to IndexedDB:", error)
      })
    }

    // Log theme change event
    if (dbInitialized) {
      logUserActivity(`theme_changed_to_${newTheme.name}`)
    }

    // Update theme with animation
    setTimeout(() => {
      setCurrentTheme(newTheme)
      setIsThemeChanging(false)

      toast(`Theme: ${newTheme.name}`, {
        description: "Your theme has been updated",
        position: "bottom-center",
        icon: <span className="text-xl">🫰🏾</span>,
      })
    }, 300)
  }

  // Clear all data from IndexedDB
  const clearAllData = async () => {
    if (confirm("Are you sure you want to clear all your expense data? This cannot be undone.")) {
      try {
        // Clear expenses
        setExpenses([])
        await saveExpenses([])

        // Log data cleared event
        if (dbInitialized) {
          logUserActivity("data_cleared")
        }

        toast.success("All data cleared", {
          description: "Your expense data has been reset",
          icon: <Database className="h-5 w-5" />,
        })
      } catch (error) {
        console.error("Error clearing data:", error)
        toast.error("Failed to clear data", {
          description: "There was an error clearing your data",
        })
      }
    }
  }

  // Handle transaction deleted
  const handleTransactionDeleted = () => {
    // Reload expenses
    getExpenses()
      .then((updatedExpenses) => {
        setExpenses(updatedExpenses)
      })
      .catch((error) => {
        console.error("Error reloading expenses:", error)
      })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-emerald-500 flex items-center justify-center">
        <div className="bg-white p-8 rounded-[32px] shadow-lg flex flex-col items-center">
          <div className="text-4xl mb-4">🫰🏾</div>
          <p className="text-emerald-700 text-xl font-medium">Loading your expenses...</p>
        </div>
      </div>
    )
  }

  // Format currency values with proper suffixes
  const { value: dailyValue, suffix: dailySuffix } = formatCurrency(dailyTotal, 2, currentCurrency)
  const { value: weeklyValue, suffix: weeklySuffix } = formatCurrency(weeklyTotal, 2, currentCurrency)
  const { value: monthlyValue, suffix: monthlySuffix } = formatCurrency(monthlyTotal, 2, currentCurrency)

  return (
    <div
      className={`min-h-screen ${currentTheme.background} transition-colors duration-500 flex flex-col items-center p-4 sm:p-6 pb-24`}
    >
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="text-4xl pl-2" aria-label="Pinched fingers emoji logo">
            🫰🏾
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleCurrency}
              className="rounded-full w-10 h-10 p-0 bg-white/20 hover:bg-white/30 text-white"
              aria-label="Change currency"
            >
              <span className="text-sm font-bold">{currentCurrency}</span>
            </Button>
            <Button
              onClick={toggleSound}
              className="rounded-full w-10 h-10 p-0 bg-white/20 hover:bg-white/30 text-white"
              aria-label={soundEnabled ? "Disable sound" : "Enable sound"}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              onClick={shuffleTheme}
              disabled={isThemeChanging}
              className="rounded-full w-10 h-10 p-0 bg-white/20 hover:bg-white/30 text-white"
              aria-label="Change theme"
            >
              <RefreshCw className={`w-5 h-5 ${isThemeChanging ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {currentView === "home" && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`${currentTheme.card} rounded-[32px] p-6 md:p-8 shadow-lg overflow-hidden`}>
                <div className="space-y-3 mb-8">
                  <motion.div
                    className="flex items-baseline flex-wrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span
                      className={`${currentTheme.text.primary} text-4xl sm:text-6xl md:text-7xl font-bold tracking-tighter truncate max-w-full sm:max-w-[80%]`}
                    >
                      {monthlyValue}
                    </span>
                    {monthlySuffix && (
                      <span className={`${currentTheme.text.primary} text-xl md:text-xl font-bold ml-1`}>
                        {monthlySuffix}
                      </span>
                    )}
                    <span className={`${currentTheme.text.primary} text-2xl md:text-3xl font-bold ml-1`}>(m)</span>
                  </motion.div>
                  <motion.div
                    className="flex items-baseline flex-wrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    <span
                      className={`${currentTheme.text.secondary} text-5xl md:text-6xl font-bold tracking-tighter truncate max-w-[80%]`}
                    >
                      {weeklyValue}
                    </span>
                    {weeklySuffix && (
                      <span className={`${currentTheme.text.secondary} text-lg md:text-xl font-bold ml-1`}>
                        {weeklySuffix}
                      </span>
                    )}
                    <span className={`${currentTheme.text.secondary} text-xl md:text-2xl font-bold ml-1`}>(w)</span>
                  </motion.div>
                  <motion.div
                    className="flex items-baseline flex-wrap"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <span
                      className={`${currentTheme.text.tertiary} text-4xl md:text-5xl font-bold tracking-tighter truncate max-w-[80%]`}
                    >
                      {dailyValue}
                    </span>
                    {dailySuffix && (
                      <span className={`${currentTheme.text.tertiary} text-base md:text-lg font-bold ml-1`}>
                        {dailySuffix}
                      </span>
                    )}
                    <span className={`${currentTheme.text.tertiary} text-lg md:text-xl font-bold ml-1`}>(d)</span>
                  </motion.div>
                  <p className="text-xs text-gray-400 mt-1">
                    * K = thousands, M = millions
                    <br />* (m) = monthly, (w) = weekly, (d) = daily
                  </p>
                </div>

                {/* Add Expense Form */}
                <ExpenseInputForm
                  currentTheme={currentTheme}
                  onExpenseAdded={() => {
                    // Update expenses
                    getExpenses().then((updatedExpenses) => {
                      setExpenses(updatedExpenses)
                    })
                  }}
                  playMoneySound={playMoneySound}
                />

                {/* Reset Data Button */}
                {expenses.length > 0 && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllData}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Reset All Data
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {currentView === "analytics" && (
            <motion.div
              key="analytics-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Tabs defaultValue="expenses" onValueChange={setAnalyticsTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="expenses" className="flex-1">
                    Expenses
                  </TabsTrigger>
                  <TabsTrigger value="usage" className="flex-1">
                    Usage Stats
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-4">
                  <ExpenseChart currentTheme={currentTheme} currentCurrency={currentCurrency} />
                  <CategorySummary currentTheme={currentTheme} currentCurrency={currentCurrency} />
                </TabsContent>

                <TabsContent value="usage">
                  <UsageAnalytics currentTheme={currentTheme} />
                </TabsContent>
              </Tabs>
            </motion.div>
          )}

          {currentView === "transactions" && (
            <motion.div
              key="transactions-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TransactionList
                currentTheme={currentTheme}
                currentCurrency={currentCurrency}
                onTransactionDeleted={handleTransactionDeleted}
              />
            </motion.div>
          )}

          {currentView === "budgets" && (
            <motion.div
              key="budgets-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <BudgetGoals currentTheme={currentTheme} currentCurrency={currentCurrency} />
            </motion.div>
          )}

          {currentView === "export" && (
            <motion.div
              key="export-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DataExport
                currentTheme={currentTheme}
                currentCurrency={currentCurrency}
                dailyTotal={dailyTotal}
                weeklyTotal={weeklyTotal}
                monthlyTotal={monthlyTotal}
                categoryData={categoryData}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Section */}
        <div className="mt-6 text-center">
          <a
            href="https://x.com/coderhema"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors text-sm"
          >
            <span>Send improvement feedback to</span>
            <span className="font-bold">@coderhema</span>
          </a>
        </div>
      </div>

      {/* Fixed Navigation */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50">
        <div className="bg-white rounded-full p-1.5 shadow-lg flex gap-1 border border-gray-200">
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentView("home")
              // Add haptic feedback if supported
              if ("vibrate" in navigator) {
                navigator.vibrate(50)
              }
            }}
            className={`rounded-full transition-all duration-300 ${
              currentView === "home"
                ? `${currentTheme.background} text-white shadow-md scale-110`
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentView("analytics")
              if ("vibrate" in navigator) {
                navigator.vibrate(50)
              }
            }}
            className={`rounded-full transition-all duration-300 ${
              currentView === "analytics"
                ? `${currentTheme.background} text-white shadow-md scale-110`
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
            aria-label="Analytics"
          >
            <BarChart3 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentView("transactions")
              if ("vibrate" in navigator) {
                navigator.vibrate(50)
              }
            }}
            className={`rounded-full transition-all duration-300 ${
              currentView === "transactions"
                ? `${currentTheme.background} text-white shadow-md scale-110`
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
            aria-label="Transactions"
          >
            <History className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentView("budgets")
              if ("vibrate" in navigator) {
                navigator.vibrate(50)
              }
            }}
            className={`rounded-full transition-all duration-300 ${
              currentView === "budgets"
                ? `${currentTheme.background} text-white shadow-md scale-110`
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
            aria-label="Budget Goals"
          >
            <Target className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setCurrentView("export")
              if ("vibrate" in navigator) {
                navigator.vibrate(50)
              }
            }}
            className={`rounded-full transition-all duration-300 ${
              currentView === "export"
                ? `${currentTheme.background} text-white shadow-md scale-110`
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            }`}
            aria-label="Export Data"
          >
            <FileText className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Hidden audio element as fallback */}
      <audio
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/money-pickup-2-89563-vwI1vyHrwHPllfVD5sFKDYnNOLx8hF.mp3"
        id="money-sound"
        preload="auto"
        style={{ display: "none" }}
      />
    </div>
  )
}
