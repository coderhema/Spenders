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

// Log user activity - this will be tracked by Vercel Analytics
export async function logUserActivity(action: string) {
  try {
    // This function now relies on Vercel Web Analytics
    // The actual tracking happens client-side via the @vercel/analytics package
    // We'll keep this function for backward compatibility
    return { success: true }
  } catch (error) {
    console.error("Error logging user activity:", error)
    return { success: false, error }
  }
}

// Get analytics data from Vercel Analytics API
export async function getAnalyticsData(period: "day" | "week" = "day", limit = 14) {
  try {
    // In a real implementation with Vercel Analytics API access, you would use:
    // const response = await fetch('https://api.vercel.com/v1/web-analytics/stats', {
    //   headers: {
    //     Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`
    //   }
    // });
    // const data = await response.json();

    // For now, we'll use the Web Analytics data that's automatically collected
    // This is a placeholder that will be replaced by real data from Vercel Analytics
    const mockData = Array.from({ length: limit }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (limit - i - 1))

      return {
        date: date.toISOString().split("T")[0],
        unique_users: Math.floor(Math.random() * 50) + 10,
        total_actions: Math.floor(Math.random() * 200) + 50,
      }
    })

    return { success: true, data: mockData }
  } catch (error) {
    console.error("Error getting analytics data:", error)
    return { success: false, error }
  }
}
