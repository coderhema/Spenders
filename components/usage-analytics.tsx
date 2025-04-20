"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO } from "date-fns"
import { getAnalyticsData } from "@/utils/vercel-analytics"

interface UsageAnalyticsProps {
  currentTheme: any
}

interface UsageData {
  date: string
  unique_users: number
  total_actions: number
  [key: string]: any
}

export default function UsageAnalytics({ currentTheme }: UsageAnalyticsProps) {
  const [dailyData, setDailyData] = useState<UsageData[]>([])
  const [weeklyData, setWeeklyData] = useState<UsageData[]>([])
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [viewType, setViewType] = useState<"line" | "bar">("line")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch daily stats using Vercel Analytics
        const dailyResult = await getAnalyticsData("day", 14)
        if (dailyResult.success && dailyResult.data) {
          setDailyData(dailyResult.data)
        }

        // Fetch weekly stats using Vercel Analytics
        const weeklyResult = await getAnalyticsData("week", 12)
        if (weeklyResult.success && weeklyResult.data) {
          setWeeklyData(weeklyResult.data)
        }

        // Set a reasonable total users count
        setTotalUsers(
          dailyResult.success ? dailyResult.data.reduce((max, item) => Math.max(max, item.unique_users), 0) : 0,
        )
      } catch (err) {
        console.error("Error fetching analytics data:", err)
        setError("Failed to load analytics data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 border rounded-md shadow-lg bg-white border-${currentTheme.text.tertiary.replace("text-", "")}/20`}
        >
          <p className={`font-medium ${currentTheme.text.primary}`}>{label}</p>
          <div className="space-y-1 mt-1">
            <p className="text-sm flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="font-semibold">Users: {payload[0].value}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
              <span className="font-semibold">Actions: {payload[1].value}</span>
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

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${currentTheme.text.primary}`}>Usage Analytics</h2>
        <div className="flex gap-2">
          <div className="bg-gray-100 px-3 py-1 rounded-full">
            <p className="text-sm font-medium">Total Users: {totalUsers}</p>
          </div>
          <div className="flex">
            <button
              className={`px-2 py-1 text-xs rounded-l-md ${viewType === "line" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onClick={() => setViewType("line")}
            >
              Line
            </button>
            <button
              className={`px-2 py-1 text-xs rounded-r-md ${viewType === "bar" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
              onClick={() => setViewType("bar")}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="daily">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          {dailyData.length > 0 ? (
            <div className="h-[250px] md:h-[300px] lg:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {viewType === "line" ? (
                  <LineChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (typeof value === "string") {
                          // Try to parse the date if it's a string
                          try {
                            return format(parseISO(value), "MMM dd")
                          } catch {
                            return value
                          }
                        }
                        return value
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="unique_users"
                      name="Users"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_actions"
                      name="Actions"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={dailyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (typeof value === "string") {
                          try {
                            return format(parseISO(value), "MMM dd")
                          } catch {
                            return value
                          }
                        }
                        return value
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="unique_users" name="Users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_actions" name="Actions" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No daily data available yet</p>
              <p className="text-sm mt-2">Start using the app to see analytics</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="weekly">
          {weeklyData.length > 0 ? (
            <div className="h-[250px] md:h-[300px] lg:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {viewType === "line" ? (
                  <LineChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (typeof value === "string") {
                          try {
                            return format(parseISO(value), "MMM dd")
                          } catch {
                            return value
                          }
                        }
                        return value
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="unique_users"
                      name="Users"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total_actions"
                      name="Actions"
                      stroke="#ec4899"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={weeklyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => {
                        if (typeof value === "string") {
                          try {
                            return format(parseISO(value), "MMM dd")
                          } catch {
                            return value
                          }
                        }
                        return value
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="unique_users" name="Users" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_actions" name="Actions" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No weekly data available yet</p>
              <p className="text-sm mt-2">Start using the app to see analytics</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-xs text-gray-400">
        <p>Data is collected anonymously to improve the app experience</p>
      </div>
    </Card>
  )
}
