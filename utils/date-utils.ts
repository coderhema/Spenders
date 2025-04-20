// Utility functions for date formatting

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0") // Month is 0-indexed
  const year = date.getFullYear()
  return `${year}-${month}-${day}`
}

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"

  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'

  return `${hours}:${minutes} ${ampm}`
}

// Get start of day timestamp
export function getStartOfDay(date = new Date()): number {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

// Get end of day timestamp
export function getEndOfDay(date = new Date()): number {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end.getTime()
}

// Get start of week timestamp (Sunday)
export function getStartOfWeek(date = new Date()): number {
  const start = new Date(date)
  const day = start.getDay() // 0 = Sunday, 1 = Monday, etc.
  start.setDate(start.getDate() - day) // Go back to Sunday
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

// Get end of week timestamp (Saturday)
export function getEndOfWeek(date = new Date()): number {
  const end = new Date(date)
  const day = end.getDay() // 0 = Sunday, 1 = Monday, etc.
  end.setDate(end.getDate() + (6 - day)) // Go forward to Saturday
  end.setHours(23, 59, 59, 999)
  return end.getTime()
}

// Get start of month timestamp
export function getStartOfMonth(date = new Date()): number {
  const start = new Date(date)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

// Get end of month timestamp
export function getEndOfMonth(date = new Date()): number {
  const end = new Date(date)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0) // Last day of previous month
  end.setHours(23, 59, 59, 999)
  return end.getTime()
}

// Get start of previous month timestamp
export function getStartOfPreviousMonth(date = new Date()): number {
  const start = new Date(date)
  start.setMonth(start.getMonth() - 1)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

// Get end of previous month timestamp
export function getEndOfPreviousMonth(date = new Date()): number {
  const end = new Date(date)
  end.setDate(0) // Last day of previous month
  end.setHours(23, 59, 59, 999)
  return end.getTime()
}

// Get month name
export function getMonthName(date = new Date()): string {
  return date.toLocaleString("default", { month: "long" })
}
