"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getTotalUsers } from "@/utils/vercel-analytics"
import { Globe, Users, Calendar, Clock } from "lucide-react"
import { getSetting, saveSetting } from "@/utils/db"
import { getUserCountryFromIP } from "@/utils/geo-location"

interface UsageAnalyticsProps {
  currentTheme: any
}

interface CountryInfo {
  code: string
  name: string
  flag: string
}

export default function UsageAnalytics({ currentTheme }: UsageAnalyticsProps) {
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [userCountry, setUserCountry] = useState<CountryInfo>({
    code: "",
    name: "Detecting location...",
    flag: "🌍",
  })
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [daysUsed, setDaysUsed] = useState<number>(0)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Get total users count
        const totalUsersResult = await getTotalUsers()
        if (totalUsersResult.success) {
          setTotalUsers(totalUsersResult.total)
        }

        // Get user's start date from settings
        const savedStartDate = await getSetting("startDate", null)

        if (savedStartDate) {
          // If we have a saved start date, use it
          const startDateObj = new Date(savedStartDate)
          setStartDate(startDateObj)

          // Calculate days since start
          const today = new Date()
          const diffTime = Math.abs(today.getTime() - startDateObj.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          setDaysUsed(diffDays)
        } else {
          // If no start date, set today as the start date
          const today = new Date()
          await saveSetting("startDate", today.toISOString())
          setStartDate(today)
          setDaysUsed(1) // First day of usage
        }

        // Get saved country from settings first
        const savedCountry = await getSetting("userCountry", null)

        if (savedCountry) {
          setUserCountry(savedCountry)
        } else {
          // Fetch user's country based on IP using server action
          const countryInfo = await getUserCountryFromIP()
          setUserCountry(countryInfo)
          await saveSetting("userCountry", countryInfo)
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className={`text-xl font-bold ${currentTheme.text.primary}`}>Your Usage Statistics</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{totalUsers}</p>
            <p className="text-xs text-gray-500 mt-1">All-time registered users</p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Days Active</h3>
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold mt-2">{daysUsed}</p>
            <p className="text-xs text-gray-500 mt-1">
              Since {startDate?.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Your Location</h3>
              <Globe className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex items-center mt-2">
              <span className="text-3xl mr-3" role="img" aria-label={`Flag of ${userCountry.name}`}>
                {userCountry.flag}
              </span>
              <div>
                <p className="font-medium text-lg">{userCountry.name}</p>
                <p className="text-xs text-gray-500">Detected automatically</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-6 w-6 text-blue-500" />
            <h3 className="font-medium text-lg">Your Spenders Journey</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-lg">1</span>
              </div>
              <div>
                <h4 className="font-medium">Started tracking expenses</h4>
                <p className="text-sm text-gray-500">
                  {startDate?.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {daysUsed > 7 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-lg">2</span>
                </div>
                <div>
                  <h4 className="font-medium">Completed first week</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(startDate!.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {daysUsed > 30 && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-600 text-lg">3</span>
                </div>
                <div>
                  <h4 className="font-medium">Completed first month</h4>
                  <p className="text-sm text-gray-500">
                    {new Date(startDate!.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}

            {daysUsed <= 7 && (
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-600 text-lg">?</span>
                </div>
                <div>
                  <h4 className="font-medium">Complete your first week</h4>
                  <p className="text-sm text-gray-500">Keep tracking your expenses to reach this milestone</p>
                </div>
              </div>
            )}

            {daysUsed <= 30 && (
              <div className="flex items-start gap-3 opacity-50">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-600 text-lg">?</span>
                </div>
                <div>
                  <h4 className="font-medium">Complete your first month</h4>
                  <p className="text-sm text-gray-500">Keep tracking your expenses to reach this milestone</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          <p>Your data is stored locally on your device and not shared with others</p>
        </div>
      </CardContent>
    </Card>
  )
}
