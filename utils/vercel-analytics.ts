"use server"

import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

// Get or create a unique user ID
export async function getUserId() {
  const cookieStore = cookies()
  let userId = cookieStore.get("spenders_uid")?.value

  if (!userId) {
    userId = uuidv4()
    // Set cookie to expire in 1 year
    cookieStore.set("spenders_uid", userId, {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      path: "/",
      sameSite: "strict",
    })
  }

  return userId
}

// Log user activity using Vercel Web Analytics
export async function logUserActivity(action: string) {
  try {
    // This function now relies on Vercel Web Analytics
    // The actual tracking happens client-side via the @vercel/analytics package
    return { success: true }
  } catch (error) {
    console.error("Error logging user activity:", error)
    return { success: false, error }
  }
}

// Generate sample analytics data for fallback
function generateSampleData(period: "day" | "week" = "day", limit = 14) {
  return Array.from({ length: limit }, (_, i) => {
    const date = new Date()
    if (period === "day") {
      date.setDate(date.getDate() - (limit - i - 1))
    } else {
      date.setDate(date.getDate() - (limit - i - 1) * 7)
    }

    return {
      date: date.toISOString().split("T")[0],
      unique_users: Math.floor(Math.random() * 50) + 10,
      total_actions: Math.floor(Math.random() * 200) + 50,
    }
  })
}

// Get analytics data - using fallback data instead of API due to issues
export async function getAnalyticsData(period: "day" | "week" = "day", limit = 14) {
  try {
    // Due to API issues, we'll use sample data for now
    // In a production environment, you would uncomment and fix the API call below

    /*
    // Use the Vercel API token to fetch analytics data
    const vercelApiToken = process.env.VERCEL_API_TOKEN

    if (!vercelApiToken) {
      throw new Error("VERCEL_API_TOKEN is not defined")
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()

    // Set start date based on period and limit
    if (period === "day") {
      startDate.setDate(startDate.getDate() - limit)
    } else {
      startDate.setDate(startDate.getDate() - limit * 7)
    }

    // Format dates for API
    const startDateStr = startDate.toISOString().split("T")[0]
    const endDateStr = endDate.toISOString().split("T")[0]

    console.log(`Fetching analytics from ${startDateStr} to ${endDateStr}`)

    // Fetch analytics data from Vercel API
    // Note: You may need to adjust this endpoint based on Vercel's API documentation
    const response = await fetch(
      `https://api.vercel.com/v1/web-analytics/stats?from=${startDateStr}&to=${endDateStr}`,
      {
        headers: {
          Authorization: `Bearer ${vercelApiToken}`,
        },
        cache: "no-store",
      },
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => "No error details available")
      throw new Error(`Failed to fetch analytics data: ${response.status} ${response.statusText}\n${errorText}`)
    }

    const data = await response.json()
    console.log("Analytics API response:", data)

    // Transform the data to match our expected format
    const transformedData =
      data.metrics?.map((metric: any) => ({
        date: metric.date,
        unique_users: metric.visitors || 0,
        total_actions: metric.pageviews || 0,
      })) || []

    // Group by day or week if needed
    let groupedData = transformedData

    if (period === "week") {
      // Group by week
      const weekMap = new Map()

      transformedData.forEach((item: any) => {
        const date = new Date(item.date)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Set to Sunday

        const weekKey = weekStart.toISOString().split("T")[0]

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            date: weekKey,
            unique_users: 0,
            total_actions: 0,
          })
        }

        const weekData = weekMap.get(weekKey)
        weekData.unique_users += item.unique_users
        weekData.total_actions += item.total_actions
      })

      groupedData = Array.from(weekMap.values())
    }

    return { success: true, data: groupedData }
    */

    // Generate sample data for now
    const sampleData = generateSampleData(period, limit)
    return { success: true, data: sampleData, fallback: true }
  } catch (error) {
    console.error("Error getting analytics data:", error)

    // Fallback to sample data if API call fails
    const sampleData = generateSampleData(period, limit)
    return { success: true, data: sampleData, fallback: true }
  }
}

// Get total user count from analytics
export async function getTotalUsers() {
  try {
    // For now, return a reasonable sample value
    return { success: true, total: 125, fallback: true }

    /*
    const analyticsData = await getAnalyticsData("day", 30)

    if (analyticsData.success && analyticsData.data) {
      // Calculate unique users across all days
      const uniqueUserIds = new Set()
      analyticsData.data.forEach((day: any) => {
        if (day.unique_users > 0) {
          uniqueUserIds.add(day.unique_users)
        }
      })

      return {
        success: true,
        total: analyticsData.data.reduce((max: number, item: any) => Math.max(max, item.unique_users), 0),
        fallback: analyticsData.fallback,
      }
    }
    */
  } catch (error) {
    console.error("Error getting total users:", error)
    return { success: false, error, total: 100, fallback: true }
  }
}
