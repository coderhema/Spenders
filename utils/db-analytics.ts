"use server"

import { neon } from "@neondatabase/serverless"
import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL!)

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

// Log user activity
export async function logUserActivity(action: string) {
  try {
    const userId = await getUserId()

    // Skip the user check since we don't have a users table
    // Just log the activity directly
    await sql`INSERT INTO app_usage (user_id, action) VALUES (${userId}, ${action})`

    return { success: true }
  } catch (error) {
    console.error("Error logging user activity:", error)
    return { success: false, error }
  }
}

// Get daily usage stats
export async function getDailyUsageStats(days = 14) {
  try {
    // Use a raw SQL query to avoid parameter binding issues with intervals
    const intervalDays = `${days} days`
    const query = `
      SELECT 
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_actions
      FROM app_usage
      WHERE timestamp > CURRENT_DATE - INTERVAL '${intervalDays}'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `

    const stats = await sql.query(query)
    return { success: true, data: stats.rows }
  } catch (error) {
    console.error("Error getting daily usage stats:", error)
    return { success: false, error }
  }
}

// Get weekly usage stats
export async function getWeeklyUsageStats(weeks = 12) {
  try {
    // Calculate days from weeks and use raw SQL query
    const intervalDays = `${weeks * 7} days`
    const query = `
      SELECT 
        DATE_TRUNC('week', timestamp) as week,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_actions
      FROM app_usage
      WHERE timestamp > CURRENT_DATE - INTERVAL '${intervalDays}'
      GROUP BY DATE_TRUNC('week', timestamp)
      ORDER BY week ASC
    `

    const stats = await sql.query(query)
    return { success: true, data: stats.rows }
  } catch (error) {
    console.error("Error getting weekly usage stats:", error)
    return { success: false, error }
  }
}

// Get total user count
export async function getTotalUsers() {
  try {
    const result = await sql`
      SELECT COUNT(DISTINCT user_id) as total 
      FROM app_usage
    `
    return { success: true, total: result[0]?.total || 0 }
  } catch (error) {
    console.error("Error getting total users:", error)
    return { success: false, error }
  }
}
